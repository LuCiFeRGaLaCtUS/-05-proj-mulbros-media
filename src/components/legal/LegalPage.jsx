import React from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft } from 'lucide-react';

/**
 * Shared chrome for /privacy and /terms. Anonymous-readable (no auth gate).
 * Each consumer passes title + markdown body. Plain typography, max-w-3xl.
 */
export const LegalPage = ({ title, lastUpdated, markdown }) => (
  <div className="min-h-screen bg-zinc-50 py-12 px-6">
    <div className="max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-8"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </Link>
      <h1 className="text-3xl font-semibold text-zinc-900 mb-2">{title}</h1>
      <p
        className="text-xs text-zinc-500 mb-10 uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Last updated: {lastUpdated}
      </p>
      <article className="prose prose-zinc prose-sm max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
      <footer className="mt-16 pt-6 border-t border-zinc-200 text-xs text-zinc-400">
        Questions? Email{' '}
        <a className="underline hover:text-zinc-700" href="mailto:Arghya@fsztpartners.com">
          Arghya@fsztpartners.com
        </a>
      </footer>
    </div>
  </div>
);

export default LegalPage;
