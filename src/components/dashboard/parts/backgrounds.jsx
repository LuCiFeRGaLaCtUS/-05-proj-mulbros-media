import React from 'react';
import { Star } from 'lucide-react';

export const BgRevenue = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-blue-400/10 pointer-events-none" />
    <div className="absolute right-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-blue-400/15 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none" />
  </>
);

export const BgStreams = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
    <div className="absolute right-4 bottom-4 flex items-end gap-[3px] pointer-events-none opacity-[0.07]">
      {[14, 22, 10, 26, 18, 30, 16, 24, 12, 20].map((h, i) => (
        <div key={i} className="w-1.5 rounded-t-sm bg-amber-500" style={{ height: h }} />
      ))}
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,158,11,0.06),transparent_60%)] pointer-events-none" />
  </>
);

export const BgDeals = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none opacity-[0.08]">
      {[0,1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />)}
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
  </>
);

export const BgCommunity = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-purple-400/10 blur-xl pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.05),transparent_60%)] pointer-events-none" />
  </>
);

export const BgAudienceScore = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(245,158,11,0.07),transparent_65%)] pointer-events-none" />
    {[[10,8],[80,12],[25,72],[70,68],[50,18],[15,50],[88,50]].map(([x, y], i) => (
      <div key={i} className="absolute pointer-events-none opacity-[0.07]"
        style={{ left: `${x}%`, top: `${y}%` }}>
        <Star size={i % 2 === 0 ? 8 : 5} className="text-amber-400" fill="#f59e0b" />
      </div>
    ))}
  </>
);

export const BgDealFlow = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(16,185,129,0.07),transparent_60%)] pointer-events-none" />
    <div className="absolute top-3 right-3 space-y-1.5 pointer-events-none opacity-[0.06]">
      {[28, 20, 24, 16, 22].map((w, i) => (
        <div key={i} className="h-0.5 rounded-full bg-emerald-500" style={{ width: w }} />
      ))}
    </div>
  </>
);

export const BgRevenueChart = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(59,130,246,0.04),transparent_60%)] pointer-events-none" />
    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-blue-400/[0.04] select-none pointer-events-none leading-none">$</div>
  </>
);

export const BgPlatformChart = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(245,158,11,0.04),transparent_55%)] pointer-events-none" />
    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl font-black text-amber-400/[0.05] select-none pointer-events-none leading-none">♪</div>
  </>
);

export const BgFilmFrame = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-emerald-400/08 blur-lg pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(16,185,129,0.05),transparent_60%)] pointer-events-none" />
  </>
);

export const BgMusicStaff = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-400/08 blur-lg pointer-events-none" />
    <div className="absolute right-3 bottom-2 text-5xl font-black text-amber-400/[0.06] select-none pointer-events-none leading-none">♩</div>
  </>
);

export const BgPipeline = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-blue-400/08 blur-lg pointer-events-none" />
    <div className="absolute right-3 top-2 text-4xl font-black text-blue-400/[0.06] select-none pointer-events-none leading-none">$</div>
  </>
);

export const BgEmail = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-transparent pointer-events-none" />
    <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-purple-400/08 blur-lg pointer-events-none" />
    <div className="absolute right-3 top-1 text-5xl font-black text-purple-400/[0.06] select-none pointer-events-none leading-none">@</div>
  </>
);

export const BgProjectsTable = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/60 to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none" />
    <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden pointer-events-none">
      <div className="flex h-full">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-amber-400/20' : 'bg-zinc-300/20'}`} />
        ))}
      </div>
    </div>
  </>
);

export const BgTimeline = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(245,158,11,0.04),transparent_40%)] pointer-events-none" />
  </>
);
