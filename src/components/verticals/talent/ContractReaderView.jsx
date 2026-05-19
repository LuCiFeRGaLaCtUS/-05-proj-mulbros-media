import React, { useState } from 'react';
import { ScrollText, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TalentAgentShell } from './TalentAgentShell';
import { callAI, getApiKey } from '../../../utils/ai';
import { getAgentById } from '../../../config/agents';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const ContractReaderView = () => {
  const [contractText, setContractText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRead = async () => {
    if (!contractText.trim() || contractText.length < 50) {
      toast.error('Paste at least a few lines of the contract.');
      return;
    }
    setLoading(true);
    setSummary('');
    try {
      const agent = getAgentById('talent-contract-reader');
      const apiKey = getApiKey(agent.model);
      const messages = [{
        role: 'user',
        content: `Read this contract. Give a plain-English summary in this exact format:\n\n**1. Key Terms** — rates, options, exclusivity, billing, travel\n**2. Red Flags** — anything risky (AI clauses, unlimited buyouts, perpetual options, etc.)\n**3. Vs SAG Scale** — how the rate compares to union scale for similar work\n**4. Negotiation Recommendations** — top 3 points to push back on\n\nContract:\n\n${contractText.slice(0, 12000)}`,
      }];
      const response = await callAI(agent.systemPrompt, messages, apiKey, agent.model);
      setSummary(response);
    } catch (err) {
      console.error('contract-read failed', err);
      toast.error(err.message || 'Could not read contract.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TalentAgentShell
      title="Contract Reader"
      description="Paste a contract — get a plain-English summary, red flags, SAG-AFTRA scale comparison, and negotiation recommendations."
      Icon={ScrollText}
      accentClass="text-sky-600"
      agentId="talent-contract-reader"
      agentLabel="Discuss further"
      features={[
        'Plain-English summary of key terms (rates, options, exclusivity, billing)',
        'Red flag detection (AI likeness clauses, unlimited buyouts, perpetual options, in-perpetuity moral rights waivers)',
        'SAG-AFTRA scale comparison for the work category',
        'Top 3 negotiation recommendations',
      ]}
      comingSoon={[
        'PDF upload (Sprint 4 — Mux/Storage)',
        'DocuSign integration — sign + redline in-app',
        'Auto-flag based on persona type (actor vs musician contracts have different scale)',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="text-sky-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Paste contract text</div>
        </div>
        <textarea
          value={contractText}
          onChange={(e) => setContractText(e.target.value)}
          placeholder="Paste the contract here (12K char max). PDF upload coming Sprint 4."
          rows={8}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-sky-400 mb-3"
        />
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">{contractText.length.toLocaleString()} / 12,000 chars</div>
          <button onClick={handleRead}
            disabled={loading || !contractText.trim() || contractText.length < 50}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
              loading || !contractText.trim() || contractText.length < 50
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'bg-sky-500 text-white hover:bg-sky-600'
            }`}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Reading…</> : 'Read Contract'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            Plain-English summary
          </div>
          <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap leading-relaxed">
            {summary}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
        <div className="text-sm text-amber-900">
          <span className="font-semibold">Not legal advice.</span> AI summary helps you read fast — for actual contract negotiation always run major contracts past SAG-AFTRA contract review or an entertainment attorney.
        </div>
      </div>
    </TalentAgentShell>
  );
};
