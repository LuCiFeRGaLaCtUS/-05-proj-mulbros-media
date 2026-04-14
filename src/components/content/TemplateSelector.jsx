import React from 'react';

export const TemplateSelector = ({ onSelect }) => {
  const templates = [
    { id: 'tiktok-short', name: 'TikTok Short', description: '60sec video script' },
    { id: 'instagram-caption', name: 'Instagram Caption', description: 'Story or post caption' },
    { id: 'email-newsletter', name: 'Newsletter', description: 'Monthly email template' },
    { id: 'cold-email', name: 'Cold Email', description: 'B2B outreach template' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className="text-left p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/50 hover:border-amber-500/30 transition-all"
        >
          <div className="text-sm font-medium text-zinc-200">{template.name}</div>
          <div className="text-xs text-zinc-500">{template.description}</div>
        </button>
      ))}
    </div>
  );
};