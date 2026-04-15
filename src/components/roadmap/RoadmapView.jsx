import React, { useState } from 'react';
import {
  Users, Globe, Bot, MapPin, BarChart2, FileCheck,
  Megaphone, MessageSquare, BookOpen, TrendingUp, Handshake, Heart,
  ChevronRight, Sparkles, Target, Film, Music
} from 'lucide-react';

// ─── Pillar color map ─────────────────────────────────────────────────────────

const pillarColors = {
  'Sales':                'bg-blue-500/10 text-blue-400',
  'Marketing':            'bg-purple-500/10 text-purple-400',
  'Marketing → Sales':    'bg-purple-500/10 text-purple-400',
  'Sales / Marketing':    'bg-blue-500/10 text-blue-400',
  'Sales / Legal':        'bg-blue-500/10 text-blue-400',
  'Operations':           'bg-emerald-500/10 text-emerald-400',
  'Operations / Finance': 'bg-emerald-500/10 text-emerald-400',
  'Finance / Legal':      'bg-amber-500/10 text-amber-400',
  'Marketing / Community':'bg-rose-500/10 text-rose-400',
};

// ─── Film Financing stages ────────────────────────────────────────────────────

const filmStages = [
  {
    num: 1,
    title: 'Lead Acquisition',
    desc: 'Indie filmmakers discovered through Reddit, forums, social scraping, and word of mouth.',
    icon: Users,
    channel: 'Social / Community',
    pillar: 'Marketing',
    ai: false,
    detail: 'Target communities: r/filmmakers, r/indiefilm, Stage32, Film Freeway forums, Facebook groups, LinkedIn. AI scans for high-intent signals — "how do I get tax credits?", "looking for gap financing", "budgeting for a $200K feature", location scouting discussions. Output: lead profile with project title, budget, genre, shooting country, stage of production.'
  },
  {
    num: 2,
    title: 'Entry Funnel',
    desc: 'Filmmaker applies via website form OR discovers us through the free tax incentive calculator.',
    icon: Globe,
    channel: 'Web / Free Tool',
    pillar: 'Marketing → Sales',
    ai: false,
    detail: 'Two entry paths: (A) Active — filmmaker fills out a project intake form on the website. (B) Passive — filmmaker uses the free tax incentive calculator tool, gets immediate value, and their project data is captured as a qualified lead. The free tool is the core lead magnet.'
  },
  {
    num: 3,
    title: 'AI Incentive Tool',
    desc: 'Filmmaker inputs project details. AI recommends the best states/countries for tax rebates.',
    icon: Bot,
    channel: 'AI Agent',
    pillar: 'Sales',
    ai: true,
    detail: 'Filmmaker inputs: genre, budget, shoot duration, preferred region, language. AI returns: top 3–5 states ranked by tax-credit %, estimated dollar savings per location, eligibility requirements, qualified vs. non-qualified spend rules, side-by-side comparison. Example: "Shoot in Ohio → save $340K via 30% rebate on qualified spend vs. $180K in Georgia."'
  },
  {
    num: 4,
    title: 'Decision & Planning',
    desc: 'Location selected. AI generates a production budget plan, timeline, and vendor recommendations.',
    icon: MapPin,
    channel: 'Internal Tool',
    pillar: 'Operations',
    ai: true,
    detail: 'After state selection: itemized budget template pre-filled with local cost benchmarks, vendor recommendations in the selected state, shooting timeline scaffold, and a qualified vs. non-qualified spend tracker (critical for maximizing incentive eligibility). Filmmaker now has a structured production plan, not just a spreadsheet.'
  },
  {
    num: 5,
    title: 'Production Tracking',
    desc: 'Real-time finance dashboard replaces Excel — budget vs. actuals, milestones, cash-flow forecast.',
    icon: BarChart2,
    channel: 'Live Dashboard',
    pillar: 'Operations / Finance',
    ai: true,
    detail: 'Live dashboard: budget vs. actuals by category, qualified spend running total (critical for incentive filing), milestone completion tracker, cash-flow forecast, deviation alerts. Dual access: filmmaker + accountant share a single source of truth. No surprises at tax time.'
  },
  {
    num: 6,
    title: 'Tax Filing & Benefits',
    desc: 'AI-assisted incentive filing, reimbursement tracking, and post-production benchmarking.',
    icon: FileCheck,
    channel: 'AI-Assisted Filing',
    pillar: 'Finance / Legal',
    ai: true,
    detail: 'At wrap: AI compiles all qualified spend receipts, generates state-specific filing documents, tracks rebate application status, benchmarks the project against comparable productions to surface missed deductions. Final report sent to filmmaker + CPA. Reimbursement received → filmmaker re-enters funnel for next project.'
  }
];

// ─── Talent OS stages ─────────────────────────────────────────────────────────

const talentStages = [
  {
    num: 1,
    title: 'Awareness',
    desc: 'Brands, venues, and fans discover the talent via social, portfolio, and referrals.',
    icon: Megaphone,
    channel: 'Social / Portfolio',
    pillar: 'Marketing',
    ai: false,
    detail: 'Channels: Instagram bio link → booking page, TikTok content driving DMs, Luke\'s composer portfolio (SEO: "indie film composer Boston"), Talise\'s Spotify/Apple Music profile, referrals from past collaborators and venue bookers. AI marketing agents continuously generate content to keep the talent visible.'
  },
  {
    num: 2,
    title: 'Inbound Query',
    desc: 'Director, brand, or booker sends a DM, email, or fills out a contact form.',
    icon: MessageSquare,
    channel: 'DM / Email / Form',
    pillar: 'Sales',
    ai: false,
    detail: 'Query sources: Instagram DM, email to booking address, website contact form. All queries route into a unified inbox. Without AI: 24–72 hr response window. With AI: < 5 minutes. Speed is the key differentiator — slow replies kill opportunities.'
  },
  {
    num: 3,
    title: 'AI Response',
    desc: 'AI talent manager sends an immediate, personalized reply and qualifies the lead.',
    icon: Bot,
    channel: 'AI Inbound Agent',
    pillar: 'Sales',
    ai: true,
    detail: 'AI responds in the talent\'s voice: warm acknowledgment, qualifying questions (budget, timeline, project type, location), relevant portfolio samples, clear next steps. Goal: no opportunity slips through because of a slow reply. The AI emulates what a top-tier human manager does, at scale.'
  },
  {
    num: 4,
    title: 'Lead Nurturing',
    desc: 'Qualified leads get a 3-step follow-up sequence over 7 days with portfolio and case studies.',
    icon: BookOpen,
    channel: 'CRM / Email Sequences',
    pillar: 'Sales / Marketing',
    ai: true,
    detail: 'Warm lead sequence: Day 1 — full portfolio + reel. Day 3 — relevant project case study (e.g., "how Luke scored Last County"). Day 7 — soft close with calendar booking link. CRM tags leads by type: film scoring, live performance, brand deal, sync licensing, playlist placement.'
  },
  {
    num: 5,
    title: 'Outbound Outreach',
    desc: 'AI proactively targets film productions, brands, venues, and festivals that fit the talent.',
    icon: TrendingUp,
    channel: 'AI Sales Agent',
    pillar: 'Sales',
    ai: true,
    detail: 'Luke: scrapes IMDb Pro and Film Freeway for indie films in pre-production needing a composer, sends 20–30 targeted cold emails per week. Talise: identifies festival submission windows, open venue slots, brand partnership opportunities in country/folk space, pitches Spotify/Apple Music/YouTube editors.'
  },
  {
    num: 6,
    title: 'Deal Closing',
    desc: 'Rate confirmed, contract issued, booking logged. AI drafts — human approves.',
    icon: Handshake,
    channel: 'CRM Pipeline',
    pillar: 'Sales / Legal',
    ai: true,
    detail: 'AI drafts initial rate proposal using project scope and talent\'s rate card. Human reviews and approves before sending. Contract auto-generated. Deal logged in pipeline: value, timeline, deliverables, client contact. Post-deal: kickoff brief sent automatically. Stages: Prospecting → Pitched → Negotiating → Closed.'
  },
  {
    num: 7,
    title: 'Ongoing & Growth',
    desc: 'Testimonials, case studies, re-engagement, and cross-promotion across all MulBros assets.',
    icon: Heart,
    channel: 'Community Agent',
    pillar: 'Marketing / Community',
    ai: true,
    detail: 'After delivery: AI requests testimonial, archives project as portfolio case study, adds client to 6-month re-engagement touchpoint. Project shared across social channels as content. Community manager handles cross-promotion between Luke, Talise, and Last County — leveraging the 34% audience overlap.'
  }
];

// ─── Stage Card ───────────────────────────────────────────────────────────────

const StageCard = ({ stage, accentColor, isLast, onSelect, isSelected }) => {
  const Icon = stage.icon;
  return (
    <div className="flex items-start gap-2">
      <div
        onClick={() => onSelect(stage)}
        className="flex-shrink-0 w-48 rounded-2xl p-4 border cursor-pointer transition-all duration-200"
        style={isSelected
          ? { borderColor: accentColor, backgroundColor: `${accentColor}08`, boxShadow: `0 0 0 2px ${accentColor}` }
          : { borderColor: '#27272a', backgroundColor: '#18181b' }
        }
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {stage.num}
          </span>
          {stage.ai && (
            <span className="flex items-center gap-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">
              <Sparkles size={9} />AI
            </span>
          )}
        </div>
        <div className="mb-2"><Icon size={18} className="text-zinc-400" /></div>
        <div className="text-sm font-semibold text-zinc-100 mb-1 leading-tight">{stage.title}</div>
        <div className="text-xs text-zinc-500 leading-snug mb-3 line-clamp-2">{stage.desc}</div>
        <div className="text-xs text-zinc-600 bg-zinc-800/60 rounded-lg px-2 py-1 truncate">{stage.channel}</div>
      </div>
      {!isLast && (
        <div className="flex-shrink-0 flex items-center self-center mt-2">
          <ChevronRight size={18} className="text-zinc-600" />
        </div>
      )}
    </div>
  );
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────

const DetailPanel = ({ stage, accentColor, onClose }) => {
  if (!stage) return null;
  const Icon = stage.icon;
  return (
    <div className="mt-6 bg-zinc-900 rounded-2xl ring-1 ring-zinc-700 p-5 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 text-xs">
        ✕ close
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
          <Icon size={18} style={{ color: accentColor }} />
        </div>
        <div>
          <div className="text-base font-bold text-zinc-100">{stage.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pillarColors[stage.pillar] || 'bg-zinc-700 text-zinc-400'}`}>
              {stage.pillar}
            </span>
            {stage.ai && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">
                <Sparkles size={10} /> AI-Powered
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{stage.detail}</p>
    </div>
  );
};

// ─── Journey Lane ─────────────────────────────────────────────────────────────

const JourneyLane = ({ title, subtitle, icon: LaneIcon, stages, accentColor }) => {
  const [selected, setSelected] = useState(null);
  const handleSelect = (stage) => setSelected(prev => prev?.num === stage.num ? null : stage);

  return (
    <div className="bg-zinc-900/50 rounded-3xl ring-1 ring-zinc-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
          <LaneIcon size={18} style={{ color: accentColor }} />
        </div>
        <div>
          <div className="text-lg font-bold text-zinc-100">{title}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">{stages.length} stages</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
            {stages.filter(s => s.ai).length} AI-powered
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-0 min-w-max">
          {stages.map((stage, i) => (
            <StageCard
              key={stage.num}
              stage={stage}
              accentColor={accentColor}
              isLast={i === stages.length - 1}
              onSelect={handleSelect}
              isSelected={selected?.num === stage.num}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <span className="text-xs text-zinc-600">Pillars:</span>
        {['Sales', 'Marketing', 'Operations', 'Finance / Legal', 'Marketing / Community'].map(fn => (
          <span key={fn} className={`text-xs px-2 py-0.5 rounded-full ${pillarColors[fn] || 'bg-zinc-700 text-zinc-400'}`}>{fn}</span>
        ))}
      </div>

      <DetailPanel stage={selected} accentColor={accentColor} onClose={() => setSelected(null)} />
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export const RoadmapView = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Customer Journey Maps</h1>
          <p className="text-sm text-zinc-500 mt-1">End-to-end journeys for all MulBros Media OS verticals — click any stage for detail</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/60 border border-zinc-700/50 px-3 py-1.5 rounded-lg">
          <Target size={13} />
          MulBros Media OS
        </div>
      </div>

      {/* OS Pillars */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Sales',      desc: 'Inbound lead capture, outbound outreach, CRM, deal pipeline, closing',              color: 'blue' },
          { label: 'Marketing',  desc: 'Content creation, ads, community, brand awareness, SEO, social listening',           color: 'purple' },
          { label: 'Operations', desc: 'Finance tracking, production planning, legal, resource planning, vendor ecosystems', color: 'emerald' },
          { label: 'Customer',   desc: 'Success, retention, community, testimonials, repeat business',                      color: 'rose' },
        ].map(p => (
          <div key={p.label} className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-4">
            <div className={`text-sm font-bold mb-1 text-${p.color}-400`}>{p.label}</div>
            <div className="text-xs text-zinc-500 leading-snug">{p.desc}</div>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Journey Maps</p>

      <JourneyLane
        title="Film Financing Vertical"
        subtitle="Indie filmmaker lead → AI tax incentive tool → production planning → finance tracking → tax filing"
        icon={Film}
        stages={filmStages}
        accentColor="#3b82f6"
      />

      <JourneyLane
        title="Talent OS — Luke & Talise"
        subtitle="Inbound query + proactive outreach → AI response → nurturing → deal closing → ongoing growth"
        icon={Music}
        stages={talentStages}
        accentColor="#f59e0b"
      />

      {/* Key Insights */}
      <div className="bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 p-5">
        <div className="text-sm font-semibold text-zinc-300 mb-3">Key Insights — MulBros Media OS</div>
        <ul className="space-y-2 text-xs text-zinc-500">
          <li className="flex gap-2"><span className="text-blue-400 flex-shrink-0">→</span> Film Financing: the free AI tax incentive calculator is the core lead magnet — filmmakers get value, we capture their project data.</li>
          <li className="flex gap-2"><span className="text-amber-400 flex-shrink-0">→</span> Talent OS: the AI talent manager responds to inbound in &lt;5 min and proactively hunts new work — emulating a top-tier human manager at scale.</li>
          <li className="flex gap-2"><span className="text-emerald-400 flex-shrink-0">→</span> 34% audience overlap between Last County viewers and Talise fans — cross-promotion between verticals is a compounding growth lever.</li>
          <li className="flex gap-2"><span className="text-purple-400 flex-shrink-0">→</span> Film financing clients (indie filmmakers) are natural leads for Luke's scoring services — two verticals feeding each other.</li>
          <li className="flex gap-2"><span className="text-rose-400 flex-shrink-0">→</span> The same OS engine (Sales · Marketing · Operations · Customer) deploys across LSSU, BFX Learn, and any future vertical with only a vertical-specific skin on top.</li>
        </ul>
      </div>
    </div>
  );
};
