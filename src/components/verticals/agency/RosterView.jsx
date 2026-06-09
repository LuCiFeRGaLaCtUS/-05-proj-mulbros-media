import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UsersRound, Plus, Trash2, X, Mail, Phone, Film, Bot, ExternalLink } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useRoster, UNION_OPTIONS } from '../../../hooks/useRoster';
import { useAskMO } from '../../../hooks/useAskMO';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const STATUS_COLORS = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-amber-50 text-amber-700 border-amber-200',
  dropped:  'bg-zinc-100 text-zinc-600 border-zinc-200',
};

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

const AddTalentModal = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({
    talent_name: '', email: '', phone: '',
    union_status: '', disciplines_csv: '', skills_csv: '',
    availability: '', headshot_url: '', reel_url: '', imdb_url: '', bio: '',
    status: 'active', commission_rate: 10,
  });

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.talent_name.trim()) {
      toast.error('Talent name required.');
      return;
    }
    const payload = {
      ...form,
      disciplines: form.disciplines_csv ? form.disciplines_csv.split(',').map(s => s.trim()).filter(Boolean) : [],
      skills:      form.skills_csv      ? form.skills_csv.split(',').map(s => s.trim()).filter(Boolean) : [],
      commission_rate: Number(form.commission_rate) || 10,
    };
    delete payload.disciplines_csv;
    delete payload.skills_csv;
    const t = await onAdd(payload);
    if (t) {
      toast.success('Talent added.');
      onClose();
      setForm({ talent_name: '', email: '', phone: '', union_status: '', disciplines_csv: '', skills_csv: '', availability: '', headshot_url: '', reel_url: '', imdb_url: '', bio: '', status: 'active', commission_rate: 10 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div className="font-bold text-zinc-900">Sign New Talent</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Talent Name *</label>
              <input required type="text" value={form.talent_name} onChange={(e) => setForm({ ...form, talent_name: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Union Status</label>
              <select value={form.union_status} onChange={(e) => setForm({ ...form, union_status: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400">
                {UNION_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Disciplines (comma-separated)</label>
            <input type="text" value={form.disciplines_csv} onChange={(e) => setForm({ ...form, disciplines_csv: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
              placeholder="acting, voiceover, dance" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Skills (comma-separated)</label>
            <input type="text" value={form.skills_csv} onChange={(e) => setForm({ ...form, skills_csv: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
              placeholder="period, drama, stunts, Spanish, accents" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Headshot URL</label>
              <input type="url" value={form.headshot_url} onChange={(e) => setForm({ ...form, headshot_url: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Reel URL</label>
              <input type="url" value={form.reel_url} onChange={(e) => setForm({ ...form, reel_url: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">IMDb Pro URL</label>
              <input type="url" value={form.imdb_url} onChange={(e) => setForm({ ...form, imdb_url: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Availability</label>
              <input type="text" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
                placeholder="Open · LA/NY · travel ok" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Commission Rate (%)</label>
              <input type="number" min="0" max="50" step="0.5" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-400"
              placeholder="Short pitch — 1-2 sentences." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600">Sign Talent</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TalentCard = ({ t, onUpdate, onDelete }) => {
  const statusColor = STATUS_COLORS[t.status] || STATUS_COLORS.active;
  return (
    <div className="group bg-white rounded-xl p-4" style={CARD_STYLE}>
      <div className="flex items-start gap-3 mb-3">
        {t.headshot_url ? (
          <img src={t.headshot_url} alt={t.talent_name}
            className="w-14 h-14 rounded-lg object-cover border border-zinc-200" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-lg flex-shrink-0">
            {t.talent_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-zinc-900 text-sm truncate">{t.talent_name}</div>
          {t.union_status && <div className="text-[11px] text-zinc-500">{t.union_status}</div>}
          <div className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border mt-1 ${statusColor}`}>
            {t.status}
          </div>
        </div>
        <button onClick={() => confirm(`Drop ${t.talent_name} from roster?`) && onDelete(t.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 transition">
          <Trash2 size={13} />
        </button>
      </div>

      {t.disciplines?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {t.disciplines.slice(0, 4).map((d, i) => (
            <span key={i} className="text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded">{d}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
        <span>{t.commission_rate}% commission</span>
        {t.email && <a href={`mailto:${t.email}`} className="hover:text-violet-600"><Mail size={11} /></a>}
        {t.phone && <a href={`tel:${t.phone}`} className="hover:text-violet-600"><Phone size={11} /></a>}
        {t.reel_url && <a href={t.reel_url} target="_blank" rel="noreferrer" className="hover:text-violet-600 ml-auto flex items-center gap-1"><Film size={11} /> Reel</a>}
      </div>

      <select value={t.status} onChange={(e) => onUpdate(t.id, { status: e.target.value })}
        className="mt-2 w-full text-[11px] bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-zinc-700 cursor-pointer">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="dropped">Dropped</option>
      </select>
    </div>
  );
};

export const RosterView = () => {
  const { profile } = useAppContext();
  const navigate = useNavigate();
  const { roster, counts, addTalent, updateTalent, deleteTalent } = useRoster(profile?.id);
  const askMO = useAskMO();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('active');

  const filtered = filter === 'all' ? roster : roster.filter(t => t.status === filter);

  const handleOpenAgent = () => {
    askMO('Help me manage my talent roster — union status, commissions, availability.', 'roster');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersRound className="text-violet-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Roster</h1>
          </div>
          <p className="text-sm text-zinc-500">Your signed talents · union status · commission rates · availability</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleOpenAgent}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-medium text-zinc-700 hover:border-violet-400 hover:text-violet-600">
            <Bot size={14} />
            Ask Roster Manager
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 shadow-md shadow-violet-500/20">
            <Plus size={14} />
            Sign Talent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Roster" value={counts.total} />
        <KpiCard label="Active" value={counts.active} accent="text-emerald-600" />
        <KpiCard label="Inactive" value={counts.inactive} accent="text-amber-600" />
        <KpiCard label="Dropped" value={counts.dropped} accent="text-zinc-500" />
      </div>

      <div className="flex items-center gap-1">
        {['active', 'inactive', 'dropped', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === s ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-violet-400'
            }`}>
            {s === 'all' ? `All (${counts.total})` : `${s[0].toUpperCase()}${s.slice(1)} (${counts[s]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300">
          <UsersRound className="mx-auto text-zinc-300 mb-3" size={32} />
          <div className="text-sm font-semibold text-zinc-700 mb-1">No talents in this filter</div>
          <p className="text-xs text-zinc-500 mb-4">Sign your first talent to start building the roster.</p>
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold text-violet-600 hover:text-violet-700">
            + Sign a talent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(t => <TalentCard key={t.id} t={t} onUpdate={updateTalent} onDelete={deleteTalent} />)}
        </div>
      )}

      <AddTalentModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addTalent} />
    </div>
  );
};
