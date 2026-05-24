'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  escalated?: boolean;
}

async function createConversation(): Promise<string> {
  const res = await fetch(`${API_BASE}/conversations`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create conversation');
  const data = await res.json();
  return data.conversation_id;
}

async function sendChat(conversationId: string, message: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function startNewChat() {
    setInitializing(true);
    setMessages([]);
    setInput('');
    try {
      const id = await createConversation();
      setConversationId(id);
    } catch {
      console.error('Backend unreachable — is it running on port 8000?');
    } finally {
      setInitializing(false);
    }
  }

  useEffect(() => { startNewChat(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || !conversationId || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const data = await sendChat(conversationId, text);
      setMessages(prev => [
        ...prev,
        data.escalated
          ? { role: 'assistant', content: data.reason ?? 'Escalated to human agent.', escalated: true }
          : { role: 'assistant', content: data.ai_message, escalated: false },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'ERROR: Could not reach backend on port 8000.', escalated: false },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const disabled = loading || initializing || !conversationId;

  return (
    <div className="h-screen flex flex-col bg-navy">
      {/* Scanlines overlay */}
      <div id="scanlines" />

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-24 py-4 bg-deep border-b border-blue">
        <div className="flex items-center gap-3">
          <span className="status-dot" />
          <h1 className="text-[0.6rem] tracking-[0.15em]">AI_CHATBOT.exe</h1>
        </div>
        <button
          onClick={startNewChat}
          disabled={initializing}
          className="font-terminal text-lg text-sky border border-blue rounded px-4 py-1
                     hover:text-cyan hover:border-cyan transition-colors duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'transparent' }}
        >
          [ NEW_CHAT ]
        </button>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center">

        {/* Empty / initializing — centered vertically and horizontally */}
        {messages.length === 0 && (
          <div className="flex-1 w-full flex flex-col items-center justify-center gap-3 text-center px-4">
            {initializing ? (
              <p className="font-terminal text-sky text-xl tracking-widest animate-pulse">
                INITIALIZING SESSION...
              </p>
            ) : (
              <>
                <p className="font-terminal text-sky text-2xl tracking-widest">
                  READY FOR INPUT
                </p>
                <p className="font-body text-sm" style={{ color: 'rgba(232,244,255,0.35)' }}>
                  Type a message below to begin your session.
                </p>
              </>
            )}
          </div>
        )}

        {/* Message list */}
        {messages.length > 0 && (
          <div className="w-full max-w-2xl mx-auto px-10 py-6 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="font-terminal text-sky text-sm tracking-wider">
                  {msg.role === 'user' ? '// YOU' : '// ASSISTANT'}
                </span>

                {msg.escalated ? (
                  <div
                    className="rounded-lg px-6 py-4 max-w-sm space-y-1.5"
                    style={{
                      background: 'rgba(124,45,18,0.2)',
                      border: '1px solid #f97316',
                      boxShadow: '0 0 14px rgba(249,115,22,0.2)',
                    }}
                  >
                    <p className="font-terminal text-lg tracking-wider" style={{ color: '#fb923c' }}>
                      !! ESCALATED TO HUMAN !!
                    </p>
                    <p className="font-body text-sm leading-relaxed" style={{ color: '#fed7aa' }}>
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg px-6 py-4 max-w-sm bg-deep border transition-all duration-200
                      ${msg.role === 'user' ? 'border-sky' : 'border-cyan'}`}
                  >
                    <p className="font-body text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex flex-col items-start gap-1">
                <span className="font-terminal text-sky text-sm tracking-wider">
                  {'// ASSISTANT'}
                </span>
                <div className="rounded-lg px-5 py-3 bg-deep border border-cyan">
                  <span className="font-terminal text-cyan text-xl animate-pulse">
                    THINKING_
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* ── Input footer ── */}
      <footer className="shrink-0 border-t border-blue py-4 flex justify-center">
        <div className="w-full max-w-2xl mx-auto px-10">
          <div className="flex gap-3">

            <div className="relative flex-1">
              <input
                suppressHydrationWarning
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                placeholder="TYPE YOUR MESSAGE..."
                className="w-full rounded py-3 pl-4 pr-4 font-terminal text-lg text-white
                           outline-none transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--mid)',
                  border: '1px solid var(--blue)',
                  caretColor: 'var(--cyan)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--cyan)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0,229,255,0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className="font-terminal text-lg rounded px-5 py-3 min-w-12 flex items-center justify-center transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--bright)',
                color: 'var(--white)',
                border: '1px solid var(--bright)',
              }}
              onMouseEnter={e => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'var(--cyan)';
                  e.currentTarget.style.color = 'var(--navy)';
                  e.currentTarget.style.borderColor = 'var(--cyan)';
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(0,229,255,0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bright)';
                e.currentTarget.style.color = 'var(--white)';
                e.currentTarget.style.borderColor = 'var(--bright)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          {conversationId && (
            <p
              className="text-center mt-1.5 font-terminal text-xs tracking-widest"
              style={{ color: 'rgba(56,180,255,0.3)' }}
            >
              SESSION_ID: {conversationId.slice(0, 8).toUpperCase()}...
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
