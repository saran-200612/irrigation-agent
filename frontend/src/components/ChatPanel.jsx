import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function ChatPanel({ chatHistory = [], onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="bg-surface border border-water/10 rounded-[6px] p-4 flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-water/10 pb-3 mb-3">
        <MessageSquare className="w-4 h-4 text-water" />
        <h3 className="font-display text-[13px] tracking-wider uppercase text-text-dim">
          Follow-up Advisor Q&A Chat
        </h3>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4">
            <MessageSquare className="w-8 h-8 text-water mb-2" />
            <p className="text-[12px] max-w-xs">
              Ask follow-up questions about this field's schedule (e.g., "Why was watering skipped?" or "How does sand soil affect my tomatoes?").
            </p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[4px] px-3.5 py-2.5 text-[12.5px] leading-relaxed border ${
                    isUser
                      ? 'bg-bg border-water/20 text-text'
                      : 'bg-bg/40 border-water/5 text-text-dim'
                  }`}
                >
                  <span className={`block font-display text-[9px] uppercase tracking-wider mb-1 font-bold ${
                    isUser ? 'text-water text-right' : 'text-wheat'
                  }`}>
                    {isUser ? 'Operator' : 'Agronomy AI'}
                  </span>
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-bg/40 border border-water/5 rounded-[4px] px-3.5 py-3 text-[12px] text-text-dim flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-water rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-water rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-water rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Ask a question about the scheduling details..."
          className="flex-1 bg-bg border border-water/10 rounded-[4px] px-3 py-2 text-[12.5px] text-text placeholder-text-dim/30 focus:border-water outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-water hover:bg-water/80 disabled:bg-water/20 p-2 rounded-[4px] text-bg transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
