/**
 * Selected-model state — localStorage-backed chat model picker.
 * The composer model pill writes here; ChatThread reads it to override the
 * agent's default model when calling the AI. Cross-tab synced like personaState.
 *
 * Only model IDs in the server's ALLOWED_MODELS set are offered.
 */
import { useEffect, useState, useCallback } from 'react';

const KEY = 'mulbros.model';
const EVT = 'mulbros:model-changed';
const DEFAULT = 'gpt-4o';

/** Curated, user-facing chat models (subset of server ALLOWED_MODELS). */
export const CHAT_MODELS = [
  { id: 'gpt-4o',            name: 'GPT-4o',        description: 'OpenAI flagship',    provider: 'openai',    badge: 'Default', accent: '#0F6E56' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet', description: 'Fast & capable',     provider: 'anthropic', badge: 'Pro',     accent: '#7C5CFF' },
  { id: 'claude-opus-4-5',   name: 'Claude Opus',   description: 'Most capable',       provider: 'anthropic', accent: '#B45309' },
  { id: 'claude-haiku-4-5',  name: 'Claude Haiku',  description: 'Lightning fast',     provider: 'anthropic', accent: '#22A6B3' },
  { id: 'gpt-4o-mini',       name: 'GPT-4o mini',   description: 'Fast & economical',  provider: 'openai',    accent: '#0F6E56' },
];

const isKnown = (id) => CHAT_MODELS.some(m => m.id === id);

const read = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v && isKnown(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
};

export const useSelectedModel = () => {
  const [model, setModelState] = useState(read);

  useEffect(() => {
    const onChange = (e) => setModelState(e?.detail && isKnown(e.detail) ? e.detail : read());
    const onStorage = (e) => { if (e.key === KEY) setModelState(read()); };
    window.addEventListener(EVT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setModel = useCallback((id) => {
    if (!isKnown(id)) return;
    try {
      localStorage.setItem(KEY, id);
      window.dispatchEvent(new CustomEvent(EVT, { detail: id }));
    } catch { /* storage disabled — in-memory only */ }
    setModelState(id);
  }, []);

  return { model, setModel, models: CHAT_MODELS };
};
