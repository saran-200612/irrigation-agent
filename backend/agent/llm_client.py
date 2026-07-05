import os
import requests
from dotenv import load_dotenv

load_dotenv()

def call_llm(system_prompt: str, messages: list[dict], temperature: float = 0.0) -> str:
    grok_key = os.getenv("GROK_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    # Detect if the key is a Groq key (starts with gsk_) or an xAI key
    if grok_key and not grok_key.startswith("your_"):
        if grok_key.startswith("gsk_"):
            print("Detected Groq Cloud API key (gsk_). Routing to api.groq.com...")
            headers = {
                "Authorization": f"Bearer {grok_key}",
                "Content-Type": "application/json"
            }
            formatted_messages = [{"role": "system", "content": system_prompt}] + messages
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": formatted_messages,
                "temperature": temperature
            }
            url = "https://api.groq.com/openai/v1/chat/completions"
        else:
            print("Using xAI Grok API via x.ai completions endpoint...")
            headers = {
                "Authorization": f"Bearer {grok_key}",
                "Content-Type": "application/json"
            }
            formatted_messages = [{"role": "system", "content": system_prompt}] + messages
            payload = {
                "model": "grok-beta",
                "messages": formatted_messages,
                "temperature": temperature
            }
            url = "https://api.x.ai/v1/chat/completions"

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=35)
            resp.raise_for_status()
            res_json = resp.json()
            return res_json["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"LLM API call failed: {e}")
            raise e

    # Fallback to Anthropic Claude if key is provided
    elif anthropic_key and not anthropic_key.startswith("your_"):
        print("Using Anthropic Claude SDK...")
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            
            anthropic_messages = []
            for msg in messages:
                role = msg["role"]
                if role not in ["user", "assistant"]:
                    role = "user"
                anthropic_messages.append({
                    "role": role,
                    "content": msg["content"]
                })
            
            response = client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=4000,
                temperature=temperature,
                system=system_prompt,
                messages=anthropic_messages
            )
            
            content_text = ""
            for block in response.content:
                if block.type == "text":
                    content_text += block.text
            return content_text
            
        except Exception as e:
            print(f"Anthropic API call failed: {e}")
            raise e
            
    else:
        raise ValueError("Neither GROK_API_KEY (or Groq Cloud key) nor ANTHROPIC_API_KEY is configured in the environment.")
