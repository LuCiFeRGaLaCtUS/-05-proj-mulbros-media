import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Video, Upload, Lightbulb, Mic, Camera, Loader2, FileVideo } from 'lucide-react';
import { TalentAgentShell } from './TalentAgentShell';
import { uploadVideoToMux } from '../../../utils/integrations';
import { supabase } from '../../../lib/supabase';
import { useAppContext } from '../../../App';
import { useAskMO } from '../../../hooks/useAskMO';

const CARD_STYLE = {
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
};

export const SelfTapeView = () => {
  const { profile } = useAppContext();
  const askMO = useAskMO();
  const [setupDescription, setSetupDescription] = useState('');
  const [tapeTitle, setTapeTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const titleRef = useRef(null);

  // Block the dropzone from opening the file picker until a title exists —
  // give clear feedback instead of a silent dead click.
  const handleDropzoneClick = (e) => {
    if (uploading) { e.preventDefault(); return; }
    if (!tapeTitle.trim()) {
      e.preventDefault();
      toast.error('Add a title first.');
      titleRef.current?.focus();
    }
  };

  const handleAskCoach = () => {
    askMO(setupDescription.trim()
      ? `Review my self-tape setup: ${setupDescription}`
      : 'Help me prep a self-tape — what should my framing, lighting, and audio setup be?', 'selftape');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    if (!tapeTitle.trim()) {
      toast.error('Add a title before uploading.');
      return;
    }
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const { upload_id } = await uploadVideoToMux(file, (p) => setUploadProgress(p));
      const { error } = await supabase.from('self_tapes').insert({
        user_id:        profile.id,
        title:          tapeTitle,
        notes:          setupDescription || null,
        mux_upload_id:  upload_id,
        status:         'processing',
      });
      if (error) throw error;
      toast.success('Self-tape uploading to Mux. Processing usually 1-2 min.');
      setTapeTitle('');
      setUploadProgress(0);
    } catch (err) {
      console.error('Self-tape upload failed', err);
      toast.error(err.userMessage || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <TalentAgentShell
      title="Self-Tape Coach"
      description="Upload your self-tape and get AI feedback on framing, lighting, audio, and performance. Or describe your setup for text-based prep."
      Icon={Video}
      accentClass="text-sky-600"
      agentId="talent-self-tape-coach"
      agentLabel="Open Coach"
      features={[
        '4-dimensional review: framing · lighting · audio · performance',
        'Specific re-shoot adjustments (camera height, light placement, mic position)',
        'Slate guidance for cold reads',
        'Best practices by casting type (drama / comedy / commercial / VO)',
      ]}
      comingSoon={[
        'AI vision analysis of your tape (Sprint 5 — needs Mux webhook + GPT-4 vision)',
        'A/B compare two takes',
        'Auto-generate slate variants',
      ]}
    >
      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <FileVideo className="text-sky-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Upload self-tape to Mux</div>
        </div>
        <input
          ref={titleRef}
          type="text"
          value={tapeTitle}
          onChange={(e) => setTapeTitle(e.target.value)}
          placeholder="Title — e.g. Netflix Drama Pilot — Detective Scene"
          disabled={uploading}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-sky-400"
        />
        <label onClick={handleDropzoneClick} className={`block w-full border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition ${
          uploading
            ? 'border-zinc-200 bg-zinc-50'
            : 'border-zinc-300 hover:border-sky-400 hover:bg-sky-50'
        }`}>
          <input type="file" accept="video/*" className="hidden" disabled={uploading} onChange={handleFileUpload} />
          {uploading ? (
            <>
              <Loader2 className="mx-auto mb-2 text-sky-600 animate-spin" size={24} />
              <div className="text-sm font-semibold text-zinc-700">Uploading {Math.round(uploadProgress * 100)}%</div>
              <div className="w-full mt-2 bg-zinc-200 rounded-full h-1.5">
                <div className="bg-sky-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress * 100}%` }} />
              </div>
            </>
          ) : (
            <>
              <Upload className="mx-auto mb-2 text-zinc-400" size={24} />
              <div className="text-sm font-semibold text-zinc-700">{tapeTitle.trim() ? 'Click to choose video file' : 'Enter a title first'}</div>
              <div className="text-xs text-zinc-500 mt-1">MP4, MOV, WebM · up to 500 MB</div>
            </>
          )}
        </label>
        <div className="text-[11px] text-zinc-500 mt-2">
          Mux: set <code className="font-mono bg-zinc-100 px-1 rounded">MUX_TOKEN_ID</code> + <code className="font-mono bg-zinc-100 px-1 rounded">MUX_TOKEN_SECRET</code> in Render to enable.
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5" style={CARD_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Upload className="text-sky-600" size={16} />
          <div className="text-sm font-bold text-zinc-900">Quick prep — describe your setup</div>
        </div>
        <p className="text-sm text-zinc-500 mb-3">
          Until video upload ships, describe your camera, lighting, audio setup and the scene you're prepping.
          The coach will give targeted feedback.
        </p>
        <textarea
          value={setupDescription}
          onChange={(e) => setSetupDescription(e.target.value)}
          placeholder="e.g. Lumix S5 at eye level on tripod, soft key from window left, lav mic + Zoom H6 backup, 2-minute drama scene for a Netflix pilot — playing a 35-year-old detective in confrontation"
          rows={4}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <div className="flex gap-3 mt-3">
          <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-500"><Camera size={12} /> Framing</div>
            <div className="flex items-center gap-1.5 text-zinc-500"><Lightbulb size={12} /> Lighting</div>
            <div className="flex items-center gap-1.5 text-zinc-500"><Mic size={12} /> Audio</div>
          </div>
          <button onClick={handleAskCoach}
            disabled={!setupDescription.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              setupDescription.trim()
                ? 'bg-sky-500 text-white hover:bg-sky-600'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}>
            Ask Coach
          </button>
        </div>
      </div>
    </TalentAgentShell>
  );
};
