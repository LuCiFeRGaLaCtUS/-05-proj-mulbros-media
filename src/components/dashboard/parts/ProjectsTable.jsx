import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { BgProjectsTable } from './backgrounds';
import { C } from './constants';

const projects = [
  { name: 'Last County (Hulu)',  role: 'Distribution', progress: 78, status: 'Active',      color: C.emerald, page: 'productions' },
  { name: 'Saltwater',          role: 'Composer',     progress: 55, status: 'In Progress', color: C.gold,    page: 'financing'   },
  { name: 'Echo Valley',        role: 'Composer',     progress: 20, status: 'Negotiating', color: C.blue,    page: 'financing'   },
  { name: 'Talise — Growth',    role: 'Music',        progress: 85, status: 'Active',      color: C.gold,    page: 'music'       },
  { name: 'Community Campaign', role: 'Marketing',    progress: 40, status: 'Active',      color: C.purple,  page: 'music'       },
];

const badge = {
  'Active':      'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  'Negotiating': 'bg-blue-50 text-blue-700 border-blue-200',
};

export const ProjectsTable = ({ onRowClick }) => (
  <div className="tile-pop relative rounded-2xl overflow-hidden"
    style={{ background: 'linear-gradient(180deg, #fafaf8 0%, #ffffff 50%)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
    <BgProjectsTable />
    <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100">
      <div>
        <h3 className="text-sm font-bold text-zinc-900" style={{ fontFamily: 'var(--font-sans)' }}>Active Projects</h3>
        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
          <CheckCircle2 size={11} className="text-emerald-500" />
          3 projects delivered this quarter
        </p>
      </div>
      <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">{projects.length} total</span>
    </div>
    <div className="relative z-10 px-4 py-2">
      <div className="grid grid-cols-12 gap-3 px-2 py-2 text-[11px] font-bold text-zinc-600 uppercase tracking-widest border-b border-zinc-100 mb-1">
        <span className="col-span-4">Project</span>
        <span className="col-span-2">Vertical</span>
        <span className="col-span-3">Progress</span>
        <span className="col-span-3">Status</span>
      </div>
      {projects.map((p) => (
        <button key={p.name} onClick={() => onRowClick?.(p.page)}
          className="w-full grid grid-cols-12 gap-3 items-center px-2 py-3 rounded-xl hover:bg-zinc-50 active:bg-zinc-100 transition-colors border-b border-zinc-50 last:border-0 cursor-pointer group text-left">
          <div className="col-span-4">
            <p className="text-sm text-zinc-700 font-semibold group-hover:text-zinc-900 transition-colors truncate">{p.name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-zinc-500">{p.role}</p>
          </div>
          <div className="col-span-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all group-hover:opacity-80" style={{ width: `${p.progress}%`, backgroundColor: p.color }} />
            </div>
            <span className="text-xs font-mono text-zinc-500 w-7 text-right flex-shrink-0">{p.progress}%</span>
          </div>
          <div className="col-span-3 flex items-center justify-between">
            <span className={`inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge[p.status]}`}>
              {p.status}
            </span>
            <ArrowRight size={11} className="text-zinc-500 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>
      ))}
    </div>
  </div>
);
