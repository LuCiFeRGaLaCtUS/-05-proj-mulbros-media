import React from 'react';
import { settingsTeam } from '../../config/mockData';

export const TeamManager = () => {
  return (
    <div className="relative bg-zinc-900 rounded-xl p-6 border border-amber-900/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/15 via-zinc-900 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
      <div className="relative z-10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/80">
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Role</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Allocation</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {settingsTeam.map((member, index) => (
              <tr key={index} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
                <td className="py-3 px-4 text-sm text-zinc-200 font-medium">{member.name}</td>
                <td className="py-3 px-4 text-sm text-zinc-400">{member.role}</td>
                <td className="py-3 px-4 text-sm text-zinc-400">{member.allocation}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs">
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
