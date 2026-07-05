import os
import requests
import datetime
from dotenv import load_dotenv

load_dotenv()
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY")
BASE_URL = "https://api.weatherapi.com/v1/forecast.json"

def generate_mock_forecast(lat: float, lon: float, days: int = 7) -> dict:
    """Generates a realistic mock weather forecast structure matching WeatherAPI.com."""
    forecast_days = []
    base_date = datetime.date.today()
    
    # Deterministic base temperature based on latitude
    base_temp = 25.0
    if abs(lat) > 45:
        base_temp = 14.0
    elif abs(lat) < 20:
        base_temp = 32.0
        
    for i in range(days):
        date_obj = base_date + datetime.timedelta(days=i)
        date_str = date_obj.strftime("%Y-%m-%d")
        
        # Standard simulated rain pattern: rain on Day 2 and Day 5
        rain_chance = 0
        precip = 0.0
        if i == 2:
            rain_chance = 85
            precip = 14.5
        elif i == 5:
            rain_chance = 40
            precip = 2.0
            
        temp = base_temp + (i % 3) * 1.2 - 0.5
        humidity = 60 + (i % 2) * 10 if rain_chance == 0 else 88
        
        forecast_days.append({
            "date": date_str,
            "day": {
                "avgtemp_c": round(temp, 1),
                "daily_chance_of_rain": rain_chance,
                "totalprecip_mm": round(precip, 1),
                "avghumidity": humidity
            }
        })
        
    return {
        "forecast": {
            "forecastday": forecast_days
        }
    }

def get_forecast(lat: float, lon: float, days: int = 7) -> dict:
    # If key is missing or placeholder, use simulated forecast
    if not WEATHERAPI_KEY or WEATHERAPI_KEY.startswith("your_"):
        print("WEATHERAPI_KEY not set or placeholder. Using simulated forecast fallback.")
        return generate_mock_forecast(lat, lon, days)
        
    params = {
        "key": WEATHERAPI_KEY,
        "q": f"{lat},{lon}",
        "days": min(days, 10),
        "aqi": "no",
        "alerts": "no",
    }
    
    try:
        resp = requests.get(BASE_URL, params=params, timeout=10)
        # If unauthorized (401), print and fall back rather than raising exception
        if resp.status_code == 401:
            print("WeatherAPI returned 401 Unauthorized. Key might be inactive/invalid. Using simulated forecast fallback.")
            return generate_mock_forecast(lat, lon, days)
            
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"WeatherAPI call failed: {e}. Using simulated forecast fallback.")
        return generate_mock_forecast(lat, lon, days)

def summarize_forecast(raw: dict) -> str:
    lines = []
    if "forecast" not in raw or "forecastday" not in raw["forecast"]:
        return "No forecast data available."
    for day in raw["forecast"]["forecastday"]:
        d = day["day"]
        lines.append(
            f"{day['date']}: rain_chance={d.get('daily_chance_of_rain', 0)}%, "
            f"total_precip_mm={d.get('totalprecip_mm', 0)}, "
            f"avg_temp_c={d.get('avgtemp_c', 0)}, humidity={d.get('avghumidity', 0)}%"
        )
    return "\n".join(lines)
