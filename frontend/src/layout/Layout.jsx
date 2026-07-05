import React from 'react';
import NavBar from '../components/NavBar';

export default function Layout({ theme, setTheme, children }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg text-text font-sans">
      <NavBar theme={theme} setTheme={setTheme} />
      {children}
    </div>
  );
}
