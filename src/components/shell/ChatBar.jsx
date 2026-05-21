import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Plug, Globe, X, Loader2 } from 'lucide-react';
import { SlashMenu } from './SlashMenu';
import { parseSlashCommand } from '../../lib/personaRouter';

/**
 * ChatBar — pill-shaped composer for ChatHome + ChatThread.
 * Layout (per FSZT screen7-dashboard.jsx):
 *   [Plug toggle] | divider | [text input] | [voice toggle] | [send circular]
 *
 * Slash menu opens when user types `/` at the start of message.
 *
 * Props:
 *   onSend          — (text) => Promise<void>
 *   onIntegrations  — () => void   optional toggle for integrations dropdown
 *   onVoice         — () => void   optional voice toggle (Phase B; stub here)
 *   disabled        — boolean
 *   placeholder     — string
 *   value           — controlled value (optional)
 *   onChange        — controlled change handler (optional)
 *   autoFocus       — boolean
 *   sending         — boolean (shows spinner on send button)
 */
export const ChatBar = ({
  onSend,
  onIntegrations,
  onVoice,
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
  const setValue = isControlled
    ? (v) => controlledOnChange?.(v)
    : setInternalValue;

  const inputRef = useRef(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Detect slash trigger
  useEffect(() => {
    const { command } = parseSlashCommand(value || '');
    // Open if message starts with "/" and we're at the start word
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
        className="flex items-center gap-2 rounded-full transition-all"
        style={{
          background:    '#FFFFFF',
          border:        '1px solid #E0E0E0',
          padding:       '6px 6px 6px 12px',
          boxShadow:     '0 1px 3px rgba(11,29,58,0.04)',
          minHeight:     48,
        }}
      >
        {/* Integrations toggle */}
        {onIntegrations && (
          <>
            <button
              type="button"
              onClick={onIntegrations}
              aria-label="Integrations"
              className="flex items-center justify-center rounded-full transition-colors"
              style={{
                width:      32,
                height:     32,
                background: 'rgba(15,110,86,0.08)',
                color:      '#0F6E56',
                flexShrink: 0,
              }}
            >
              <Plug size={15} />
            </button>
            <div style={{ width: 1, height: 24, background: '#E0E0E0', flexShrink: 0 }} />
          </>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Message MO"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color:       '#0B1D3A',
            fontFamily:  'Inter, system-ui, sans-serif',
            minWidth:    0,
          }}
        />

        {/* Voice toggle (stub Phase A) */}
        {onVoice && (
          <button
            type="button"
            onClick={onVoice}
            aria-label="Voice input"
            className="flex items-center justify-center rounded-full transition-colors"
            style={{
              width:      32,
              height:     32,
              background: 'rgba(0,0,0,0.04)',
              color:      '#888',
              flexShrink: 0,
            }}
          >
            <Mic size={15} />
          </button>
        )}

        {/* Send */}
        <button
          type="button"
          onClick={submit}
          disabled={disabled || sending || !(value || '').trim()}
          aria-label="Send message"
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width:      36,
            height:     36,
            background: (value || '').trim() && !sending ? '#0F6E56' : 'rgba(15,110,86,0.25)',
            color:      '#FFFFFF',
            flexShrink: 0,
            cursor:     (value || '').trim() && !sending ? 'pointer' : 'not-allowed',
          }}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
};

export default ChatBar;
