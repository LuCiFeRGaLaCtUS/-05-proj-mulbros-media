import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout = ({ children, activePage, setActivePage }) => {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <TopBar activePage={activePage} />
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};