import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ArrowUp, Paperclip, Square, X, Globe, MessageCircle, Cpu, Brain as BrainCog,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AI Prompt Box — ChatGPT-style composer, light/amber/white theme.
 * Replaces a plain <textarea> + send button.
 *
 * Props:
 *   onSend(text, files)     — fires on Enter / click Send
 *   isLoading (bool)        — disables box + shows stop icon
 *   placeholder (str)
 *   searchMode              — 'off' | 'reddit' | 'web' (controlled)
 *   onSearchModeChange      — (newMode)
 */

const cn = (...c) => c.filter(Boolean).join(' ');

const SCROLLBAR_CSS = `
  .aipromptbox textarea::-webkit-scrollbar { width: 6px; }
  .aipromptbox textarea::-webkit-scrollbar-track { background: transparent; }
  .aipromptbox textarea::-webkit-scrollbar-thumb { background-color: #d4d4d8; border-radius: 3px; }
  .aipromptbox textarea::-webkit-scrollbar-thumb:hover { background-color: #a1a1aa; }
`;

// ── Radix wrappers ────────────────────────────────────────────────────────
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

const Dialog = DialogPrimitive.Root;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/40 backdrop-blur-sm', className)}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 w-full max-w-[800px] translate-x-[-50%] translate-y-[-50%] bg-white border border-zinc-200 rounded-2xl shadow-xl',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 rounded-full bg-zinc-100 hover:bg-zinc-200 p-2 transition">
        <X className="h-4 w-4 text-zinc-700" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-bold text-zinc-900', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

// ── Image preview dialog ─────────────────────────────────────────────────
const ImageViewDialog = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[90vw]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          <img src={imageUrl} alt="Preview" className="w-full max-h-[80vh] object-contain rounded-2xl" />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main box ──────────────────────────────────────────────────────────────
export const AIPromptBox = React.forwardRef((props, ref) => {
  const {
    onSend = () => {},
    isLoading = false,
    placeholder = 'Type your message…',
    className,
    searchMode = 'off',
    onSearchModeChange,
    initialValue = '',
  } = props;

  const [input, setInput] = React.useState(initialValue);
  React.useEffect(() => {
    if (initialValue) setInput(initialValue);
  }, [initialValue]);
  const [files, setFiles] = React.useState([]);
  const [filePreviews, setFilePreviews] = React.useState({});
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [showThink, setShowThink] = React.useState(false);
  const uploadInputRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  // Resize textarea to content
  React.useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
  }, [input]);

  const isImage = (f) => f.type.startsWith('image/');

  const processFile = (file) => {
    if (!isImage(file)) return;
    if (file.size > 10 * 1024 * 1024) return;
    setFiles([file]);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreviews({ [file.name]: e.target?.result });
    reader.readAsDataURL(file);
  };

  const handlePaste = React.useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) { e.preventDefault(); processFile(file); break; }
      }
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropFiles = Array.from(e.dataTransfer.files).filter(isImage);
    if (dropFiles[0]) processFile(dropFiles[0]);
  };

  const removeFile = () => { setFiles([]); setFilePreviews({}); };

  const submit = () => {
    if (!input.trim() && files.length === 0) return;
    let prefix = '';
    if (showThink) prefix = '[Think] ';
    const text = prefix + input;
    onSend(text, files);
    setInput(''); setFiles([]); setFilePreviews({});
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const hasContent = input.trim() !== '' || files.length > 0;
  const cycleSearchMode = () => {
    const order = ['off', 'reddit', 'web'];
    const next = order[(order.indexOf(searchMode) + 1) % order.length];
    onSearchModeChange?.(next);
  };
  const SearchIcon = searchMode === 'reddit' ? MessageCircle : searchMode === 'web' ? Globe : Cpu;
  const searchLabel = searchMode === 'reddit' ? 'Reddit' : searchMode === 'web' ? 'Web' : 'No search';

  return (
    <>
      <style>{SCROLLBAR_CSS}</style>
      <TooltipProvider>
        <div
          ref={ref}
          className={cn(
            'aipromptbox rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm transition-all duration-300',
            isLoading && 'border-amber-400/60',
            className,
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 p-0 pb-1">
              {files.map((file, i) => (
                filePreviews[file.name] && (
                  <div key={i} className="relative group">
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden cursor-pointer border border-zinc-200"
                      onClick={() => setSelectedImage(filePreviews[file.name])}
                    >
                      <img src={filePreviews[file.name]} alt={file.name} className="h-full w-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-black/80 p-0.5"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={
              showThink ? 'Think deeply about this…'
              : searchMode === 'reddit' ? 'Search Reddit…'
              : searchMode === 'web' ? 'Search the web…'
              : placeholder
            }
            rows={1}
            disabled={isLoading}
            className="w-full resize-none border-none bg-transparent px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none disabled:opacity-50 min-h-[44px]"
            style={{ outline: 'none' }}
          />

          <div className="flex items-center justify-between gap-2 p-0 pt-2">
            <div className="flex items-center gap-1">
              {/* Upload */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex h-8 w-8 text-zinc-500 hover:text-amber-700 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-amber-50 disabled:opacity-40"
                    aria-label="Upload image"
                  >
                    <Paperclip className="h-5 w-5" />
                    <input
                      ref={uploadInputRef} type="file" className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) processFile(e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Upload image</TooltipContent>
              </Tooltip>

              {/* Search mode cycler */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={cycleSearchMode}
                    type="button"
                    className={cn(
                      'rounded-full transition-all flex items-center gap-1 px-2.5 py-1 border h-8 text-xs font-semibold',
                      searchMode === 'reddit' ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : searchMode === 'web' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
                    )}
                  >
                    <motion.div
                      animate={{ scale: searchMode !== 'off' ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                    >
                      <SearchIcon className="w-4 h-4" />
                    </motion.div>
                    <AnimatePresence>
                      {searchMode !== 'off' && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {searchLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Search mode: {searchLabel} (click to cycle)</TooltipContent>
              </Tooltip>

              {/* Think */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowThink(v => !v)}
                    className={cn(
                      'rounded-full transition-all flex items-center gap-1 px-2.5 py-1 border h-8 text-xs font-semibold',
                      showThink
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
                    )}
                  >
                    <motion.div
                      animate={{ scale: showThink ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                    >
                      <BrainCog className="w-4 h-4" />
                    </motion.div>
                    <AnimatePresence>
                      {showThink && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          Think
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Deep reasoning mode</TooltipContent>
              </Tooltip>
            </div>

            {/* Send */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={submit}
                  disabled={isLoading || !hasContent}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center transition-all',
                    isLoading ? 'bg-zinc-200 text-zinc-500'
                    : hasContent ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed',
                  )}
                  aria-label="Send"
                >
                  {isLoading ? <Square className="h-4 w-4 fill-current animate-pulse" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{isLoading ? 'Generating…' : hasContent ? 'Send (Enter)' : 'Type to send'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
      <ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
});
AIPromptBox.displayName = 'AIPromptBox';
