import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

# Signup
signup_payload = {
    'email': 'demo@example.com',
    'password': 'DemoPass123',
    'full_name': 'Demo User'
}
signup_resp = requests.post(f'{BASE_URL}/auth/signup', json=signup_payload)
print('Signup status:', signup_resp.status_code)
print('Signup response:', signup_resp.json())

# Login
login_payload = {
    'email': 'demo@example.com',
    'password': 'DemoPass123'
}
login_resp = requests.post(f'{BASE_URL}/auth/login', json=login_payload)
print('Login status:', login_resp.status_code)
print('Login response:', login_resp.json())

access_token = login_resp.json().get('access_token')
headers = {'Authorization': f'Bearer {access_token}'}

# Create a field (authenticated)
field_payload = {
    'name': 'Demo Field',
    'crop': 'Wheat',
    'soil_type': 'Loam',
    'area_sqm': 1000.0,
    'latitude': 40.0,
    'longitude': -105.0,
    'growth_stage': 'Seedling',
    'last_watered_at': None
}
create_resp = requests.post(f'{BASE_URL}/fields', json=field_payload, headers=headers)
print('Create field status:', create_resp.status_code)
print('Create field response:', create_resp.json())

# List fields for the user
list_resp = requests.get(f'{BASE_URL}/fields', headers=headers)
print('List fields status:', list_resp.status_code)
print('List fields response:', list_resp.json())
