import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout = ({ children, activePage, setActivePage, setPreselectedAgent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: '#050507' }}>

      {/* ── Global ambient grid ───────────────────────────────────────────── */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none" style={{ zIndex: 0, opacity: 0.6 }} />

      {/* ── Ambient corner glow ───────────────────────────────────────────── */}
      <div className="fixed pointer-events-none" style={{
        zIndex: 0,
        top: '-10%', right: '-5%',
        width: '40vw', height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.025) 0%, transparent 70%)',
      }} />
      <div className="fixed pointer-events-none" style={{
        zIndex: 0,
        bottom: '-10%', left: '15%',
        width: '35vw', height: '35vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.018) 0%, transparent 70%)',
      }} />

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
        />
      </div>

      {/* ── TopBar + main content ─────────────────────────────────────────── */}
      <TopBar
        activePage={activePage}
        setActivePage={setActivePage}
        setPreselectedAgent={setPreselectedAgent}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <main className="relative lg:ml-64 pt-16 min-h-screen" style={{ zIndex: 1 }}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
