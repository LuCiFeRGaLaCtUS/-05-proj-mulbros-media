import React from 'react';
import { DollarSign, Users, Music, Clapperboard, Film, MessageSquare, Target, FileText } from 'lucide-react';
import { AgentStatusGrid } from './AgentStatusGrid';
import { useAppContext } from '../../App';
import { useKPIs } from '../../hooks/useKPIs';
import { agents as allAgents } from '../../config/agents';
import { SectionLabel } from './parts/SectionLabel';
import { WelcomeHero } from './parts/WelcomeHero';
import { VerticalProfileCard } from './parts/VerticalProfileCard';
import { StatCardAnimated, ProgressCard } from './parts/StatCards';
import { WelcomeMark } from './parts/WelcomeMark';
import { AudienceScore, DealFlow } from './parts/ScoreCards';
import { RevenueChart, PlatformChart } from './parts/Charts';
import { ProjectsTable } from './parts/ProjectsTable';
import { ActivityTimeline } from './parts/ActivityTimeline';
import { C } from './parts/constants';
import {
  BgRevenue, BgStreams, BgDeals, BgCommunity,
  BgFilmFrame, BgMusicStaff, BgPipeline, BgEmail,
} from './parts/backgrounds';

export const Dashboard = ({ onAgentClick, setActivePage, user }) => {
  const { profile } = useAppContext();
  const { leadCount, aiInteractions, contentPieces, pipelineValue, loading: kpiLoading } = useKPIs(profile?.id);
  const nav = (page) => setActivePage?.(page);

  return (
    <div className="space-y-5">

      <WelcomeHero user={user} profile={profile} />

      <VerticalProfileCard />

      {/* Row 1 — Stat cards */}
      <SectionLabel label="Metrics" sub="live indicators" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCardAnimated title="Active Leads"
          numericValue={leadCount}
          loading={kpiLoading}
          formatter={v => String(v)}
          sub={leadCount === 0 ? 'no leads yet' : 'in pipeline'}
          Icon={Target} iconBg="bg-emerald-100" iconColor="text-emerald-600"
          accentColor={C.emerald} Bg={BgDeals} cardBg="linear-gradient(135deg, #ecfdf5 0%, #f4fdf9 45%, #ffffff 75%)"
          onClick={() => nav('financing')} linkLabel="View Pipeline →" delay={0} />

        <StatCardAnimated title="AI Interactions"
          numericValue={aiInteractions}
          loading={kpiLoading}
          formatter={v => v.toLocaleString()}
          sub="this month"
          Icon={MessageSquare} iconBg="bg-amber-100" iconColor="text-amber-600"
          accentColor={C.gold} Bg={BgStreams} cardBg="linear-gradient(135deg, #fffbeb 0%, #fffdf4 45%, #ffffff 75%)"
          onClick={() => nav('agents')} linkLabel="View Agents →" delay={80} />

        <StatCardAnimated title="Content Pieces"
          numericValue={contentPieces}
          loading={kpiLoading}
          formatter={v => String(v)}
          sub="this month"
          Icon={FileText} iconBg="bg-purple-100" iconColor="text-purple-600"
          accentColor={C.purple} Bg={BgCommunity} cardBg="linear-gradient(135deg, #f5f3ff 0%, #f9f7ff 45%, #ffffff 75%)"
          onClick={() => nav('content')} linkLabel="View Content →" delay={160} />

        <StatCardAnimated title="Pipeline Value"
          numericValue={pipelineValue}
          loading={kpiLoading}
          formatter={v => `$${v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : v >= 1_000 ? (v / 1_000).toFixed(0) + 'K' : v.toFixed(0)}`}
          sub={pipelineValue === 0 ? 'start tracking' : 'total'}
          Icon={DollarSign} iconBg="bg-blue-100" iconColor="text-blue-600"
          accentColor={C.blue} Bg={BgRevenue} cardBg="linear-gradient(135deg, #eff6ff 0%, #f4f8ff 45%, #ffffff 75%)"
          onClick={() => nav('financing')} linkLabel="View Pipeline →" delay={240} />
      </div>

      {/* Row 2 */}
      <SectionLabel label="Overview" sub="studio command" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: 290 }}>
        <div className="lg:col-span-6"><WelcomeMark onGoToAgents={() => nav('agents')} /></div>
        <div className="lg:col-span-3"><AudienceScore onClick={() => nav('music')} /></div>
        <div className="lg:col-span-3"><DealFlow onClick={() => nav('financing')} /></div>
      </div>

      {/* Row 3 */}
      <SectionLabel label="Analytics" sub="6-month forecast · platform reach" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7"><RevenueChart /></div>
        <div className="lg:col-span-5"><PlatformChart onClick={() => nav('music')} /></div>
      </div>

      {/* Row 4 */}
      <SectionLabel label="Targets" sub="progress to goal" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ProgressCard Icon={Film}       iconBg="bg-emerald-100" iconColor="text-emerald-600"
          title="Last County Streams" value="142,847" pct={71} color={C.emerald} sub="Target: 200K"
          Bg={BgFilmFrame} hoverRing="hover:border-emerald-300" onClick={() => nav('productions')}
          cardBg="linear-gradient(135deg, #ecfdf5 0%, #f4fdf9 45%, #ffffff 75%)" />

        <ProgressCard Icon={Music}      iconBg="bg-amber-100"   iconColor="text-amber-600"
          title="Talise Growth"      value="85,230"  pct={85} color={C.gold}    sub="Target: 100K"
          Bg={BgMusicStaff} hoverRing="hover:border-amber-300" onClick={() => nav('music')}
          cardBg="linear-gradient(135deg, #fffbeb 0%, #fffdf4 45%, #ffffff 75%)" />

        <ProgressCard Icon={DollarSign} iconBg="bg-blue-100"    iconColor="text-blue-600"
          title="Pipeline Value"     value="$65K"    pct={65} color={C.blue}    sub="Target: $100K"
          Bg={BgPipeline} hoverRing="hover:border-blue-300" onClick={() => nav('financing')}
          cardBg="linear-gradient(135deg, #eff6ff 0%, #f4f8ff 45%, #ffffff 75%)" />

        <ProgressCard Icon={Users}      iconBg="bg-purple-100"  iconColor="text-purple-600"
          title="Email Subscribers"  value="847"     pct={85} color={C.purple}  sub="Target: 1,000"
          Bg={BgEmail} hoverRing="hover:border-purple-300" onClick={() => nav('music')}
          cardBg="linear-gradient(135deg, #f5f3ff 0%, #f9f7ff 45%, #ffffff 75%)" />
      </div>

      {/* Row 5 */}
      <SectionLabel label="Operations" sub="projects · studio activity" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7"><ProjectsTable onRowClick={nav} /></div>
        <div className="lg:col-span-5"><ActivityTimeline onItemClick={nav} /></div>
      </div>

      {/* Row 6 — Agent Fleet */}
      <SectionLabel label="Agent Fleet" sub={`${allAgents.filter(a => a.status === 'active').length} agents online`} />
      <AgentStatusGrid onAgentClick={onAgentClick} />

    </div>
  );
};
