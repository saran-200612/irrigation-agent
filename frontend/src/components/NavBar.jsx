import React from 'react';
import { Droplet } from 'lucide-react';

export default function NavBar({ theme, setTheme }) {
  return (
    <header className="border-b border-water/10 bg-surface/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Droplet className="w-5 h-5 text-water" />
        <div>
          <h1 className="font-display text-lg font-bold tracking-wider uppercase text-text">
            Irrigation Scheduling Agent
            <span className="text-[10px] text-water ml-2 font-mono">V1.2.0</span>
          </h1>
          <p className="text-[10px] font-mono text-text-dim tracking-widest uppercase">
            Node-Operational // Cloud Intelligence Agents
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status indicators */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-text-dim">
          <span>Core: <span className="text-water font-bold">Grok LLM</span></span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Telemetry Connected
          </span>
        </div>

        {/* Theme selector */}
        <div className="flex items-center gap-2 border border-water/10 px-2.5 py-1.5 rounded-[6px] bg-surface/80 text-[11px] text-text-dim">
          <span className="font-semibold uppercase tracking-[0.2em]">Theme</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-transparent border-none text-water font-bold outline-none cursor-pointer font-mono"
          >
            <option value="light" className="bg-surface text-text">LIGHT</option>
            <option value="dark" className="bg-surface text-text">DARK</option>
          </select>
        </div>
      </div>
    </header>
  );
}
