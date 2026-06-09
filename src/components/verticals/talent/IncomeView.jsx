import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PiggyBank, DollarSign, Receipt, Calculator, Link2, Loader2 } from 'lucide-react';
import { TalentAgentShell } from './TalentAgentShell';
import { plaidCreateLinkToken } from '../../../utils/integrations';
import { useAskMO } from '../../../hooks/useAskMO';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const QuickStat = ({ label, value, accent = 'text-zinc-900' }) => (
  <div className="bg-white rounded-xl p-4" style={CARD_STYLE}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
      {label}
    </div>
    <div className={`text-2xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>
      {value}
    </div>
  </div>
);

export const IncomeView = () => {
  const [income, setIncome] = useState('');
  const [source, setSource] = useState('1099 indie feature');
  const [linking, setLinking] = useState(false);
  const askMO = useAskMO();

  const handleConnectBank = async () => {
    setLinking(true);
    try {
      const { mode, link_token, message } = await plaidCreateLinkToken();
      if (mode === 'mock' || !link_token) {
        toast(message || 'Plaid not configured yet.', { icon: 'ℹ️', duration: 5000 });
        return;
      }
      // Real flow: open Plaid Link with link_token (requires plaid-link-js SDK on client).
      // For Sprint 4 we just show the token retrieved — full Plaid Link SDK integration ships Sprint 5.
      toast.success(`Plaid link token ready (${link_token.slice(0, 16)}…). Plaid Link SDK wiring lands Sprint 5.`);
    } catch (err) {
      toast.error(err.userMessage || err.message || 'Plaid link failed.');
    } finally {
      setLinking(false);
    }
  };

  const handleAsk = () => {
    if (!income.trim()) return;
    askMO(`Categorize this income: ${income} from ${source}. What's deductible? Estimate quarterly tax.`, 'income');
  };

  return (
    <TalentAgentShell
      title="Income & Tax Assistant"
      description="Categorize income · track deductibles · estimate quarterly tax · prep 1099 packets. US tax rules, conservative + CPA-friendly."
      Icon={PiggyBank}
      accentClass="text-emerald-600"
      agentId="talent-income-tax"
      agentLabel="Open Assistant"
      features={[
        'Categorize W-2 union, 1099 indie, residuals, royalties, holding fees',
        'Track deductibles: agent fees (10%), manager fees (15%), headshots, classes (Section 162), gear, mileage, union dues',
        'Estimate quarterly tax (Form 1040-ES) for self-employment income',
        '1099 packet summaries by tax year',
        'Flag mixed-use expenses needing documentation',
      ]}
      comingSoon={[
        'Plaid Link SDK on client — full bank-connect flow (Sprint 5)',
        'Auto-categorize transactions to W-2 / 1099 / residual / royalty',
        'Quarterly tax filing reminders via Twilio SMS',
        'Export-ready 1099 packet for CPA',
      ]}
    >
      <div className="flex justify-end">
        <button onClick={handleConnectBank}
          disabled={linking}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-emerald-400 hover:text-emerald-600">
          {linking ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          Connect Bank (Plaid)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat label="YTD Income" value="—" />
        <QuickStat label="Deductibles" value="—" accent="text-amber-600" />
        <QuickStat label="Net (Pre-tax)" value="—" accent="text-emerald-600" />
        <QuickStat label="Est. Quarterly" value="—" accent="text-rose-600" />
      </div>

      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="text-emerald-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Quick categorize</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Amount</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="5000"
                className="w-full border border-zinc-200 rounded-lg pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-400" />
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400">
              <option>1099 indie feature</option>
              <option>W-2 union session work</option>
              <option>Residuals (SAG-AFTRA)</option>
              <option>Commercial holding fee</option>
              <option>Royalty / streaming</option>
              <option>Voiceover session</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleAsk}
            disabled={!income.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              income.trim()
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            Categorize + Estimate
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Receipt className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
        <div className="text-sm text-amber-900">
          <span className="font-semibold">Not legal/tax advice.</span> This agent assists with categorization + estimates. For filings + complex situations, work with a CPA familiar with entertainment industry rules.
        </div>
      </div>
    </TalentAgentShell>
  );
};
