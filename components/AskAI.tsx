'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Loader2, ChevronUp } from 'lucide-react';

interface AskAIProps {
  channelName: string;
  channelCategory: string;
  programTitle?: string;
  programDescription?: string;
  isPlutoChannel?: boolean;
  isVisible: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamInfoResponse {
  answer: string;
  hasMetadata: boolean;
  contentTitle: string | null;
  contentType: 'movie' | 'tv' | null;
  posterUrl: string | null;
  rating: number | null;
  genres: string[];
  error?: string;
}

const QUICK_QUESTIONS = [
  "Who's in this?",
  "Where was this filmed?",
  "When was this made?",
  "Tell me more",
];

export function AskAI({
  channelName,
  channelCategory,
  programTitle,
  programDescription,
  isPlutoChannel,
  isVisible,
  onClose,
}: AskAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [contentInfo, setContentInfo] = useState<{
    title: string | null;
    type: 'movie' | 'tv' | null;
    rating: number | null;
    genres: string[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isVisible && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isVisible, isMinimized]);

  // Reset when channel changes
  useEffect(() => {
    setMessages([]);
    setContentInfo(null);
    setIsMinimized(false);
  }, [channelName, programTitle]);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/stream-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          channelName,
          channelCategory,
          programTitle,
          programDescription,
          isPlutoChannel,
        }),
      });

      const data: StreamInfoResponse = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I couldn't get that information right now. Try again in a moment.",
        }]);
      } else {
        // Store content info for display
        if (data.hasMetadata && data.contentTitle) {
          setContentInfo({
            title: data.contentTitle,
            type: data.contentType,
            rating: data.rating,
            genres: data.genres,
          });
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Couldn't connect to AI. Please check your connection.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [channelName, channelCategory, programTitle, programDescription, isPlutoChannel, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // Handle click outside to minimize
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (messages.length > 0) {
          setIsMinimized(true);
        } else {
          onClose();
        }
      }
    };

    if (isVisible && !isMinimized) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, isMinimized, messages.length, onClose]);

  if (!isVisible) return null;

  // Minimized state - small floating indicator
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2
                   bg-black/90 backdrop-blur-xl border border-white/10 rounded-full
                   hover:bg-black/95 transition-all animate-fade-in shadow-2xl"
      >
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="text-xs text-white/70">AI Chat</span>
        <ChevronUp className="w-3 h-3 text-white/50" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed bottom-0 right-0 z-50 w-full sm:w-96 max-h-[60vh] sm:max-h-[50vh]
                 sm:bottom-4 sm:right-4 sm:rounded-2xl overflow-hidden
                 bg-black/95 backdrop-blur-xl border-t sm:border border-white/10 shadow-2xl animate-slide-up
                 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600
                          flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Ask AI</h3>
            <p className="text-xs text-white/50 truncate max-w-[200px]">
              {programTitle || channelName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Content info badge */}
      {contentInfo && contentInfo.title && (
        <div className="px-4 py-2 border-b border-white/5 bg-violet-500/10">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300">
              {contentInfo.type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
            {contentInfo.rating && (
              <span className="text-yellow-400">★ {contentInfo.rating}</span>
            )}
            {contentInfo.genres.slice(0, 2).map(genre => (
              <span key={genre} className="text-white/40">{genre}</span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[120px] max-h-[300px]">
        {messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-white/40 text-sm mb-4">
              {programTitle
                ? `Ask me anything about "${programTitle}"`
                : "Ask me about what you're watching"
              }
            </p>
            {/* Quick questions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 text-xs rounded-full bg-white/10 border border-white/10
                             hover:bg-white/20 text-white/80 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-violet-500/30 text-white rounded-br-md'
                    : 'bg-white/10 text-white/90 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cast, filming locations..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder-white/30 text-sm
                       focus:outline-none focus:border-violet-500/50 focus:bg-white/10
                       disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-violet-500 hover:bg-violet-600
                       disabled:bg-violet-500/30 disabled:cursor-not-allowed
                       flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Subtle trigger button for the video player controls
export function AskAIButton({ onClick, hasProgram }: { onClick: () => void; hasProgram: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 md:w-10 md:h-10 glass rounded-lg flex items-center justify-center
                 hover:bg-white/10 active:bg-white/20 transition-all touch-manipulation
                 group relative"
      title="Ask AI about this content"
    >
      <Sparkles className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
      {hasProgram && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
      )}
    </button>
  );
}
