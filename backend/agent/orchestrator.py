import json
import re
from datetime import datetime
from pydantic import ValidationError

from agent.schemas import IrrigationRecommendation
from agent.weather import get_forecast, summarize_forecast
from agent.prompts import SYSTEM_PROMPT, USER_TEMPLATE, FEW_SHOT_EXAMPLES
from agent.llm_client import call_llm
from rag.retriever import retriever
from db.models import Field

# Sane Agronomic Limits
MAX_WATER_MM = 50.0
MAX_DURATION_MINUTES = 180

def clean_json_response(raw_text: str) -> str:
    """Helper to strip markdown code blocks and retrieve raw JSON string."""
    text = raw_text.strip()
    # Remove markdown code fences if present
    if text.startswith("```"):
        # Match ```json ... ``` or ``` ... ```
        match = re.search(r'```(?:json)?\n(.*)\n```', text, re.DOTALL)
        if match:
            text = match.group(1).strip()
        else:
            text = re.sub(r'^```[a-zA-Z]*\n', '', text)
            text = re.sub(r'\n```$', '', text).strip()
    return text

def apply_guardrails(recommendation: dict, forecast_raw: dict) -> dict:
    """
    Apply code-level guardrails:
    1. Clamp duration_minutes and water_mm to sane ranges.
    2. Skip/reject watering if recommended datetime falls on a day with high rain probability.
    """
    # 1. Clamping values
    orig_water = recommendation["water_mm"]
    orig_duration = recommendation["duration_minutes"]
    
    recommendation["water_mm"] = max(0.0, min(float(orig_water), MAX_WATER_MM))
    recommendation["duration_minutes"] = max(0, min(int(orig_duration), MAX_DURATION_MINUTES))
    
    if recommendation["water_mm"] != orig_water or recommendation["duration_minutes"] != orig_duration:
        recommendation["risk_flags"].append(
            f"Clamped values: Water adjusted from {orig_water}mm to {recommendation['water_mm']}mm, "
            f"duration adjusted from {orig_duration}m to {recommendation['duration_minutes']}m."
        )

    # 2. Rain overriding guardrail
    # We parse the date from recommendation['next_watering_datetime']
    # Target formats: YYYY-MM-DD
    rec_datetime_str = recommendation["next_watering_datetime"]
    target_date_str = None
    try:
        # Try parsing ISO 8601 or similar formats
        parsed_dt = None
        for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                parsed_dt = datetime.strptime(rec_datetime_str[:19], fmt[:19])
                break
            except ValueError:
                continue
        if parsed_dt:
            target_date_str = parsed_dt.strftime("%Y-%m-%d")
    except Exception:
        # Fallback: simple regex search for YYYY-MM-DD
        date_match = re.search(r'\d{4}-\d{2}-\d{2}', rec_datetime_str)
        if date_match:
            target_date_str = date_match.group(0)

    if target_date_str and "forecast" in forecast_raw:
        for day in forecast_raw["forecast"]["forecastday"]:
            if day["date"] == target_date_str:
                rain_chance = day["day"].get("daily_chance_of_rain", 0)
                precip_mm = day["day"].get("totalprecip_mm", 0)
                
                # Guardrail condition: Rain chance >= 70% and expected precip >= 3.0 mm
                if rain_chance >= 70 and precip_mm >= 3.0 and recommendation["water_mm"] > 0:
                    recommendation["water_mm"] = 0.0
                    recommendation["duration_minutes"] = 0
                    recommendation["confidence"] = max(0.5, recommendation["confidence"] - 0.2)
                    warning_msg = (
                        f"Overruled: Rain chance is {rain_chance}% with {precip_mm}mm precipitation "
                        f"expected on {target_date_str}. Irrigation set to 0 to prevent waterlogging."
                    )
                    recommendation["risk_flags"].append(warning_msg)
                    recommendation["reasoning"] += f" [Guardrail Override: {warning_msg}]"
                    break

    return recommendation

def get_irrigation_recommendation(field: Field, forecast_days: int = 7) -> dict:
    """Orchestrates RAG, Weather, and LLM calls to generate irrigation recommendation."""
    # 1. Fetch Weather forecast
    print(f"Fetching forecast for Field '{field.name}' at Lat/Lon: {field.latitude}, {field.longitude}")
    try:
        raw_forecast = get_forecast(field.latitude, field.longitude, days=forecast_days)
        forecast_summary = summarize_forecast(raw_forecast)
    except Exception as e:
        print(f"Weather forecast query failed: {e}")
        raw_forecast = {}
        forecast_summary = "Weather API unavailable. Cannot pull current forecast."

    # 2. Retrieve Agronomy Knowledge via RAG
    k_matches = 3
    retrieved_chunks_list = retriever.retrieve(
        crop=field.crop,
        growth_stage=field.growth_stage,
        question="What is the watering recommendation?",
        k=k_matches
    )
    retrieved_chunks = "\n\n".join(retrieved_chunks_list) if retrieved_chunks_list else "No matching guidelines found."

    # 3. Construct LLM Input
    schema_json_desc = """{
  "next_watering_datetime": "ISO 8601 string",
  "duration_minutes": integer,
  "water_mm": float,
  "confidence": float,
  "reasoning": "string",
  "risk_flags": ["list of strings"]
}"""
    
    last_watered_str = field.last_watered_at.isoformat() if field.last_watered_at else "Never"
    
    user_prompt = USER_TEMPLATE.format(
        k=k_matches,
        retrieved_chunks=retrieved_chunks,
        crop=field.crop,
        growth_stage=field.growth_stage,
        soil_type=field.soil_type,
        area_sqm=field.area_sqm,
        last_watered_at=last_watered_str,
        forecast_summary=forecast_summary,
        schema_json=schema_json_desc
    )

    # 4. Few-shot setup
    messages = []
    for ex in FEW_SHOT_EXAMPLES:
        # Replace template placeholders in examples
        content = ex["content"].replace("{schema_description}", schema_json_desc)
        messages.append({
            "role": ex["role"],
            "content": content
        })
    messages.append({"role": "user", "content": user_prompt})

    # 5. LLM Call with Retry Logic
    raw_response = ""
    parsed_recommendation = None
    
    try:
        print("Calling LLM client for recommendation...")
        raw_response = call_llm(SYSTEM_PROMPT, messages)
        cleaned = clean_json_response(raw_response)
        parsed_recommendation = json.loads(cleaned)
        # Validate Pydantic Schema
        IrrigationRecommendation(**parsed_recommendation)
        print("LLM response matches target schema on first try.")
    except Exception as e:
        print(f"Validation or JSON parsing failed on initial LLM response: {e}")
        # One Retry
        retry_messages = messages + [
            {"role": "assistant", "content": raw_response},
            {
                "role": "user",
                "content": f"Your previous output failed validation: {e}. Return only corrected JSON matching the schema. No explanations, no markdown fences."
            }
        ]
        try:
            print("Attempting validation retry with LLM client...")
            raw_response = call_llm(SYSTEM_PROMPT, retry_messages)
            cleaned = clean_json_response(raw_response)
            parsed_recommendation = json.loads(cleaned)
            # Re-validate
            IrrigationRecommendation(**parsed_recommendation)
            print("LLM response successfully corrected on retry.")
        except Exception as retry_err:
            print(f"LLM retry failed. Using fallback schedule. Error: {retry_err}")
            # Fallback output
            parsed_recommendation = {
                "next_watering_datetime": datetime.utcnow().isoformat(),
                "duration_minutes": 15,
                "water_mm": 3.0,
                "confidence": 0.3,
                "reasoning": f"Fallback schedule issued due to AI parsing error: {retry_err}. Please review manually.",
                "risk_flags": ["Fallback mode activated", "AI response validation failed"]
            }

    # 6. Apply Code-level Guardrails (Clamping + Rain checks)
    final_recommendation = apply_guardrails(parsed_recommendation, raw_forecast)
    final_recommendation["raw_llm_response"] = raw_response

    return final_recommendation
