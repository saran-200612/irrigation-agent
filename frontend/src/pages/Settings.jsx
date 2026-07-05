import React from 'react';
import { SunMoon } from 'lucide-react';

export default function Settings({ theme, setTheme }) {
  return (
    <section className="max-w-3xl mx-auto">
      <div className="bg-surface border border-water/10 rounded-[8px] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-full bg-water/10 p-2 text-water">
            <SunMoon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Settings</h1>
            <p className="text-sm text-text-dim">Adjust the look of the dashboard and keep your preference for later visits.</p>
          </div>
        </div>

        <div className="rounded-[8px] border border-water/10 bg-bg/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-text">Theme</p>
              <p className="text-sm text-text-dim">Switch between a light and dark visual palette.</p>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-surface border border-water/10 rounded px-3 py-2 text-text"
            >
              <option value="light" className="bg-surface text-text">Light</option>
              <option value="dark" className="bg-surface text-text">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
