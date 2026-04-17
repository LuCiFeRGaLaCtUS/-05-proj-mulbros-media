import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout = ({ children, activePage, setActivePage, setPreselectedAgent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 transition-colors duration-300">
      {/* ── Mobile overlay — tap outside sidebar to close ─────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar — fixed on desktop, slide-in drawer on mobile ─────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            setSidebarOpen(false); // close drawer on mobile after navigation
          }}
        />
      </div>

      {/* ── TopBar + main content ──────────────────────────────────────────── */}
      <TopBar
        activePage={activePage}
        setActivePage={setActivePage}
        setPreselectedAgent={setPreselectedAgent}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
