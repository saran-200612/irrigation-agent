import React from 'react';
import FieldForm from '../components/FieldForm';
import ScheduleCard from '../components/ScheduleCard';
import MoistureDial from '../components/MoistureDial';
import WeatherStrip from '../components/WeatherStrip';
import ChatPanel from '../components/ChatPanel';
import HistoryTable from '../components/HistoryTable';
import { ShieldAlert, Layers, Compass } from 'lucide-react';

export default function Dashboard({
  fields,
  selectedField,
  setSelectedField,
  fieldsLoading,
  schedules,
  weatherForecast,
  chatLogs,
  errorMsg,
  actionLoading,
  chatLoading,
  latestSchedule,
  handleCreateField,
  handleGenerateSchedule,
  handleSendChatMessage,
}) {
  return (
    <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Rail (Sidebar) */}
      <section className="lg:col-span-1 space-y-6">
        {/* Active Sensor Select tabs */}
        <div className="bg-surface border border-water/10 rounded-[8px] p-4 shadow-sm">
          <span className="font-display text-[11px] font-bold text-text-dim uppercase tracking-wider block mb-2">
            Select Field Sensor
          </span>
          {fieldsLoading ? (
            <div className="space-y-2 py-4">
              <div className="h-8 bg-bg animate-pulse rounded-[4px]"></div>
              <div className="h-8 bg-bg animate-pulse rounded-[4px]"></div>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[12px] text-text-dim mb-1">No fields registered.</p>
              <p className="text-[10px] text-text-dim/50">Register a field below to start advice telemetry.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => setSelectedField(field)}
                  className={`w-full text-left px-3 py-2 rounded-[6px] border text-[13px] font-display flex justify-between items-center transition-all hover:bg-water/5 ${
                    selectedField?.id === field.id
                      ? 'bg-water/10 border-water text-text font-semibold'
                      : 'bg-bg/40 border-water/5 text-text-dim hover:border-water/20 hover:text-text'
                  }`}
                >
                  <span>{field.name}</span>
                  <span className="text-[11px] font-mono bg-bg px-1.5 py-0.5 rounded-[2px] text-text-dim border border-water/5">
                    {field.crop}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Field Form */}
        <FieldForm onSubmit={handleCreateField} isLoading={actionLoading} />

        {/* Selected Field Metadata Readout */}
        {selectedField && (
          <div className="bg-surface border border-water/10 rounded-[8px] p-4 font-mono text-[11.5px] text-text-dim space-y-2 shadow-sm">
            <span className="font-display text-[11px] font-bold text-text-dim uppercase tracking-wider block mb-2 border-b border-water/5 pb-1">
              Sensor Specifications
            </span>
            <div className="flex justify-between">
              <span>Crop Profile</span>
              <span className="text-text font-bold">{selectedField.crop}</span>
            </div>
            <div className="flex justify-between">
              <span>Growth Phase</span>
              <span className="text-text">{selectedField.growth_stage}</span>
            </div>
            <div className="flex justify-between">
              <span>Soil Class</span>
              <span className="text-text">{selectedField.soil_type}</span>
            </div>
            <div className="flex justify-between">
              <span>Field Area</span>
              <span className="text-text">{selectedField.area_sqm.toLocaleString()} m²</span>
            </div>
            <div className="flex justify-between items-center border-t border-water/5 pt-2 mt-2">
              <Compass className="w-3.5 h-3.5 text-water" />
              <span className="text-[10px] text-right">
                {selectedField.latitude.toFixed(4)}°N, {selectedField.longitude.toFixed(4)}°E
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Center / Right Content Panel */}
      <section className="lg:col-span-3 space-y-6">
        {errorMsg && (
          <div className="md:hidden bg-wheat/10 text-wheat border border-wheat/30 p-3 rounded-[6px] text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
        {selectedField ? (
          <>
            {/* Row 1: Signature Moisture Dial + Advice Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <MoistureDial
                  confidence={latestSchedule ? latestSchedule.confidence : 0}
                  waterMm={latestSchedule ? latestSchedule.water_mm : 0}
                />
              </div>
              <div className="md:col-span-2">
                <ScheduleCard
                  schedule={latestSchedule}
                  onRegenerate={handleGenerateSchedule}
                  isLoading={actionLoading}
                />
              </div>
            </div>

            {/* Row 2: WeatherStrip (7 days) */}
            <WeatherStrip forecast={weatherForecast} />

            {/* Row 3: Follow-up Chat & History Logs */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChatPanel
                chatHistory={chatLogs}
                onSendMessage={handleSendChatMessage}
                isLoading={chatLoading}
              />
              <HistoryTable history={schedules} />
            </div>
          </>
        ) : (
          <div className="border border-dashed border-water/20 rounded-[8px] p-12 text-center flex flex-col items-center justify-center min-h-[400px] bg-surface shadow-sm">
            <Layers className="w-16 h-16 text-water/20 mb-4 animate-pulse" />
            <h2 className="font-display text-lg font-bold text-text mb-2">Sensor System Deactivated</h2>
            <p className="text-text-dim text-[14px] max-w-sm mb-6">
              No telemetry sensor arrays are registered in the database. Deploy a field sensor in the sidebar to activate schedule forecasting.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
