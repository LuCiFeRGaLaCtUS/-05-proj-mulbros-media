import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Globe, Lock, Bot, Image as ImageIcon, Mail, Quote } from 'lucide-react';
import { useAppContext } from '../../../App';
import { useEPK } from '../../../hooks/useEPK';

const CARD_STYLE = {
  border:    '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

const Empty = ({ onChat }) => (
  <div className="bg-white rounded-2xl p-10 text-center" style={CARD_STYLE}>
    <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center mb-4">
      <FileText className="w-6 h-6 text-zinc-500" />
    </div>
    <h2 className="text-lg font-semibold text-zinc-900 mb-1">No EPK yet</h2>
    <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
      Build a shareable press kit with your bio, reel, press quotes, and contact — a single URL you can drop in any pitch.
    </p>
    <button
      onClick={onChat}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
    >
      <Bot className="w-4 h-4" /> Build my EPK with MO
    </button>
  </div>
);

const Section = ({ icon: Icon, label, children, muted }) => (
  <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-zinc-500" />
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
    </div>
    {muted ? <p className="text-sm text-zinc-400 italic">{children}</p> : children}
  </div>
);

export const EPKBuilderView = () => {
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const { kit, loading } = useEPK(profile?.id);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-8 w-64 bg-zinc-100 rounded-md animate-pulse mb-6" />
        <div className="h-40 bg-zinc-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 mb-1">EPK</h1>
          <p className="text-sm text-zinc-500">Electronic press kit · shareable public profile</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
        >
          <Bot className="w-4 h-4" /> {kit ? 'Edit with MO' : 'Build with MO'}
        </button>
      </div>

      {!kit ? (
        <Empty onChat={() => navigate('/')} />
      ) : (
        <>
          {/* Header card */}
          <div className="bg-white rounded-2xl p-6" style={CARD_STYLE}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{kit.display_name || '—'}</h2>
                {kit.tagline && <p className="text-sm text-zinc-600 mt-1">{kit.tagline}</p>}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full uppercase tracking-wider ${
                  kit.public
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                }`}
              >
                {kit.public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {kit.public ? 'Public' : 'Private'}
              </span>
            </div>
            {kit.public ? (
              <a
                href={`/epk/${kit.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 font-mono"
              >
                /epk/{kit.slug} <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-xs text-zinc-400 font-mono">/epk/{kit.slug} · not yet published</p>
            )}
          </div>

          {/* Bio */}
          <Section icon={FileText} label="Bio" muted={!kit.bio_md}>
            {kit.bio_md ? (
              <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{kit.bio_md}</div>
            ) : (
              'No bio yet — ask MO to write one.'
            )}
          </Section>

          {/* Reel */}
          <Section icon={ImageIcon} label="Showreel" muted={!kit.reel_mux_id}>
            {kit.reel_mux_id ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-zinc-900">
                <iframe
                  src={`https://player.mux.com/${kit.reel_mux_id}`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  title="EPK Reel"
                />
              </div>
            ) : (
              'No reel yet — upload via Mux and ask MO to attach the playback id.'
            )}
          </Section>

          {/* Press quotes */}
          <Section icon={Quote} label="Press" muted={!kit.press_quotes?.length}>
            {kit.press_quotes?.length ? (
              <ul className="space-y-3">
                {kit.press_quotes.map((q, i) => (
                  <li key={i} className="text-sm text-zinc-700">
                    <span className="italic">&ldquo;{q.quote}&rdquo;</span>{' '}
                    {q.source && <span className="text-zinc-500">— {q.source}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              'No press quotes yet.'
            )}
          </Section>

          {/* Contact */}
          <Section icon={Mail} label="Contact" muted={!kit.contact_email}>
            {kit.contact_email ? (
              <a className="text-sm text-zinc-700 hover:underline" href={`mailto:${kit.contact_email}`}>{kit.contact_email}</a>
            ) : (
              'No contact email yet.'
            )}
          </Section>
        </>
      )}
    </div>
  );
};

export default EPKBuilderView;
