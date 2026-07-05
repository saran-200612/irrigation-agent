const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers,
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
  signup: (email, password, full_name) => fetchJson('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name }),
  }),

  login: async (email, password) => {
    const data = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    return data;
  },

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
