import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Plus, Mail, Phone, Building2, Trash2, X } from 'lucide-react';
import { useAppContext } from '../../App';
import { useIndustryContacts, CONTACT_TYPES } from '../../hooks/useIndustryContacts';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const TYPE_COLORS = {
  casting_director: 'bg-sky-50 text-sky-700 border-sky-200',
  producer:         'bg-amber-50 text-amber-700 border-amber-200',
  director:         'bg-violet-50 text-violet-700 border-violet-200',
  agent:            'bg-emerald-50 text-emerald-700 border-emerald-200',
  manager:          'bg-rose-50 text-rose-700 border-rose-200',
  scout:            'bg-orange-50 text-orange-700 border-orange-200',
  other:            'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const AddContactModal = ({ open, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name:         '',
    contact_type: 'casting_director',
    email:        '',
    phone:        '',
    company:      '',
    notes:        '',
  });

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    const c = await onAdd(form);
    if (c) {
      toast.success('Contact added.');
      onClose();
      setForm({ name: '', contact_type: 'casting_director', email: '', phone: '', company: '', notes: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div className="font-bold text-zinc-900">New Industry Contact</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                required className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Type</label>
              <select value={form.contact_type} onChange={(e) => setForm({ ...form, contact_type: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400">
                {CONTACT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Company / Agency</label>
            <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" placeholder="WME, CAA, indie studio…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="Credits, mutual connections, last conversation…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Add Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContactCard = ({ c, onDelete }) => {
  const typeLabel = CONTACT_TYPES.find(t => t.id === c.contact_type)?.label || c.contact_type;
  const typeColor = TYPE_COLORS[c.contact_type] || TYPE_COLORS.other;
  return (
    <div className="group bg-white rounded-xl p-4" style={CARD_STYLE}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold text-zinc-900 truncate">{c.name}</div>
          {c.company && (
            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
              <Building2 size={11} />
              <span className="truncate">{c.company}</span>
            </div>
          )}
        </div>
        <button onClick={() => confirm('Delete this contact?') && onDelete(c.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 transition">
          <Trash2 size={13} />
        </button>
      </div>
      <div className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${typeColor} mb-3`}>
        {typeLabel}
      </div>
      {(c.email || c.phone) && (
        <div className="space-y-1 mb-2 pt-2 border-t border-zinc-100">
          {c.email && (
            <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-amber-600">
              <Mail size={11} />
              <span className="truncate">{c.email}</span>
            </a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-amber-600">
              <Phone size={11} />
              <span>{c.phone}</span>
            </a>
          )}
        </div>
      )}
      {c.notes && (
        <p className="text-xs text-zinc-500 line-clamp-2 pt-2 border-t border-zinc-100">{c.notes}</p>
      )}
    </div>
  );
};

export const IndustryContactsView = () => {
  const { profile } = useAppContext();
  const { contacts, addContact, deleteContact } = useIndustryContacts(profile?.id);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.contact_type === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="text-amber-600" size={20} />
            <h1 className="text-xl font-bold text-zinc-900">Industry Contacts</h1>
          </div>
          <p className="text-sm text-zinc-500">Casting directors · producers · directors · agents · managers · scouts</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 shadow-md shadow-amber-500/20">
          <Plus size={14} />
          New Contact
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
            filter === 'all' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-amber-400'
          }`}>
          All ({contacts.length})
        </button>
        {CONTACT_TYPES.map(t => {
          const count = contacts.filter(c => c.contact_type === t.id).length;
          if (count === 0) return null;
          return (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                filter === t.id ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-700 hover:border-amber-400'
              }`}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-zinc-300">
          <Briefcase className="mx-auto text-zinc-300 mb-3" size={32} />
          <div className="text-sm font-semibold text-zinc-700 mb-1">No contacts yet</div>
          <p className="text-xs text-zinc-500 mb-4">Add casting directors, producers, and agents you work with.</p>
          <button onClick={() => setShowAdd(true)}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            + Add your first contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(c => <ContactCard key={c.id} c={c} onDelete={deleteContact} />)}
        </div>
      )}

      <AddContactModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={addContact} />
    </div>
  );
};
