import React from 'react';
import { Calendar, Clock, Droplets, AlertTriangle, RefreshCw } from 'lucide-react';

const formatDate = (isoString) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch (_) {
    return isoString;
  }
};

export default function ScheduleCard({ schedule, onRegenerate, isLoading }) {
  if (!schedule) {
    return (
      <div className="bg-surface border border-water/10 rounded-[6px] p-6 text-center flex flex-col items-center justify-center h-full min-h-[220px]">
        <Droplets className="w-12 h-12 text-water/40 mb-3 animate-pulse" />
        <p className="text-text-dim text-[14px] max-w-xs">
          No schedule recommended for this sensor yet.
        </p>
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="mt-4 bg-water hover:bg-water/80 disabled:bg-water/30 text-bg font-display text-[12px] font-bold uppercase tracking-wider px-4 py-2 rounded-[4px] flex items-center gap-1.5 transition-colors"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Generate Recommendation
            </>
          )}
        </button>
      </div>
    );
  }

  const {
    recommended_datetime,
    duration_minutes,
    water_mm,
    confidence,
    reasoning,
    risk_flags = []
  } = schedule;

  return (
    <div className="bg-surface border border-water/10 rounded-[6px] p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex justify-between items-start border-b border-water/10 pb-3 mb-4">
          <div>
            <span className="font-display text-[11px] font-bold text-water uppercase tracking-widest block">
              Active Watering Schedule
            </span>
            <span className="text-[14px] text-text font-medium flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4 text-text-dim" />
              {formatDate(recommended_datetime)}
            </span>
          </div>

          <button
            onClick={onRegenerate}
            disabled={isLoading}
            title="Recalculate advice"
            className="p-1.5 rounded-[4px] border border-water/20 hover:border-water text-water hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quantities readouts */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-bg border border-water/5 p-3 rounded-[4px] flex items-center gap-3">
            <Clock className="w-6 h-6 text-water" />
            <div>
              <span className="font-sans text-[10px] text-text-dim block">Run Duration</span>
              <span className="font-mono text-lg font-bold text-text">
                {duration_minutes}
              </span>
              <span className="text-[10px] text-text-dim ml-0.5">mins</span>
            </div>
          </div>

          <div className="bg-bg border border-water/5 p-3 rounded-[4px] flex items-center gap-3">
            <Droplets className="w-6 h-6 text-water" />
            <div>
              <span className="font-sans text-[10px] text-text-dim block">Target depth</span>
              <span className="font-mono text-lg font-bold text-text">
                {water_mm.toFixed(1)}
              </span>
              <span className="text-[10px] text-text-dim ml-0.5">mm</span>
            </div>
          </div>
        </div>

        {/* Advisor reasoning block */}
        <div className="mb-4">
          <span className="font-display text-[11px] font-bold text-text-dim uppercase tracking-wider block mb-1">
            Agronomist Advisor Reasoning
          </span>
          <p className="text-[12.5px] leading-relaxed text-text bg-bg/50 border border-water/5 p-3 rounded-[4px]">
            {reasoning}
          </p>
        </div>
      </div>

      {/* Risk warning alerts if any */}
      {risk_flags.length > 0 && (
        <div className="border-t border-water/10 pt-3 mt-2">
          <span className="font-display text-[11px] font-bold text-wheat uppercase tracking-wider flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical Warning Flags ({risk_flags.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {risk_flags.map((flag, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-wheat/10 text-wheat border border-wheat/30 px-2 py-0.5 rounded-[4px] font-mono leading-none"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
