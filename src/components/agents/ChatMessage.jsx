import React from 'react';

export const ChatMessage = ({ message, agentName }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${
        isUser
          ? 'bg-zinc-800 rounded-2xl rounded-br-sm p-4'
          : 'bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm p-4'
      }`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-amber-500">{agentName}</span>
          </div>
        )}
        <p className="text-zinc-200 whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm p-4">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
};