import React, { useEffect, useState } from 'react';
import { useParams, Link, NavLink, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import ScheduleCard from '../components/ScheduleCard';
import WeatherStrip from '../components/WeatherStrip';
import ChatPanel from '../components/ChatPanel';
import HistoryTable from '../components/HistoryTable';
import { ArrowLeft, LoaderCircle, LayoutGrid, History, MessageSquareText } from 'lucide-react';

const tabs = [
  { to: '', label: 'Overview', icon: LayoutGrid },
  { to: 'history', label: 'History', icon: History },
  { to: 'chat', label: 'Chat', icon: MessageSquareText },
];

export default function FieldDetailPage({ selectedField, setSelectedField }) {
  const { id } = useParams();
  const location = useLocation();
  const [field, setField] = useState(selectedField || null);
  const [schedules, setSchedules] = useState([]);
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const loadFieldDetails = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const fieldResponse = await apiClient.getField(id);
        setField(fieldResponse);
        setSelectedField?.(fieldResponse);
        const [historyData, weatherData, chatData] = await Promise.all([
          apiClient.getScheduleHistory(id),
          apiClient.getFieldWeather(id).catch(() => null),
          apiClient.getChatHistory(id),
        ]);
        setSchedules(historyData);
        setWeatherForecast(weatherData?.forecast?.forecastday || []);
        setChatLogs(chatData);
      } catch (err) {
        setErrorMsg(err.message || 'Unable to load field details');
      } finally {
        setLoading(false);
      }
    };

    loadFieldDetails();
  }, [id, setSelectedField]);

  const handleGenerateSchedule = async () => {
    if (!field) return;
    setActionLoading(true);
    try {
      const newSchedule = await apiClient.generateSchedule(field.id);
      setSchedules(prev => [newSchedule, ...prev]);
      const weatherData = await apiClient.getFieldWeather(field.id).catch(() => null);
      setWeatherForecast(weatherData?.forecast?.forecastday || []);
    } catch (err) {
      setErrorMsg(err.message || 'Calculation run failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = async (msgText) => {
    if (!field) return;
    setChatLoading(true);
    const tempUserMsg = { role: 'user', message: msgText, created_at: new Date().toISOString() };
    setChatLogs(prev => [...prev, tempUserMsg]);
    try {
      const reply = await apiClient.sendChatMessage(field.id, msgText);
      const tempAssistantMsg = { role: 'assistant', message: reply.response, created_at: new Date().toISOString() };
      setChatLogs(prev => [...prev, tempAssistantMsg]);
    } catch (err) {
      setErrorMsg(err.message || 'Chat request failed');
    } finally {
      setChatLoading(false);
    }
  };

  const latestSchedule = schedules[0] || null;
  const isHistoryView = location.pathname.endsWith('/history');
  const isChatView = location.pathname.endsWith('/chat');

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-text-dim">Field detail</p>
          <h1 className="font-display text-2xl font-bold text-text">{field?.name || 'Field details'}</h1>
        </div>
        <Link to="/fields" className="inline-flex items-center gap-2 text-sm text-water hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to fields
        </Link>
      </div>

      {loading ? (
        <div className="bg-surface border border-water/10 rounded-[8px] p-10 flex flex-col items-center justify-center min-h-[260px] text-center shadow-sm">
          <LoaderCircle className="h-8 w-8 text-water animate-spin mb-3" />
          <h2 className="font-display text-lg font-semibold text-text">Loading field insights</h2>
          <p className="text-sm text-text-dim mt-2">Fetching weather, schedules, and chat context for this field.</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-surface border border-water/10 rounded-[8px] p-6 text-sm text-wheat">{errorMsg}</div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-water/10 bg-surface p-2 shadow-sm">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={label}
                to={to ? `/fields/${field.id}/${to}` : `/fields/${field.id}`}
                end={to === ''}
                className={({ isActive }) => `inline-flex items-center gap-2 rounded-[6px] px-3 py-2 text-sm transition-colors ${isActive ? 'bg-water/10 text-text' : 'text-text-dim hover:bg-water/5 hover:text-text'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {isHistoryView ? (
            <HistoryTable history={schedules} />
          ) : isChatView ? (
            <ChatPanel chatHistory={chatLogs} onSendMessage={handleSendChatMessage} isLoading={chatLoading} />
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <ScheduleCard schedule={latestSchedule} onRegenerate={handleGenerateSchedule} isLoading={actionLoading} />
                <div className="bg-surface border border-water/10 rounded-[8px] p-5 shadow-sm">
                  <h2 className="font-display text-sm uppercase tracking-[0.25em] text-text-dim mb-4">Field profile</h2>
                  <dl className="space-y-3 text-sm text-text">
                    <div className="flex justify-between gap-3"><dt className="text-text-dim">Crop</dt><dd className="font-medium">{field.crop}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-text-dim">Growth Stage</dt><dd>{field.growth_stage}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-text-dim">Soil</dt><dd>{field.soil_type}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-text-dim">Area</dt><dd>{field.area_sqm?.toLocaleString()} m²</dd></div>
                  </dl>
                </div>
              </div>

              <WeatherStrip forecast={weatherForecast} />

              <div className="grid gap-6 xl:grid-cols-2">
                <ChatPanel chatHistory={chatLogs} onSendMessage={handleSendChatMessage} isLoading={chatLoading} />
                <HistoryTable history={schedules} />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
