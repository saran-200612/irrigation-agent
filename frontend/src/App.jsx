import React, { useState, useEffect } from 'react';
import { apiClient } from './api/client';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import AuthPage from './components/AuthPage';

export default function App() {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  });

  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [chatLogs, setChatLogs] = useState([]);
  const [latestSchedule, setLatestSchedule] = useState(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      loadFields();
    }
  }, [token]);

  useEffect(() => {
    if (selectedField) {
      fetchFieldExtras(selectedField.id);
    } else {
      setSchedules([]);
      setWeatherForecast(null);
      setChatLogs([]);
      setLatestSchedule(null);
    }
  }, [selectedField]);

  const loadFields = async () => {
    setFieldsLoading(true);
    setErrorMsg(null);
    try {
      const data = await apiClient.listFields();
      setFields(data);
      if (data.length > 0 && !selectedField) {
        setSelectedField(data[0]);
      }
    } catch (err) {
      setErrorMsg(`Failed to retrieve fields: ${err.message}`);
    } finally {
      setFieldsLoading(false);
    }
  };

  const handleCreateField = async (newFieldData) => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const created = await apiClient.createField(newFieldData);
      setFields((prev) => [...prev, created]);
      setSelectedField(created);
      return created;
    } catch (err) {
      setErrorMsg(`Field creation failed: ${err.message}`);
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const fetchFieldExtras = async (fieldId) => {
    // Weather
    try {
      const raw = await apiClient.getFieldWeather(fieldId);
      // Extract forecastday array from API response
      const days = raw?.forecast?.forecastday || [];
      setWeatherForecast(days);
    } catch (_) {
      setWeatherForecast(null);
    }
    // Schedule history
    try {
      const hist = await apiClient.getScheduleHistory(fieldId);
      setSchedules(hist);
      setLatestSchedule(hist.length > 0 ? hist[0] : null);
    } catch (_) {
      setSchedules([]);
      setLatestSchedule(null);
    }
    // Chat history
    try {
      const chats = await apiClient.getChatHistory(fieldId);
      setChatLogs(chats);
    } catch (_) {
      setChatLogs([]);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!selectedField) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await apiClient.generateSchedule(selectedField.id);
      await fetchFieldExtras(selectedField.id);
    } catch (err) {
      setErrorMsg(`Schedule generation failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = async (message) => {
    if (!selectedField) return;
    setChatLoading(true);
    setErrorMsg(null);
    try {
      const resp = await apiClient.sendChatMessage(selectedField.id, message);
      // Optimistically append user + assistant messages
      setChatLogs((prev) => [
        ...prev,
        { role: 'user', message: message },
        { role: 'assistant', message: resp.response },
      ]);
    } catch (err) {
      setErrorMsg(`Chat failed: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    setToken(null);
  };

  if (!token) {
    return <AuthPage onLoginSuccess={() => setToken(localStorage.getItem('access_token'))} />;
  }

  return (
    <Layout theme={theme} setTheme={setTheme} onSignOut={handleSignOut}>
      <Dashboard
        fields={fields}
        selectedField={selectedField}
        setSelectedField={setSelectedField}
        fieldsLoading={fieldsLoading}
        schedules={schedules}
        weatherForecast={weatherForecast}
        chatLogs={chatLogs}
        errorMsg={errorMsg}
        actionLoading={actionLoading}
        chatLoading={chatLoading}
        latestSchedule={latestSchedule}
        handleCreateField={handleCreateField}
        handleGenerateSchedule={handleGenerateSchedule}
        handleSendChatMessage={handleSendChatMessage}
      />
    </Layout>
  );
}
