import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Bot, Upload, AlertCircle, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useRoyaltyStatements } from '../../../hooks/useRoyaltyStatements';
import { getStytchAuthHeaders } from '../../../lib/stytch';
import { useAskMO } from '../../../hooks/useAskMO';
import { DatePicker } from '../../ui/DatePicker';

const CARD_STYLE = {
  border:    '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const SOURCES = [
  'spotify','apple','youtube','mlc','soundexchange',
  'publisher','sync','distributor','other',
];

const usd = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCard = ({ label, value, accent = 'text-zinc-900' }) => (
  <div className="bg-white rounded-2xl p-4" style={CARD_STYLE}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
      {label}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>
      {value}
    </div>
  </div>
);

const ParseForm = ({ onParsed }) => {
  const [source,      setSource]      = useState('spotify');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd,   setPeriodEnd]   = useState('');
  const [rawText,     setRawText]     = useState('');
  const [busy,        setBusy]        = useState(false);

  const submit = async () => {
    if (!rawText || rawText.trim().length < 20) {
      toast.error('Paste the full statement text first.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/tools/statement.parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getStytchAuthHeaders() },
        body:    JSON.stringify({
          source,
          period_start: periodStart || undefined,
          period_end:   periodEnd   || undefined,
          raw_text:     rawText,
        }),
      });
      const body = await r.json();
      if (!r.ok || body?.ok === false) {
        toast.error(body?.error || `Parse failed (${r.status})`);
      } else {
        toast.success(`Parsed ${body.line_count || 0} lines${body.anomaly_count ? ` · ${body.anomaly_count} anomalies` : ''}`);
        setRawText('');
        onParsed?.();
      }
    } catch (err) {
      toast.error(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
      <div className="flex items-center gap-2 mb-3">
        <Upload size={14} className="text-fuchsia-600" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500" style={{ fontFamily: 'var(--font-mono)' }}>
          Parse a statement
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Source</label>
          <select value={source} onChange={e => setSource(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-2 py-2 text-sm outline-none focus:border-fuchsia-400">
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Period start</label>
          <DatePicker minWidth="100%" value={periodStart} onChange={setPeriodStart} placeholder="Start date" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Period end</label>
          <DatePicker minWidth="100%" value={periodEnd} onChange={setPeriodEnd} placeholder="End date" />
        </div>
      </div>
      <textarea
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        placeholder="Paste the full statement text here (line items, deductions, totals)…"
        rows={8}
        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-400 font-mono"
      />
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-zinc-500">AI extracts line items + flags anomalies vs your stored splits.</span>
        <button
          onClick={submit}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-600 disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {busy ? 'Parsing…' : 'Parse statement'}
        </button>
      </div>
    </div>
  );
};

const StatementCard = ({ s }) => {
  const anomalies = Array.isArray(s.anomalies) ? s.anomalies : [];
  const lines     = Array.isArray(s.parsed_json?.lines) ? s.parsed_json.lines : [];
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={CARD_STYLE}>
      <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-zinc-900 uppercase tracking-wider">{s.source}</div>
          <div className="text-xs text-zinc-500">
            {s.period_start || '—'} → {s.period_end || '—'} · {lines.length} lines
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono tabular-nums text-zinc-900">{usd(s.net_usd)}</div>
          <div className="text-[10px] text-zinc-500">net</div>
        </div>
      </div>
      {anomalies.length === 0 ? (
        <div className="px-5 py-3 text-xs text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 size={12} /> No anomalies — statement matches your splits.
        </div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {anomalies.slice(0, 5).map((a, i) => (
            <div key={i} className="px-5 py-2.5 text-xs flex items-start gap-2">
              <AlertCircle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold text-zinc-800 capitalize">{String(a.type || 'anomaly').replace(/_/g, ' ')}</div>
                <div className="text-zinc-500 truncate">
                  {Object.entries(a)
                    .filter(([k]) => k !== 'type')
                    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v && typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(' · ') || 'Review this line against your splits.'}
                </div>
              </div>
            </div>
          ))}
          {anomalies.length > 5 && (
            <div className="px-5 py-2 text-[11px] text-zinc-500">+{anomalies.length - 5} more anomalies</div>
          )}
        </div>
      )}
    </div>
  );
};

export const StatementsView = () => {
  const navigate = useNavigate();
  const askMO = useAskMO();
  const { profile } = useAppContext();
  const { statements, totals, loading, reload } = useRoyaltyStatements(profile?.id);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate('/catalogue')}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-fuchsia-600 mb-1">
            <ChevronLeft size={12} /> Back to catalogue
          </button>
          <div className="flex items-center gap-2">
            <FileText className="text-fuchsia-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Royalty Statements</h1>
          </div>
          <p className="text-sm text-zinc-500">Paste · AI-parse · anomaly-detect vs your splits</p>
        </div>
        <button
          onClick={() => askMO('Audit my royalty statements for anomalies versus my splits.', 'royalty')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-fuchsia-400 hover:text-fuchsia-600"
        >
          <Bot size={14} /> Ask Royalty Auditor
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Statements" value={statements.length} />
        <KpiCard label="Total gross" value={usd(totals.gross)} />
        <KpiCard label="Total net"   value={usd(totals.net)} accent="text-emerald-600" />
        <KpiCard label="Anomalies"   value={totals.anomalies} accent={totals.anomalies > 0 ? 'text-amber-600' : 'text-zinc-900'} />
      </div>

      <ParseForm onParsed={reload} />

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm text-zinc-400" style={CARD_STYLE}>
            Loading statements…
          </div>
        ) : statements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={CARD_STYLE}>
            <FileText size={28} className="text-zinc-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-zinc-700">No statements yet</div>
            <div className="text-xs text-zinc-500 mt-1">
              Paste your first royalty statement above to get parsed line items + anomaly flags.
            </div>
          </div>
        ) : (
          statements.map(s => <StatementCard key={s.id} s={s} />)
        )}
      </div>
    </div>
  );
};

export default StatementsView;
