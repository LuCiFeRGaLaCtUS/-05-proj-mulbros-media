import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Plug } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../App';
import { usePersona } from '../../lib/personaState';
import { supabase } from '../../lib/supabase';
import { TOOL_CATEGORIES, TOOLS, SKILL_CATALOG } from '../../config/integrations';

// ── Tokens ───────────────────────────────────────────────────────────────────
const NAVY      = '#0B1D3A';
const INK       = '#0B1D3A';
const INK_2     = '#3A4A66';
const MUTED     = '#888';
const MUTED_2   = '#A3A3A6';
const TEAL      = '#0F6E56';
const TEAL_2    = '#5DCAA5';
const TEAL_TINT = 'rgba(15,110,86,0.08)';
const CORAL     = '#E24B4A';
const CORAL_TINT= 'rgba(226,75,74,0.10)';
const SURFACE   = '#FFFFFF';
const LINE      = '#E0E0E0';
const LINE_2    = '#F0F0F0';

// ── ToolChip — small colored square with glyph ───────────────────────────────
const ToolChip = ({ tool, size = 22 }) => (
  <div style={{
    width: size, height: size, borderRadius: 5, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: tool.color, color: '#fff',
    fontSize: size <= 22 ? 12 : 13, fontWeight: 700, lineHeight: 1,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
    letterSpacing: '-0.02em',
  }}>
    {tool.glyph}
  </div>
);

// ── Stat badge ───────────────────────────────────────────────────────────────
const StatBadge = ({ label, value, color }) => (
  <div style={{
    padding: '12px 16px', borderRadius: 10,
    border: `1px solid ${LINE}`, background: SURFACE,
    minWidth: 140,
  }}>
    <div style={{
      fontSize: 10.5, color: MUTED_2, textTransform: 'uppercase',
      letterSpacing: '0.1em', marginBottom: 4,
      fontFamily: 'DM Mono, monospace',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
      color: color || INK,
      fontFamily: 'DM Mono, monospace',
    }}>
      {value}
    </div>
  </div>
);

// ── Tool card (grid) ─────────────────────────────────────────────────────────
const ToolCard = ({ tool, onToggle, busy }) => {
  const isConnected = tool.status === 'connected';
  const isAvailable = tool.status === 'available';
  const isPlanned   = tool.status === 'planned';
  const [hover, setHover] = useState(false);
  const catLabel = (TOOL_CATEGORIES.find(c => c.id === tool.cat) || {}).label;

  const statusLabel = isConnected ? '● Connected'
                    : isAvailable ? '○ Not connected'
                    : '◌ Planned';
  const statusColor = isConnected ? TEAL : isPlanned ? MUTED_2 : MUTED;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !busy && !isPlanned && onToggle?.(tool.key)}
      style={{
        padding: 16, background: SURFACE,
        border: `1px solid ${hover && !isPlanned ? TEAL : LINE}`,
        borderRadius: 12,
        cursor: isPlanned ? 'default' : busy ? 'wait' : 'pointer',
        transition: 'border-color 140ms ease, box-shadow 140ms ease',
        boxShadow: hover && !isPlanned ? '0 4px 12px rgba(11,29,58,0.06)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 10,
        position: 'relative', minHeight: 152,
        opacity: isPlanned ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <ToolChip tool={tool} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 14, fontWeight: 600, color: INK,
              letterSpacing: '-0.01em',
            }}>
              {tool.name}
            </span>
            {tool.priority === 'required' && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: CORAL,
                background: CORAL_TINT, padding: '2px 6px', borderRadius: 4,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Required
              </span>
            )}
          </div>
          <div style={{
            fontSize: 9.5, color: MUTED_2, textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'DM Mono, monospace',
          }}>
            {catLabel}
          </div>
        </div>
      </div>

      <div style={{
        fontSize: 12.5, color: MUTED, lineHeight: 1.45, flex: 1,
      }}>
        {tool.blurb}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {busy ? (
          <span style={{
            fontSize: 11.5, color: MUTED, fontStyle: 'italic',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <Loader2 size={11} className="animate-spin" /> Connecting…
          </span>
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: statusColor }}>
            {statusLabel}
          </span>
        )}
        {!isPlanned && (
          <button
            disabled={busy}
            onClick={(e) => { e.stopPropagation(); if (!busy) onToggle?.(tool.key); }}
            style={{
              fontSize: 11.5, fontWeight: 600, padding: '5px 11px', borderRadius: 6,
              border: `1px solid ${isConnected ? LINE : TEAL}`,
              background: isConnected ? SURFACE : TEAL,
              color:      isConnected ? INK_2  : '#fff',
              cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {busy ? '…' : isConnected ? 'Disconnect' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// IntegrationsView — full-page Tools + Skills
// ════════════════════════════════════════════════════════════════════════════
export const IntegrationsView = () => {
  const { profile } = useAppContext();
  const { persona } = usePersona();

  const [tools, setTools] = useState(() => TOOLS.map(t => ({ ...t })));
  const [tab,   setTab]   = useState('tools'); // 'tools' | 'skills'
  const [query, setQuery] = useState('');
  const [cat,   setCat]   = useState('all');
  const [busy,  setBusy]  = useState({});      // { [toolKey]: true }
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  // Pull live connection state from user_integrations + override tool.status
  useEffect(() => {
    if (!profile?.id) { setLoadingStatuses(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('service')
        .eq('user_id', profile.id);
      if (!error && Array.isArray(data)) {
        const connectedServices = new Set(data.map(r => r.service));
        setTools(prev => prev.map(t => {
          // Map tool.key -> service name where they differ
          const svc = t.key;
          if (connectedServices.has(svc)) return { ...t, status: 'connected' };
          return t;
        }));
      }
      setLoadingStatuses(false);
    })();
  }, [profile?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter(t => {
      if (cat !== 'all' && t.cat !== cat) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.blurb.toLowerCase().includes(q);
    });
  }, [tools, query, cat]);

  // Connection is provisioned server-side via API keys (per-tool adapters), not a
  // per-user click. Be honest: don't fake a "connected" state (it wasn't persisted
  // and reset on refresh) — explain how it actually gets enabled.
  const toggle = useCallback((key) => {
    const tool = tools.find(t => t.key === key);
    toast(
      `${tool?.name || 'This integration'} is enabled by your workspace admin via its API key on the server. Self-serve connect is coming soon.`,
      { icon: 'ℹ️', duration: 4500 },
    );
  }, [tools]);

  const connectedCount  = tools.filter(t => t.status === 'connected').length;
  const requiredMissing = tools.filter(t => t.priority === 'required' && t.status !== 'connected').length;
  const totalSkills     = SKILL_CATALOG.reduce((n, g) => n + g.skills.length, 0);
  const toolByKey       = useMemo(
    () => Object.fromEntries(tools.map(t => [t.key, t])),
    [tools],
  );

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '32px 40px 64px',
      maxWidth: 1180, width: '100%', margin: '0 auto',
      background: '#F5F6F8',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: TEAL,
          fontFamily: 'DM Mono, monospace',
          marginBottom: 8,
        }}>
          <Plug size={11} /> Tools & Skills
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, margin: '0 0 6px',
          color: NAVY, letterSpacing: '-0.025em',
          fontFamily: "'Inter Tight', sans-serif",
        }}>
          Connect what {persona.name || 'MO'} can act on.
        </h1>
        <p style={{ fontSize: 13.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          {tools.length} integrations across casting, payments, video, comms, search.
          They power {totalSkills} agent skills across talent + agency surfaces.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatBadge label="Connected"        value={`${connectedCount}/${tools.length}`} color={TEAL} />
        <StatBadge label="Required missing" value={requiredMissing} color={requiredMissing > 0 ? CORAL : INK} />
        <StatBadge label="Skills"           value={totalSkills} />
        <StatBadge label="Skill groups"     value={SKILL_CATALOG.length} />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16,
        borderBottom: `1px solid ${LINE}`,
      }}>
        {[
          { id: 'tools',  label: 'Tools' },
          { id: 'skills', label: 'Skills' },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px', border: 'none', background: 'transparent',
                fontSize: 14, fontWeight: 600,
                color: active ? INK : MUTED,
                cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: `2px solid ${active ? TEAL : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TOOLS tab */}
      {tab === 'tools' && (
        <>
          <div style={{
            display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap',
          }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              flex: '1 1 240px', minWidth: 220, maxWidth: 360,
              background: SURFACE, border: `1px solid ${LINE}`,
              borderRadius: 8, padding: '9px 12px',
            }}>
              <Search size={15} color={MUTED_2} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${tools.length} tools…`}
                style={{
                  flex: 1, border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 13.5, fontFamily: 'inherit', color: INK,
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: MUTED_2, display: 'inline-flex',
                }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {TOOL_CATEGORIES.map(c => {
                const active = c.id === cat;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap',
                      border: `1px solid ${active ? TEAL : LINE}`,
                      background: active ? TEAL : SURFACE,
                      color: active ? '#fff' : INK_2,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', letterSpacing: '-0.005em',
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingStatuses ? (
            <div style={{
              padding: 40, textAlign: 'center', color: MUTED,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <Loader2 size={14} className="animate-spin" /> Loading connection status…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: '60px 16px', textAlign: 'center', color: MUTED,
              fontSize: 14, background: SURFACE, borderRadius: 12,
              border: `1px dashed ${LINE}`,
            }}>
              No tools match "{query}".
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {filtered.map(tool => (
                <ToolCard
                  key={tool.key}
                  tool={tool}
                  onToggle={toggle}
                  busy={!!busy[tool.key]}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* SKILLS tab */}
      {tab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SKILL_CATALOG.map(group => (
            <div key={group.id}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 999, background: group.color,
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: INK,
                }}>
                  {group.name}
                </span>
                <span style={{ fontSize: 11.5, color: MUTED_2, fontWeight: 500 }}>
                  · {group.skills.length} skills
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 12,
              }}>
                {group.skills.map(skill => {
                  const skillTools = skill.tools.map(k => toolByKey[k]).filter(Boolean);
                  const missing = skillTools.filter(t => t.status !== 'connected').length;
                  return (
                    <div key={skill.id} style={{
                      padding: 14, background: SURFACE,
                      border: `1px solid ${LINE}`, borderRadius: 10,
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: group.color,
                          background: group.tint, padding: '2px 6px', borderRadius: 4,
                          letterSpacing: '0.04em',
                          fontFamily: 'DM Mono, monospace',
                        }}>
                          {skill.agent}
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: INK, flex: 1 }}>
                          {skill.name}
                        </span>
                        {missing > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: CORAL,
                            background: CORAL_TINT, padding: '2px 6px', borderRadius: 4,
                          }}>
                            {missing} missing
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {skillTools.map(t => (
                          <div
                            key={t.key}
                            title={`${t.name} · ${t.status}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '2px 8px 2px 3px', borderRadius: 999,
                              background: t.status === 'connected' ? TEAL_TINT : LINE_2,
                            }}
                          >
                            <ToolChip tool={t} size={16} />
                            <span style={{
                              fontSize: 11, fontWeight: 500,
                              color: t.status === 'connected' ? TEAL_2 : MUTED,
                            }}>
                              {t.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IntegrationsView;
