import React, { useState } from 'react';
import { ScrollText, FileText, AlertTriangle, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { AgencyAgentShell } from './AgencyAgentShell';
import { callAI, getApiKey } from '../../../utils/ai';
import { getAgentById } from '../../../config/agents';
import { docusignSendEnvelope } from '../../../utils/integrations';
import { supabase } from '../../../lib/supabase';
import { useAppContext } from '../../../App';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const ContractNegotiatorView = () => {
  const { profile } = useAppContext();
  const [contractText, setContractText] = useState('');
  const [projectType, setProjectType] = useState('streaming feature');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ signer_name: '', signer_email: '', subject: '' });
  const [sending, setSending] = useState(false);

  const handleSendForSignature = async (e) => {
    e?.preventDefault();
    if (!sendForm.signer_email || !sendForm.signer_name || !contractText.trim()) {
      toast.error('Signer name + email + contract text required.');
      return;
    }
    setSending(true);
    try {
      const { mode, envelope_id, message } = await docusignSendEnvelope({
        signer_email: sendForm.signer_email,
        signer_name:  sendForm.signer_name,
        subject:      sendForm.subject || 'Contract for signature',
        contract_html: `<html><body><pre style="font-family:sans-serif;white-space:pre-wrap;">${contractText.replace(/</g, '&lt;')}</pre></body></html>`,
      });
      if (mode === 'mock' || !envelope_id) {
        toast(message || 'DocuSign not configured yet.', { icon: 'ℹ️', duration: 5000 });
        return;
      }
      // Persist envelope ref
      await supabase.from('docusign_envelopes').insert({
        user_id:      profile?.id,
        envelope_id,
        signer_email: sendForm.signer_email,
        signer_name:  sendForm.signer_name,
        subject:      sendForm.subject || 'Contract for signature',
        status:       'sent',
      });
      toast.success(`Envelope ${envelope_id.slice(0, 8)}… sent to ${sendForm.signer_email}`);
      setShowSendModal(false);
      setSendForm({ signer_name: '', signer_email: '', subject: '' });
    } catch (err) {
      toast.error(err.userMessage || err.message || 'DocuSign send failed.');
    } finally {
      setSending(false);
    }
  };

  const handleNegotiate = async () => {
    if (!contractText.trim() || contractText.length < 50) {
      toast.error('Paste at least a few lines of the contract.');
      return;
    }
    setLoading(true);
    setSummary('');
    try {
      const agent = getAgentById('agency-contract-negotiator');
      const apiKey = getApiKey(agent.model);
      const messages = [{
        role: 'user',
        content: `Project type: ${projectType}\n\nReview this contract on the talent's behalf. Output:\n\n**1. Key Terms** — rates, options, exclusivity, billing, travel, residuals\n**2. SAG-AFTRA Scale Comparison** — how rates compare to applicable union scale\n**3. Red Flags** — AI clauses, unlimited buyouts, perpetual options, etc.\n**4. Counter-Language** — specific redline suggestions for problematic clauses\n**5. Leverage Assessment** — what's negotiable based on project size + role significance\n\nContract:\n\n${contractText.slice(0, 12000)}`,
      }];
      const response = await callAI(agent.systemPrompt, messages, apiKey, agent.model);
      setSummary(response);
    } catch (err) {
      console.error('contract-negotiate failed', err);
      toast.error(err.message || 'Could not analyze contract.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgencyAgentShell
      title="Contract Negotiator"
      description="Reviews + redlines talent contracts on behalf of the agency. Flags terms vs union scale. Proposes counter-language."
      Icon={ScrollText}
      agentId="agency-contract-negotiator"
      agentLabel="Discuss further"
      features={[
        'Plain-English review of key terms',
        'SAG-AFTRA scale comparison by category (feature / TV / commercial / VO)',
        'Red flag detection (AI likeness, unlimited buyouts, perpetual options, exclusivity excess)',
        'Specific counter-language for problematic clauses',
        'Leverage assessment based on project size + role significance',
      ]}
      comingSoon={[
        'PDF upload (Sprint 4 — Storage)',
        'DocuSign integration — sign + redline in-app (Sprint 4)',
        'Per-roster-talent contract templates',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="text-violet-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Contract review</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Project Type</label>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400">
              <option>streaming feature</option>
              <option>broadcast feature</option>
              <option>indie feature (non-union)</option>
              <option>streaming series regular</option>
              <option>streaming series guest star</option>
              <option>broadcast series</option>
              <option>commercial (TV/streaming)</option>
              <option>voiceover</option>
              <option>theatrical</option>
            </select>
          </div>
        </div>
        <textarea value={contractText} onChange={(e) => setContractText(e.target.value)}
          placeholder="Paste the contract here (12K char max). PDF upload coming Sprint 4."
          rows={8}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-violet-400 mb-3" />
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-zinc-500">{contractText.length.toLocaleString()} / 12,000 chars</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSendModal(true)}
              disabled={!contractText.trim() || contractText.length < 50}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                contractText.trim() && contractText.length >= 50
                  ? 'bg-white border-zinc-200 text-zinc-700 hover:border-indigo-400 hover:text-indigo-600'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}>
              <Send size={14} /> Send via DocuSign
            </button>
            <button onClick={handleNegotiate}
              disabled={loading || !contractText.trim() || contractText.length < 50}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                loading || !contractText.trim() || contractText.length < 50
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              }`}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : 'Review + Negotiate'}
            </button>
          </div>
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <div className="font-bold text-zinc-900">Send Contract for Signature</div>
              <button onClick={() => setShowSendModal(false)} className="text-zinc-400 hover:text-zinc-700">×</button>
            </div>
            <form onSubmit={handleSendForSignature} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Signer Name *</label>
                <input required type="text" value={sendForm.signer_name} onChange={(e) => setSendForm({ ...sendForm, signer_name: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Signer Email *</label>
                <input required type="email" value={sendForm.signer_email} onChange={(e) => setSendForm({ ...sendForm, signer_email: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Subject</label>
                <input type="text" value={sendForm.subject} onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  placeholder="Contract for signature"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
              </div>
              <div className="text-xs text-zinc-500 bg-zinc-50 rounded-lg p-3">
                DocuSign: set <code className="font-mono">DOCUSIGN_ACCOUNT_ID</code> + <code className="font-mono">DOCUSIGN_ACCESS_TOKEN</code> in Render to enable real sending. Without env vars, this returns a mock success.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSendModal(false)} className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
                <button type="submit" disabled={sending}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 flex items-center gap-2">
                  {sending ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send Envelope</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            Negotiation analysis
          </div>
          <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap leading-relaxed">{summary}</div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
        <div className="text-sm text-amber-900">
          <span className="font-semibold">Not legal advice.</span> Major deals belong with SAG-AFTRA contract review or an entertainment attorney.
        </div>
      </div>
    </AgencyAgentShell>
  );
};
