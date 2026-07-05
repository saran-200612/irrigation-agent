SYSTEM_PROMPT = """You are an expert agricultural irrigation advisor. You give precise, safe, water-efficient watering recommendations. Rules:
- Base recommendations only on the weather forecast, soil type, crop, growth stage, and retrieved knowledge given to you — never invent data.
- Prefer caution (slight under-watering) when data is ambiguous or conflicting.
- Reason step by step internally, but output ONLY the final JSON object — no prose, no markdown fences, nothing outside the JSON."""

USER_TEMPLATE = """### Retrieved agronomy knowledge (top {k} matches):
{retrieved_chunks}

### Field data:
Crop: {crop} | Growth stage: {growth_stage} | Soil: {soil_type}
Area: {area_sqm} m² | Last watered: {last_watered_at}

### 7-day weather forecast:
{forecast_summary}

### Output schema (JSON format):
{{
  "next_watering_datetime": "ISO 8601 string representing planned next watering time",
  "duration_minutes": integer (minutes to water, clamp between 0 and 180),
  "water_mm": float (water depth in mm, clamp between 0.0 and 50.0),
  "confidence": float (between 0.0 and 1.0 indicating advice confidence),
  "reasoning": "string detailing your step-by-step soil-water balance logic and rainfall offset calculations",
  "risk_flags": ["list", "of", "potential", "risk", "warnings", "e.g.", "extreme heat", "heavy rain forecasted"]
}}

Return only valid JSON matching the schema above. Do not include markdown formatting or wrappers like ```json."""

FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": """### Retrieved agronomy knowledge (top 1 matches):
Source: tomato.md - Section: 1. Establishment / Transplant Stage (Days 1–14)
Water Need: Low volume but high frequency. Keep top soil layer (0-15 cm) moist to help roots establish. Irrigate daily or every other day with 2-4 mm. Sandy loam needs frequent light irrigation.

### Field data:
Crop: Tomato | Growth stage: Transplant | Soil: Sandy Loam
Area: 500.0 m² | Last watered: 2026-07-03T08:00:00Z

### 7-day weather forecast:
2026-07-04: rain_chance=0%, total_precip_mm=0.0, avg_temp_c=25.0, humidity=60%
2026-07-05: rain_chance=80%, total_precip_mm=12.0, avg_temp_c=22.0, humidity=85%
2026-07-06: rain_chance=10%, total_precip_mm=0.0, avg_temp_c=24.0, humidity=65%

### Output schema (JSON format):
{schema_description}
"""
    },
    {
        "role": "assistant",
        "content": """{
  "next_watering_datetime": "2026-07-06T07:00:00Z",
  "duration_minutes": 0,
  "water_mm": 0.0,
  "confidence": 0.9,
  "reasoning": "The tomato field was last watered on July 3rd. Tomatoes in the transplant stage require frequent light irrigation (2-4 mm). However, the weather forecast predicts an 80% chance of rain on July 5th with 12.0 mm of precipitation, which is more than sufficient. Watering is deferred on July 4th and 5th to allow natural precipitation to satisfy soil moisture needs and prevent root saturation. Next irrigation is planned for the morning of July 6th, pending rain confirmation.",
  "risk_flags": ["Skip watering: high probability of significant rain (12.0 mm) on 2026-07-05"]
}"""
    }
]

CHAT_SYSTEM_PROMPT = """You are an expert agricultural irrigation advisor. The user is asking follow-up questions about the field irrigation schedule that you recommended.
Use the provided field context, weather forecast, and retrieved agronomy guidelines to answer their questions accurately, clearly, and concisely. Keep answers practical and field-actionable. Maintain the persona of a helpful farm advisor."""
