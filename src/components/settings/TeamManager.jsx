import React from 'react';
import { settingsTeam } from '../../config/mockData';

export const TeamManager = () => {
  return (
    <div className="relative bg-white rounded-xl p-6 border border-zinc-200 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-white to-white pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/5 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Name</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Role</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Allocation</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {settingsTeam.map((member, index) => (
              <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="py-3 px-4 text-sm text-zinc-900 font-medium">{member.name}</td>
                <td className="py-3 px-4 text-sm text-zinc-700">{member.role}</td>
                <td className="py-3 px-4 text-sm text-zinc-700">{member.allocation}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-medium">
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
