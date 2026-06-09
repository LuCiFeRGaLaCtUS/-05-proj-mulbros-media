import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plug, ChevronDown, Check, Loader2, Zap, Sparkles, Brain } from 'lucide-react';
import { SlashMenu } from './SlashMenu';
import { parseSlashCommand } from '../../lib/personaRouter';
import { useSelectedModel } from '../../lib/selectedModel';

/**
 * ChatBar — composer for ChatHome + ChatThread.
 * Bolt-style card (white theme): auto-grow textarea on top, a toolbar row below
 * with the integrations toggle + a working model selector pill on the left and
 * the send button on the right. Slash menu opens on `/`.
 *
 * Props:
 *   onSend          — (text) => Promise<void>
 *   onIntegrations  — () => void   optional integrations toggle
 *   disabled        — boolean
 *   placeholder     — string
 *   value / onChange — optional controlled value
 *   autoFocus       — boolean
 *   sending         — boolean (spinner on send)
 */

const MODEL_ICON = {
  'gpt-4o':            <Zap className="size-4" style={{ color: '#0F6E56' }} />,
  'gpt-4o-mini':       <Zap className="size-4" style={{ color: '#0F6E56' }} />,
  'claude-sonnet-4-5': <Sparkles className="size-4" style={{ color: '#7C5CFF' }} />,
  'claude-opus-4-5':   <Sparkles className="size-4" style={{ color: '#B45309' }} />,
  'claude-haiku-4-5':  <Brain className="size-4" style={{ color: '#22A6B3' }} />,
};

function ModelSelector() {
  const { model, setModel, models } = useSelectedModel();
  const [open, setOpen] = useState(false);
  const selected = models.find(m => m.id === model) || models[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors"
        style={{ color: '#5a6472' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(11,29,58,0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Select model"
      >
        {MODEL_ICON[selected.id] || <Zap className="size-4" style={{ color: '#0F6E56' }} />}
        <span>{selected.name}</span>
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full left-0 mb-2 z-50 min-w-[230px] rounded-xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E0E0E0', boxShadow: '0 12px 32px rgba(11,29,58,0.16), 0 2px 8px rgba(11,29,58,0.08)' }}
          >
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9aa3b0' }}>
                Model
              </div>
              {models.map((m) => {
                const active = m.id === selected.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setModel(m.id); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                    style={{ background: active ? 'rgba(15,110,86,0.08)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(11,29,58,0.04)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex-shrink-0">{MODEL_ICON[m.id]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: '#0B1D3A' }}>{m.name}</span>
                        {m.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(15,110,86,0.1)', color: '#0F6E56' }}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px]" style={{ color: '#9aa3b0' }}>{m.description}</span>
                    </div>
                    {active && <Check size={15} style={{ color: '#0F6E56', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export const ChatBar = ({
  onSend,
  onIntegrations,
  disabled = false,
  placeholder = "Ask MO anything — or type / for commands",
  value: controlledValue,
  onChange: controlledOnChange,
  autoFocus = false,
  sending = false,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const setValue = isControlled ? (v) => controlledOnChange?.(v) : setInternalValue;

  const inputRef = useRef(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Detect slash trigger
  useEffect(() => {
    const { command } = parseSlashCommand(value || '');
    const trimmed = (value || '').trim();
    if (trimmed.startsWith('/') && !trimmed.includes(' ')) {
      setSlashOpen(true);
      setSlashQuery(trimmed.slice(1));
    } else if (command && trimmed.startsWith('/' + command) && !trimmed.includes(' ')) {
      setSlashOpen(true);
      setSlashQuery(command);
    } else {
      setSlashOpen(false);
    }
  }, [value]);

  const handlePickSlash = useCallback((cmd) => {
    setValue(`${cmd} `);
    setSlashOpen(false);
    inputRef.current?.focus();
  }, [setValue]);

  const submit = useCallback(async () => {
    const text = (value || '').trim();
    if (!text || disabled || sending) return;
    await onSend?.(text);
    setValue('');
  }, [value, disabled, sending, onSend, setValue]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !slashOpen) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = (value || '').trim() && !sending && !disabled;

  return (
    <div className="relative w-full">
      {slashOpen && (
        <SlashMenu
          query={slashQuery}
          onPick={handlePickSlash}
          onClose={() => setSlashOpen(false)}
        />
      )}

      <div
        className="rounded-2xl transition-all"
        style={{
          background: '#FFFFFF',
          border:     '1px solid #E0E0E0',
          boxShadow:  '0 1px 3px rgba(11,29,58,0.05), 0 8px 24px rgba(11,29,58,0.04)',
        }}
      >
        {/* Textarea */}
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Message MO"
          className="w-full resize-none bg-transparent outline-none text-[15px] px-4 pt-3.5 pb-1"
          style={{
            color:      '#0B1D3A',
            fontFamily: 'Inter, system-ui, sans-serif',
            minHeight:  44,
            maxHeight:  200,
            lineHeight: 1.5,
          }}
        />

        {/* Toolbar row */}
        <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1">
          {onIntegrations && (
            <button
              type="button"
              onClick={onIntegrations}
              aria-label="Integrations"
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ width: 32, height: 32, background: 'rgba(15,110,86,0.08)', color: '#0F6E56', flexShrink: 0 }}
            >
              <Plug size={15} />
            </button>
          )}

          <ModelSelector />

          <div className="flex-1" />

          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width:      36,
              height:     36,
              background: canSend ? '#0F6E56' : 'rgba(15,110,86,0.25)',
              color:      '#FFFFFF',
              flexShrink: 0,
              cursor:     canSend ? 'pointer' : 'not-allowed',
            }}
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBar;
