const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const apiClient = {
  listFields: () => fetchJson('/fields'),
  
  createField: (fieldData) => fetchJson('/fields', {
    method: 'POST',
    body: JSON.stringify(fieldData),
  }),
  
  getField: (id) => fetchJson(`/fields/${id}`),
  
  getFieldWeather: (id) => fetchJson(`/fields/${id}/weather`),
  
  generateSchedule: (id) => fetchJson(`/fields/${id}/schedule`, {
    method: 'POST',
  }),
  
  getScheduleHistory: (id) => fetchJson(`/fields/${id}/schedules`),
  
  getChatHistory: (id) => fetchJson(`/fields/${id}/chat`),
  
  sendChatMessage: (id, message) => fetchJson(`/fields/${id}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  
  checkHealth: () => fetchJson('/health'),
};
