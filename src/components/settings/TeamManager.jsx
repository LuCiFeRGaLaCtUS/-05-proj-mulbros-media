import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Mail, Trash2, Copy, Check, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../App';
import { logger } from '../../lib/logger';

const ROLES = ['admin', 'manager', 'member', 'viewer'];
const ROLE_BADGE = {
  admin:   'bg-red-50 text-red-700 border-red-200',
  manager: 'bg-amber-50 text-amber-700 border-amber-200',
  member:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  viewer:  'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const ORG = 'default'; // placeholder until Stytch orgs enabled — single tenant

export const TeamManager = () => {
  const { profile } = useAppContext();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = async () => {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    const [rolesRes, profilesRes, invitesRes] = await Promise.all([
      supabase.from('user_roles').select('*').eq('organization_id', ORG),
      supabase.from('profiles').select('id, email, display_name, organization'),
      supabase.from('team_invites').select('*').eq('inviter_id', profile.id).is('accepted_at', null),
    ]);
    const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.id, p]));
    const teamRows = (rolesRes.data || []).map(r => ({
      ...r,
      profile: profileMap[r.user_id] || { email: '(unknown)', display_name: null },
    }));
    // Always include current user as admin if no row
    if (!teamRows.some(r => r.user_id === profile.id)) {
      teamRows.unshift({
        user_id: profile.id,
        organization_id: ORG,
        role: 'admin',
        profile: { email: profile.email, display_name: profile.display_name },
      });
    }
    setMembers(teamRows);
    setInvites(invitesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [profile?.id]);

  const updateRole = async (user_id, role) => {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id, organization_id: ORG, role }, { onConflict: 'user_id,organization_id' });
    if (error) {
      logger.error('TeamManager.role.failed', error);
      toast.error('Could not update role');
    } else {
      toast.success('Role updated');
      load();
    }
  };

  const removeMember = async (user_id) => {
    if (user_id === profile?.id) { toast.error('Cannot remove yourself'); return; }
    const { error } = await supabase.from('user_roles').delete().eq('user_id', user_id).eq('organization_id', ORG);
    if (error) toast.error('Could not remove member'); else { toast.success('Removed'); load(); }
  };

  const revokeInvite = async (id) => {
    const { error } = await supabase.from('team_invites').delete().eq('id', id);
    if (error) toast.error('Could not revoke invite'); else { toast.success('Invite revoked'); load(); }
  };

  const copyLink = (token) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/accept-invite?token=${token}`;
    navigator.clipboard?.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
    toast.success('Invite link copied');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">Team members</div>
        <button onClick={() => setInviteOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Plus size={13} /> Invite
        </button>
      </div>

      <div className="relative bg-white rounded-xl border border-zinc-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-white to-white pointer-events-none" />
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60">
                <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Member</th>
                <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Email</th>
                <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Role</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="py-6 text-center text-zinc-500"><Loader2 size={13} className="animate-spin inline mr-1" />Loading…</td></tr>
              )}
              {!loading && members.map(m => (
                <tr key={m.user_id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2.5 px-4 text-sm font-medium text-zinc-900">{m.profile.display_name || m.profile.email?.split('@')[0] || 'User'}</td>
                  <td className="py-2.5 px-4 text-sm text-zinc-700">{m.profile.email || '—'}</td>
                  <td className="py-2.5 px-4">
                    <select value={m.role} onChange={e => updateRole(m.user_id, e.target.value)}
                      disabled={m.user_id === profile?.id}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[m.role] || ROLE_BADGE.member} disabled:opacity-60`}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {m.user_id !== profile?.id && (
                      <button onClick={() => removeMember(m.user_id)} className="text-zinc-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Pending invites</div>
          <div className="relative bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/60">
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Email</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Role</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Sent</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-zinc-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map(inv => (
                    <tr key={inv.id} className="border-b border-zinc-100">
                      <td className="py-2.5 px-4 text-sm text-zinc-900 flex items-center gap-2"><Mail size={12} className="text-zinc-400" />{inv.email}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[inv.role] || ROLE_BADGE.member}`}>{inv.role}</span>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-zinc-500 font-mono">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => copyLink(inv.token)} className="text-zinc-500 hover:text-amber-700 p-1" title="Copy invite link">
                            {copied === inv.token ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button onClick={() => revokeInvite(inv.id)} className="text-zinc-400 hover:text-red-600 p-1" title="Revoke"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} onSent={load} />}
    </div>
  );
};

const InviteModal = ({ onClose, onSent }) => {
  const { profile } = useAppContext();
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('member');
  const [saving, setSaving] = useState(false);

  const send = async () => {
    if (!email.trim() || !profile?.id) { toast.error('Email required'); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from('team_invites')
      .insert({ inviter_id: profile.id, organization_id: ORG, email: email.trim().toLowerCase(), role })
      .select()
      .single();
    setSaving(false);
    if (error) {
      logger.error('TeamManager.invite.failed', error);
      toast.error('Could not create invite');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/accept-invite?token=${data.token}`;
    navigator.clipboard?.writeText(link);
    toast.success('Invite created — link copied to clipboard');
    onSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h2 className="text-base font-bold text-zinc-900">Invite team member</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 p-1"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teammate@example.com"
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50" />
          </label>
          <label className="block">
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mb-1.5">Role</div>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full text-sm bg-white text-zinc-900 rounded-lg px-3 py-2 border border-zinc-200 focus:outline-none focus:border-amber-500/50">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <div className="text-xs text-zinc-500">
            Once Stytch organizations are enabled in the dashboard, sent invites will email the user directly. For now, a magic link is copied to your clipboard — share it manually.
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} className="text-sm text-zinc-700 px-4 py-2 hover:text-zinc-900">Cancel</button>
          <button onClick={send} disabled={saving || !email.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
            Create invite
          </button>
        </div>
      </div>
    </div>
  );
};
