import React from 'react';
import { Cpu, ChevronRight } from 'lucide-react';
import { agentGroups } from '../../config/agents';
import { verticalColors } from '../../config/verticalColors';

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const GroupLabel = ({ name }) => (
  <div className="flex items-center gap-2 px-1 mb-2">
    <div className="w-1 h-2.5 rounded-sm" style={{ background: '#0e7490' }} />
    <span className="text-[11px] font-black uppercase tracking-[0.28em]"
      style={{ color: '#0e7490' }}>
      {name}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(34,211,238,0.35), transparent)' }} />
  </div>
);

export const AgentSelector = ({ selectedAgent, onSelectAgent }) => {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col"
      style={{
        background: '#ffffff',
        borderRight: '1px solid rgba(0,0,0,0.07)',
      }}>

      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0 relative"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.2), transparent)' }} />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <Cpu size={14} style={{ color: '#22d3ee' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#0e7490' }}>
              Neural Agents
            </h3>
            <p className="text-xs font-mono" style={{ color: 'rgba(0,0,0,0.66)' }}>
              SELECT AGENT
            </p>
          </div>
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-5">
          {agentGroups.map((group) => (
            <div key={group.name}>
              <GroupLabel name={group.name} />
              <div className="space-y-1">
                {group.agents.map((agent) => {
                  const vc = verticalColors[agent.vertical] || verticalColors.financing;
                  const isSelected = selectedAgent === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id)}
                      className="w-full rounded-xl p-3 cursor-pointer transition-all text-left group relative overflow-hidden"
                      style={isSelected ? {
                        background: `linear-gradient(135deg, ${vc.dim} 0%, rgba(255,255,255,0.02) 100%)`,
                        border: `1px solid ${vc.neon}30`,
                        boxShadow: vc.glow,
                      } : {
                        background: 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      {/* Hover shimmer */}
                      {!isSelected && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.025)' }} />
                      )}

                      {/* Selected left bar */}
                      {isSelected && (
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                          style={{ background: vc.neon, boxShadow: `0 0 6px ${vc.neon}` }} />
                      )}

                      <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div className="relative w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all"
                          style={isSelected ? {
                            background: vc.dim,
                            border: `1px solid ${vc.neon}55`,
                            color: vc.ink,
                            boxShadow: `0 0 10px ${vc.neon}20`,
                          } : {
                            background: 'rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.09)',
                            color: 'rgba(0,0,0,0.72)',
                          }}>
                          {initials(agent.name)}
                          {/* Online dot overlay */}
                          {agent.status === 'active' && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                              style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)', border: '1.5px solid #ffffff' }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-semibold truncate"
                              style={{ color: isSelected ? '#18181b' : 'rgba(0,0,0,0.80)' }}>
                              {agent.name}
                            </span>
                            {isSelected && (
                              <ChevronRight size={12} style={{ color: vc.ink, flexShrink: 0 }} />
                            )}
                          </div>
                          <p className="text-xs mt-0.5 leading-snug line-clamp-1"
                            style={{ color: 'rgba(0,0,0,0.66)' }}>
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
