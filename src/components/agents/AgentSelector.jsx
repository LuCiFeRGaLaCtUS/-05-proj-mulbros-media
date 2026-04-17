import React from 'react';
import { Cpu, ChevronRight } from 'lucide-react';
import { agentGroups } from '../../config/agents';
import { verticalColors } from '../../config/verticalColors';

const initials = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const GroupLabel = ({ name }) => (
  <div className="flex items-center gap-2 px-1 mb-2">
    <div className="w-1 h-2.5 rounded-sm" style={{ background: 'rgba(34,211,238,0.5)' }} />
    <span className="text-[9px] font-black uppercase tracking-[0.28em]"
      style={{ color: 'rgba(34,211,238,0.45)' }}>
      {name}
    </span>
    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(34,211,238,0.15), transparent)' }} />
  </div>
);

export const AgentSelector = ({ selectedAgent, onSelectAgent }) => {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col"
      style={{
        background: '#07070e',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>

      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.2), transparent)' }} />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <Cpu size={14} style={{ color: '#22d3ee' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'rgba(34,211,238,0.9)' }}>
              Neural Agents
            </h3>
            <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
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
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      {/* Hover shimmer */}
                      {!isSelected && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(255,255,255,0.02)' }} />
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
                            border: `1px solid ${vc.neon}40`,
                            color: vc.neon,
                            boxShadow: `0 0 10px ${vc.neon}20`,
                          } : {
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.35)',
                          }}>
                          {initials(agent.name)}
                          {/* Online dot overlay */}
                          {agent.status === 'active' && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                              style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)', border: '1.5px solid #07070e' }} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-semibold truncate"
                              style={{ color: isSelected ? '#e4e4e7' : 'rgba(255,255,255,0.5)' }}>
                              {agent.name}
                            </span>
                            {isSelected && (
                              <ChevronRight size={12} style={{ color: vc.neon, flexShrink: 0 }} />
                            )}
                          </div>
                          <p className="text-xs mt-0.5 leading-snug line-clamp-1"
                            style={{ color: 'rgba(255,255,255,0.25)' }}>
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
