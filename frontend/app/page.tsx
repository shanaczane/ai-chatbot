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
    <div className="flex flex-col h-screen bg-navy">
      {/* Scanlines overlay */}
      <div id="scanlines" />

      {/* ── Header — full width ── */}
      <header className="shrink-0 flex items-center justify-between px-8 py-5 bg-deep border-b border-blue">
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

      {/* ── Centered column — messages + input share the same max-w-3xl container ── */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full overflow-hidden">

        {/* Messages — scrollable */}
        <div className="flex-1 overflow-y-auto w-full px-6 py-6 space-y-4">

          {initializing && (
            <p className="text-center mt-10 font-terminal text-sky text-xl tracking-widest animate-pulse">
              INITIALIZING SESSION...
            </p>
          )}

          {!initializing && messages.length === 0 && (
            <div className="text-center mt-24 space-y-3">
              <p className="font-terminal text-sky text-2xl tracking-widest">
                READY FOR INPUT
              </p>
              <p className="font-body text-sm" style={{ color: 'rgba(232,244,255,0.35)' }}>
                Type a message below to begin your session.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Role label */}
              <span className="font-terminal text-sky text-base tracking-wider px-0.5">
                {msg.role === 'user' ? '> YOU' : '// ASSISTANT'}
              </span>

              {/* Escalation alert */}
              {msg.escalated ? (
                <div
                  className="rounded-lg px-4 py-3 max-w-sm space-y-1.5"
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
                  className={`rounded-lg px-4 py-3 max-w-sm bg-deep border transition-all duration-200
                    ${msg.role === 'user' ? 'border-sky' : 'border-blue'}`}
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
              <span className="font-terminal text-sky text-base tracking-wider px-0.5">
                // ASSISTANT
              </span>
              <div className="rounded-lg px-5 py-3 bg-deep border border-blue">
                <span className="font-terminal text-cyan text-xl animate-pulse">
                  THINKING_
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input — pinned to bottom of centered column */}
        <div className="shrink-0 border-t border-blue px-6 pt-3 pb-4">
          <div className="flex gap-3">

            {/* Text input */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none font-terminal text-cyan text-lg leading-none">
                &gt;
              </span>
              <input
                suppressHydrationWarning
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                placeholder="TYPE YOUR MESSAGE..."
                className="w-full rounded py-3 pl-8 pr-4 font-terminal text-lg text-white
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

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className="font-terminal text-lg rounded px-6 py-3 transition-all duration-200
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
              SEND
            </button>
          </div>

          {/* Session ID */}
          {conversationId && (
            <p
              className="text-center mt-1.5 font-terminal text-xs tracking-widest"
              style={{ color: 'rgba(56,180,255,0.3)' }}
            >
              SESSION_ID: {conversationId.slice(0, 8).toUpperCase()}...
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
