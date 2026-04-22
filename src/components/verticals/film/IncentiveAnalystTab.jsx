import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles, Loader2, MapPin, TrendingUp, ArrowRight, Download,
} from 'lucide-react';
import { BlueBg } from './BlueBg';
import { GENRES, REGIONS, LANGUAGES, MOCK_BENCHMARK } from './constants';
import { callAI } from '../../../utils/ai';
import { getJurisdictionPromptContext, getTopJurisdictions } from '../../../config/jurisdictions';
import { logger } from '../../../lib/logger';
import { exportIncentivePdf } from './incentivePdfExport';

export const IncentiveAnalystTab = () => {
  const [form, setForm] = useState({
    title: '', genre: 'Thriller', budget: '', duration: '', region: 'United States', language: 'English',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const jurisdictionContext = getJurisdictionPromptContext();
  const systemPrompt = `You are the Film Financing Incentive Analyst for MulBros Media OS. You are an expert in US state and international film tax incentives, rebates, and production grants.

${jurisdictionContext}

When given project details, produce a structured JSON benchmark with this exact shape (no markdown, raw JSON only):
{
  "topPick": { "location": string, "credit": string, "savings": string, "reason": string },
  "comparison": [{ "location": string, "flag": string, "credit": string, "savings": string, "minSpend": string, "qualified": string, "refundable": boolean }],
  "budgetTemplate": [{ "category": string, "estimate": string, "qualified": string, "notes": string }],
  "nextStep": string
}
Rules:
- Return 4-5 locations in comparison, chosen from the authoritative data above only.
- Exclude any jurisdiction whose minSpend exceeds the project budget.
- Calculate savings as: budget × 0.70 (qualified spend ratio) × credit rate. Show your math in the reason field.
- Mark refundable accurately per the data above — this is critical for the filmmaker's cash flow planning.
- Return 7-8 budget line items specific to the project genre and region.
- All savings in USD equivalent. Be precise and data-driven — this report will be used for real financial decisions.`;

  const handleGenerate = async () => {
    if (!form.budget) return;
    setGenerating(true);
    setResult(null);
    setParseError(false);

    const budgetNum = Number(form.budget) || 0;
    const topJurisdictions = getTopJurisdictions(budgetNum, 8)
      .map(j => `${j.flag} ${j.location} (${j.creditRate}, refundable: ${j.refundable})`)
      .join(', ');
    const userMsg = `Project: "${form.title || 'Untitled'}", Genre: ${form.genre}, Budget: $${Number(form.budget).toLocaleString()}, Shoot Duration: ${form.duration || '8'} weeks, Preferred Region: ${form.region}, Language: ${form.language}.

Top eligible jurisdictions for this budget: ${topJurisdictions || 'see full list above'}.

Generate a tax-incentive benchmark JSON. Pick the best 4-5 locations from the eligible list above, prioritising refundable credits and highest savings for this budget size.`;

    try {
      const raw = await callAI(systemPrompt, [{ role: 'user', content: userMsg }]);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult({ ...parsed, project: { title: form.title || 'Your Project', genre: form.genre, budget: `$${Number(form.budget).toLocaleString()}`, region: form.region } });
    } catch (err) {
      logger.warn('IncentiveAnalyst.generate.fallback', { message: err?.message });
      setParseError(true);
      setResult({ ...MOCK_BENCHMARK, project: { title: form.title || 'Your Project', genre: form.genre, budget: `$${Number(form.budget || 2000000).toLocaleString()}`, region: form.region } });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportIncentivePdf(result);
    } catch (err) {
      logger.error('IncentiveAnalyst.pdf.failed', err);
      toast.error('Could not export PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div
        className="relative tile-pop bg-white rounded-2xl p-5 overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <BlueBg />
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-zinc-900">Project Details</span>
          <span className="text-xs text-zinc-500 ml-1">— the AI will generate a personalized incentive benchmark</span>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Project Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Saltwater" className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-blue-400 text-sm placeholder-zinc-400" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Genre</label>
            <select value={form.genre} onChange={e => set('genre', e.target.value)}
              className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-blue-400 text-sm">
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Budget (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">$</span>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)}
                placeholder="2000000" className="w-full bg-white text-zinc-900 rounded-lg pl-6 pr-3 py-2 border border-zinc-200 focus:outline-none focus:border-blue-400 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Shoot Duration (weeks)</label>
            <input type="number" value={form.duration} onChange={e => set('duration', e.target.value)}
              placeholder="8" className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-blue-400 text-sm" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Preferred Region</label>
            <select value={form.region} onChange={e => set('region', e.target.value)}
              className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-blue-400 text-sm">
              {REGIONS.slice(1).map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Language of Film</label>
            <select value={form.language} onChange={e => set('language', e.target.value)}
              className="w-full bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-blue-400 text-sm">
              {LANGUAGES.slice(1).map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={!form.budget || generating}
          className="relative z-10 flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-100 disabled:text-zinc-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all">
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? 'Generating Benchmark…' : 'Generate AI Benchmark'}
        </button>
      </div>

      {/* Empty state */}
      {!generating && !result && (
        <div
          className="relative tile-pop bg-white rounded-2xl p-10 flex flex-col items-center gap-3 text-center overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <BlueBg />
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <MapPin size={22} className="text-blue-500" />
          </div>
          <div className="relative z-10 text-sm font-semibold text-zinc-700">Enter your project details above</div>
          <div className="relative z-10 text-xs text-zinc-500 max-w-sm leading-relaxed">
            The AI will rank the top 3–5 states or countries by tax credit %, estimate your savings in dollars, and generate an itemized budget template for your chosen location.
          </div>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div
          className="relative tile-pop bg-white rounded-2xl p-10 flex flex-col items-center gap-4 overflow-hidden"
          style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <BlueBg />
          <Loader2 size={28} className="relative z-10 text-blue-500 animate-spin" />
          <div className="relative z-10 text-sm font-semibold text-zinc-700">Analyzing incentives across 40+ jurisdictions…</div>
          <div className="relative z-10 text-xs text-zinc-500">Comparing tax credits, rebates, qualified spend rules, and cost benchmarks</div>
        </div>
      )}

      {/* Results */}
      {result && !generating && (
        <div className="space-y-5">
          {parseError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
              Showing sample benchmark — add your OpenAI key in Settings to generate a personalized report.
            </div>
          )}

          {/* Top pick hero */}
          <div
            className="relative tile-pop bg-blue-50 border border-blue-200 rounded-2xl p-5 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Top Recommendation</span>
              <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">★ Best Pick</span>
              <span className="text-xs text-zinc-600">—</span>
              <span className="text-xs text-zinc-500 italic">{result.project.title} · {result.project.genre} · {result.project.budget}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-zinc-900 mb-1">{result.topPick?.location}</div>
                <p className="text-sm text-zinc-700 leading-relaxed max-w-xl">{result.topPick?.reason}</p>
                {(() => {
                  const topRow = (result.comparison || []).find(r => r.location === result.topPick?.location);
                  return topRow ? (
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${topRow.refundable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                        {topRow.refundable ? '✓ Refundable credit' : '○ Non-refundable (transferable)'}
                      </span>
                      {topRow.minSpend && (
                        <span className="text-xs bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-full">
                          Min spend: {topRow.minSpend}
                        </span>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-bold font-mono text-emerald-600">{result.topPick?.savings}</div>
                <div className="text-xs text-zinc-500 mt-0.5">Estimated savings</div>
                <div className="text-2xl font-bold text-blue-600 mt-2">{result.topPick?.credit}</div>
                <div className="text-xs text-zinc-500">Tax credit rate</div>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div
            className="relative tile-pop bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <BlueBg />
            <div className="relative z-10 px-5 py-3 border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-transparent">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Location Comparison</span>
            </div>
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                    <th className="text-left py-2.5 px-5 font-medium">Location</th>
                    <th className="text-left py-2.5 px-4 font-medium">Credit %</th>
                    <th className="text-left py-2.5 px-4 font-medium">Est. Savings</th>
                    <th className="text-left py-2.5 px-4 font-medium">Min. Spend</th>
                    <th className="text-left py-2.5 px-4 font-medium">Qualified Spend</th>
                    <th className="text-left py-2.5 px-4 font-medium">Refundable</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.comparison || []).map((row, i) => {
                    const isTop = row.location === result.topPick?.location;
                    return (
                    <tr key={`${row.location}-${i}`} className={`border-b border-zinc-100 transition-colors ${isTop ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-zinc-50'}`}>
                      <td className="py-2.5 px-5 font-medium">
                        <span className={isTop ? 'text-zinc-900' : 'text-zinc-700'}>{row.flag} {row.location}</span>
                        {isTop && <span className="ml-2 text-xs bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">★ Top</span>}
                      </td>
                      <td className="py-2.5 px-4 text-blue-600 font-bold font-mono">{row.credit}</td>
                      <td className="py-2.5 px-4 text-emerald-600 font-semibold font-mono">{row.savings}</td>
                      <td className="py-2.5 px-4 text-zinc-700">{row.minSpend}</td>
                      <td className="py-2.5 px-4 text-zinc-500 text-xs">{row.qualified}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.refundable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'}`}>
                          {row.refundable ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget template */}
          <div
            className="relative tile-pop bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
          >
            <BlueBg />
            <div className="relative z-10 px-5 py-3 border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-transparent flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Itemized Budget Template — {result.topPick?.location}</span>
              <span className="text-xs text-zinc-600">Based on {result.project.budget} budget</span>
            </div>
            <div className="relative z-10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs text-zinc-500">
                    <th className="text-left py-2.5 px-5 font-medium">Category</th>
                    <th className="text-left py-2.5 px-4 font-medium">Estimate</th>
                    <th className="text-left py-2.5 px-4 font-medium">Qualified Spend</th>
                    <th className="text-left py-2.5 px-4 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.budgetTemplate || []).map((row, i) => (
                    <tr key={`${row.category}-${i}`} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="py-2.5 px-5 text-zinc-900 font-medium">{row.category}</td>
                      <td className="py-2.5 px-4 text-zinc-700 font-mono">{row.estimate}</td>
                      <td className="py-2.5 px-4 text-emerald-600 font-mono">{row.qualified}</td>
                      <td className="py-2.5 px-4 text-zinc-500 text-xs">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="tile-pop bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-zinc-900 mb-1">Ready to move forward?</div>
              <p className="text-xs text-zinc-700 leading-relaxed">{result.nextStep}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap border border-zinc-200">
                <Download size={14} /> Export PDF
              </button>
              <button
                onClick={() => {
                  const subject = encodeURIComponent(`Film Financing Consultation — ${result.project?.title || 'My Project'}`);
                  const body = encodeURIComponent(
                    `Hi Sean,\n\nI'd like to book a film financing consultation.\n\nProject Details:\n` +
                    `• Title: ${result.project?.title || 'Untitled'}\n` +
                    `• Budget: ${result.project?.budget || 'TBD'}\n` +
                    `• Genre: ${result.project?.genre || 'TBD'}\n` +
                    `• Top Recommended Location: ${result.topPick?.location || 'TBD'} (${result.topPick?.credit || ''} credit)\n` +
                    `• Estimated Savings: ${result.topPick?.savings || 'TBD'}\n\n` +
                    `Please let me know your availability.\n\nThank you`
                  );
                  window.location.href = `mailto:sean@mulbros.com?subject=${subject}&body=${body}`;
                }}
                className="flex-shrink-0 flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap">
                Book Consultation <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
