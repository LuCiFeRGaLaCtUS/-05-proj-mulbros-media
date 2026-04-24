import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BriefPanel } from './BriefPanel';
import { OutputPanel } from './OutputPanel';
import { getAgentById } from '../../config/agents';
import { callAI, getApiKey } from '../../utils/ai';

const agentMap = {
  'Last County (Film)': 'last-county-distribution',  // fix: was 'distribution-marketing' (non-existent)
  'Talise (Artist)': 'talise-marketing',
  'Composer': 'composer-sales',
  'Community (Newsletter)': 'community-manager'
};

export const ContentStudio = () => {
  const [target, setTarget] = useState('Last County (Film)');
  const [contentType, setContentType] = useState('TikTok Script');
  const [tone, setTone] = useState('Casual & Authentic');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const getAgentName = () => {
    const agentId = agentMap[target];
    const agent = getAgentById(agentId);
    return agent?.name || 'Unknown Agent';
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    setIsEditing(false);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Go to Settings > API Keys.');
      }

      const agentId = agentMap[target];
      const agent = getAgentById(agentId);

      if (!agent) {
        throw new Error(`No agent configured for "${target}". Check agent configuration.`);
      }

      const userMessage = `Create a ${contentType} for ${target}. Tone: ${tone}. ${additionalContext || ''}`;

      const response = await callAI(
        agent.systemPrompt,
        [{ role: 'user', content: userMessage }],
        apiKey
      );

      setGeneratedContent(response);
      toast.success('Content generated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    toast.success('Content approved and scheduled');
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleSaveEdit = () => {
    setGeneratedContent(editContent);
    setIsEditing(false);
    toast.success('Changes saved');
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6">
      <div className="w-2/5">
        <BriefPanel
          target={target}
          setTarget={setTarget}
          contentType={contentType}
          setContentType={setContentType}
          tone={tone}
          setTone={setTone}
          additionalContext={additionalContext}
          setAdditionalContext={setAdditionalContext}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>
      <div className="w-3/5">
        <OutputPanel
          content={isEditing ? editContent : generatedContent}
          agentName={getAgentName()}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editContent={editContent}
          setEditContent={setEditContent}
          onCopy={() => navigator.clipboard.writeText(isEditing ? editContent : generatedContent)}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          onSaveEdit={handleSaveEdit}
        />
      </div>
    </div>
  );
};