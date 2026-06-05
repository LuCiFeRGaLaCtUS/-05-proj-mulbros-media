import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, Quote } from 'lucide-react';
import { fetchPublicEPK } from '../../hooks/useEPK';

/**
 * Public, anonymous-readable EPK page. RLS allows anon SELECT when public=true.
 */
export const EPKPublicView = () => {
  const { slug } = useParams();
  const [kit, setKit]                 = useState(null);
  const [loading, setLoading]         = useState(true);
  const [emailRevealed, setEmailReveal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchPublicEPK(slug);
      if (!cancelled) {
        setKit(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">EPK not found</h1>
        <p className="text-sm text-zinc-500 mb-6">
          This press kit is private or doesn&rsquo;t exist.
        </p>
        <Link to="/" className="text-sm text-zinc-700 hover:underline">← Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <header
        className="relative w-full"
        style={{
          backgroundImage: kit.hero_image_url ? `url(${kit.hero_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#18181b',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
        <div className="relative max-w-3xl mx-auto px-6 py-24 text-white">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{kit.display_name}</h1>
          {kit.tagline && (
            <p className="text-lg md:text-xl text-white/85 mt-3 max-w-2xl">{kit.tagline}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* Reel */}
        {kit.reel_mux_id && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
              Reel
            </h2>
            <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-md">
              <iframe
                src={`https://player.mux.com/${kit.reel_mux_id}`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                title="Reel"
              />
            </div>
          </section>
        )}

        {/* Bio */}
        {kit.bio_md && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
              About
            </h2>
            <div className="text-base text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {kit.bio_md}
            </div>
          </section>
        )}

        {/* Press */}
        {kit.press_quotes?.length > 0 && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
              Press
            </h2>
            <ul className="space-y-4">
              {kit.press_quotes.map((q, i) => (
                <li key={i} className="border-l-2 border-zinc-300 pl-4">
                  <Quote className="w-4 h-4 text-zinc-400 mb-1" />
                  <p className="text-base text-zinc-800 italic">&ldquo;{q.quote}&rdquo;</p>
                  {q.source && <p className="text-sm text-zinc-500 mt-1">— {q.source}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Contact */}
        {kit.contact_email && (
          <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
              Contact
            </h2>
            {/* Click-to-reveal: keeps the booking contact usable for real
                visitors while denying it to bulk email scrapers. */}
            {emailRevealed ? (
              <a
                href={`mailto:${kit.contact_email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <Mail className="w-4 h-4" /> {kit.contact_email}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setEmailReveal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <Mail className="w-4 h-4" /> Show contact email
              </button>
            )}
          </section>
        )}

        <footer className="pt-12 border-t border-zinc-200 text-center text-xs text-zinc-400">
          Powered by AI Operator
        </footer>
      </main>
    </div>
  );
};

export default EPKPublicView;
