import React from 'react';
import { BarChart3, TrendingUp, Users, Activity, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useRoster } from '../../../hooks/useRoster';
import { useSubmissions } from '../../../hooks/useSubmissions';
import { useCommissions } from '../../../hooks/useCommissions';
import { AgencyAgentShell } from './AgencyAgentShell';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const usd = (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const Tile = ({ label, value, sub, accent = 'text-zinc-900' }) => (
  <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2" style={{ fontFamily: 'var(--font-mono)' }}>{label}</div>
    <div className={`text-3xl font-bold tabular-nums ${accent}`} style={{ fontFamily: 'var(--font-mono)' }}>{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
  </div>
);

export const AgencyAdminView = () => {
  const { profile } = useAppContext();
  const { roster, counts: rosterCounts } = useRoster(profile?.id);
  const { submissions, counts: subCounts } = useSubmissions(profile?.id);
  const { totals, overdueCount } = useCommissions(profile?.id);

  // Derived: utilization = % of active talents with at least one submission/booking
  const activeIds = new Set(roster.filter(t => t.status === 'active').map(t => t.id));
  const activeSubmittedIds = new Set(submissions.filter(s => s.talent_id && activeIds.has(s.talent_id)).map(s => s.talent_id));
  const utilizationPct = activeIds.size > 0
    ? Math.round((activeSubmittedIds.size / activeIds.size) * 100)
    : 0;

  const responseRate = subCounts.sent > 0
    ? Math.round((subCounts.responded / subCounts.sent) * 100)
    : 0;

  return (
    <AgencyAgentShell
      title="Agency Admin"
      description="Reporting · roster utilization · top earners · conversion rates · unmet-demand log"
      Icon={BarChart3}
      agentId="agency-admin"
      agentLabel="Ask Admin"
      features={[
        'Roster utilization — % of active talents booking',
        'Top earners by gross_pay × commission_rate',
        'Submission → callback → booking conversion by talent',
        'Casting director response rates (who replies, who ghosts)',
        'Unmet-demand log (what you can\'t supply yet — drives future signings)',
        'Monthly state-of-agency summary for partner review',
      ]}
      comingSoon={[
        'Casting director response rate tracking (Sprint 4)',
        'Auto-generated monthly digest (Sprint 4)',
        'Exportable partner-review PDF',
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Active Roster" value={rosterCounts.active} sub={`${rosterCounts.total} total`} accent="text-violet-600" />
        <Tile label="Utilization" value={`${utilizationPct}%`} sub="active w/ submissions" accent="text-emerald-600" />
        <Tile label="Response Rate" value={`${responseRate}%`} sub={`${subCounts.responded}/${subCounts.sent} sent`} accent="text-sky-600" />
        <Tile label="Overdue (>30d)" value={overdueCount} sub="commissions" accent="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Tile label="Submissions Total" value={subCounts.total} />
        <Tile label="Pending Approval" value={subCounts.pendingApproval} accent="text-amber-600" />
        <Tile label="Outstanding $" value={usd(totals.totalOutstanding)} accent="text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="text-violet-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Recent submissions</div>
        </div>
        {submissions.slice(0, 8).length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-6">No submissions yet — start scouting via Casting Feed</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {submissions.slice(0, 8).map(s => (
              <div key={s.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{s.project_title}</div>
                  <div className="text-xs text-zinc-500 truncate">
                    {s.roster?.talent_name || 'unknown'} → {s.industry_contacts?.name || 'unsent'}
                  </div>
                </div>
                <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 whitespace-nowrap">
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
        <div className="text-sm text-amber-900">
          <span className="font-semibold">Dashboard MVP.</span> Deeper analytics (top earners by $$, response rate by CD, unmet-demand log) ship Sprint 4 with backend job runner for nightly rollups.
        </div>
      </div>
    </AgencyAgentShell>
  );
};
