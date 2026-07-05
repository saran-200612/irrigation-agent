import React from 'react';

// Days mapping for labels
const getDayName = (dateStr) => {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch (_) {
    return dateStr;
  }
};

const formatDateLabel = (dateStr) => {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return dateStr;
  }
};

export default function WeatherStrip({ forecast = [] }) {
  // If no weather data, render placeholders/skeleton tiles
  const tiles = Array.isArray(forecast) ? forecast.slice(0, 7) : [];

  return (
    <div className="w-full bg-surface border border-water/10 rounded-[6px] p-4">
      <h3 className="font-display text-[13px] tracking-wider uppercase text-text-dim mb-3">
        7-Day Weather Forecast & Instruments
      </h3>
      
      {tiles.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="bg-bg border border-water/5 p-3 rounded-[4px] text-center animate-pulse">
              <div className="h-3 bg-surface w-1/2 mx-auto mb-2 rounded"></div>
              <div className="h-6 bg-surface w-3/4 mx-auto rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {tiles.map((day, idx) => {
            const dateStr = day.date;
            const rainChance = day.day?.daily_chance_of_rain ?? 0;
            const precip = day.day?.totalprecip_mm ?? 0;
            const temp = day.day?.avgtemp_c ?? 0;
            const humidity = day.day?.avghumidity ?? 0;

            const isHighRain = rainChance >= 70;

            return (
              <div
                key={idx}
                className={`bg-bg border p-3 rounded-[4px] flex flex-col justify-between transition-all duration-200 ${
                  isHighRain ? 'border-wheat/40' : 'border-water/5'
                }`}
              >
                {/* Header */}
                <div className="text-center border-b border-surface pb-1.5 mb-2">
                  <div className="font-display text-[12px] font-bold text-text uppercase">
                    {getDayName(dateStr)}
                  </div>
                  <div className="font-sans text-[10px] text-text-dim">
                    {formatDateLabel(dateStr)}
                  </div>
                </div>

                {/* Values (Instrument Readout) */}
                <div className="flex flex-col space-y-1.5 text-center my-1.5">
                  <div>
                    <span className="font-mono text-[16px] font-bold text-text">
                      {temp.toFixed(1)}
                    </span>
                    <span className="font-sans text-[10px] text-text-dim ml-0.5">°C</span>
                  </div>
                  <div className="flex justify-around text-[10px] font-mono text-text-dim">
                    <div>
                      <span className="text-text">{precip.toFixed(1)}</span>
                      <span>mm</span>
                    </div>
                    <div>
                      <span className="text-text">{humidity}</span>
                      <span>%</span>
                    </div>
                  </div>
                </div>

                {/* Rain Chance Bar Indicator */}
                <div className="mt-2 pt-1 border-t border-surface/50">
                  <div className="flex justify-between items-center text-[9px] font-mono text-text-dim mb-1">
                    <span>Rain</span>
                    <span className={isHighRain ? 'text-wheat font-bold' : 'text-water'}>
                      {rainChance}%
                    </span>
                  </div>
                  <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isHighRain ? 'bg-wheat' : 'bg-water'
                      }`}
                      style={{ width: `${rainChance}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
