import React from 'react';
import { settingsTeam } from '../../config/mockData';

export const TeamManager = () => {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Role</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Allocation</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {settingsTeam.map((member, index) => (
            <tr key={index} className="border-b border-zinc-800/50">
              <td className="py-3 px-4 text-sm text-zinc-200">{member.name}</td>
              <td className="py-3 px-4 text-sm text-zinc-400">{member.role}</td>
              <td className="py-3 px-4 text-sm text-zinc-400">{member.allocation}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs">
                  {member.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};