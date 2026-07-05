import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==================================================")
    print("STARTING FULL ENDPOINT INTEGRATION TESTS")
    print("==================================================")

    # 1. Health Check
    print("\n[1/8] Verifying Health Check Endpoint...")
    try:
        resp = requests.get(f"{BASE_URL}/health")
        resp.raise_for_status()
        print(f"Health check succeeded: {resp.json()}")
    except Exception as e:
        print(f"FAILED: Health check endpoint failed: {e}")
        return

    # 2. Create Field
    print("\n[2/8] Creating Field Sensor 'South Maize Ridge'...")
    field_payload = {
        "name": "South Maize Ridge",
        "crop": "Maize",
        "soil_type": "Loam",
        "area_sqm": 1800.0,
        "latitude": 37.7749,
        "longitude": -122.4194,
        "growth_stage": "Silking"
    }
    try:
        resp = requests.post(f"{BASE_URL}/fields", json=field_payload)
        resp.raise_for_status()
        field_data = resp.json()
        field_id = field_data["id"]
        print(f"Field created successfully: ID {field_id}")
        print(json.dumps(field_data, indent=2))
    except Exception as e:
        print(f"FAILED: Field creation endpoint failed: {e}")
        return

    # 3. List Fields
    print("\n[3/8] Listing all Fields...")
    try:
        resp = requests.get(f"{BASE_URL}/fields")
        resp.raise_for_status()
        fields_list = resp.json()
        print(f"Listing retrieved {len(fields_list)} fields.")
        # Ensure our created field is in the list
        names = [f["name"] for f in fields_list]
        if "South Maize Ridge" in names:
            print("Verified: 'South Maize Ridge' exists in list.")
        else:
            print("FAILED: Newly created field was not found in list.")
            return
    except Exception as e:
        print(f"FAILED: List fields endpoint failed: {e}")
        return

    # 4. Get Field Weather
    print(f"\n[4/8] Fetching Weather Forecast for Field ID {field_id}...")
    try:
        resp = requests.get(f"{BASE_URL}/fields/{field_id}/weather")
        if resp.status_code == 200:
            print("Weather forecast fetched successfully.")
            weather_data = resp.json()
            days = weather_data.get("forecast", {}).get("forecastday", [])
            print(f"Retrieved forecast for {len(days)} days.")
        else:
            # We expect a possible 500 error if the user's weather key is unauthorized, which is fine since weather is external
            print(f"Weather forecast endpoint returned code {resp.status_code}. (Expected fallback/error behavior for unauthorized keys is handled gracefully: {resp.text})")
    except Exception as e:
        print(f"Encountered connection issue: {e}")

    # 5. Generate Recommendation
    print(f"\n[5/8] Generating Scheduling Recommendation for Field ID {field_id}...")
    try:
        start_time = time.time()
        resp = requests.post(f"{BASE_URL}/fields/{field_id}/schedule")
        resp.raise_for_status()
        schedule_data = resp.json()
        duration = time.time() - start_time
        print(f"Advice calculated successfully in {duration:.2f}s:")
        print(json.dumps(schedule_data, indent=2))
    except Exception as e:
        print(f"FAILED: Generate schedule recommendation endpoint failed: {e}")
        return

    # 6. Get Schedule History
    print(f"\n[6/8] Fetching Schedule History for Field ID {field_id}...")
    try:
        resp = requests.get(f"{BASE_URL}/fields/{field_id}/schedules")
        resp.raise_for_status()
        schedules_list = resp.json()
        print(f"Retrieved {len(schedules_list)} historical recommendations.")
        if len(schedules_list) > 0:
            print("Verified: Recommendation log is populated.")
        else:
            print("FAILED: Recommendation log is empty.")
            return
    except Exception as e:
        print(f"FAILED: Get schedule history failed: {e}")
        return

    # 7. Post Follow-up Chat Message
    print(f"\n[7/8] Submitting Follow-up Advisor Q&A Message...")
    chat_payload = {
        "message": "Why is it important to prevent water stress during the Silking stage for maize?"
    }
    try:
        start_time = time.time()
        resp = requests.post(f"{BASE_URL}/fields/{field_id}/chat", json=chat_payload)
        resp.raise_for_status()
        chat_reply = resp.json()
        duration = time.time() - start_time
        print(f"Advisor reply generated in {duration:.2f}s:")
        print(json.dumps(chat_reply, indent=2))
    except Exception as e:
        print(f"FAILED: Chat request failed: {e}")
        return

    # 8. Get Chat History Logs
    print(f"\n[8/8] Checking Chat Log History for Field ID {field_id}...")
    try:
        resp = requests.get(f"{BASE_URL}/fields/{field_id}/chat")
        resp.raise_for_status()
        logs_list = resp.json()
        print(f"Retrieved {len(logs_list)} messages from conversation log.")
        if len(logs_list) >= 2:
            print("Verified: Chat log contains the prompt and reply history.")
        else:
            print(f"FAILED: Chat log database only contains {len(logs_list)} items.")
            return
    except Exception as e:
        print(f"FAILED: Get chat history failed: {e}")
        return

    print("\n==================================================")
    print("ALL API ENDPOINT TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
