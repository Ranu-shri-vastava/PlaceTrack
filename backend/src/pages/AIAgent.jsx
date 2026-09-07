import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, RefreshCw, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAPI } from '../utils/api';

const SUGGESTIONS = [
  'What is the placement rate?',
  'Show upcoming interviews',
  'Top recruiting companies',
  'Show average package',
  'Show unplaced students',
  'Placement summary',
  'How to add a student?',
  'Show placement analytics',
];

const WELCOME = {
  id: 'welcome',
  role: 'agent',
  text: `👋 Namaste! Main hoon aapka **AI Placement Agent**.\n\nMujhse pooch sakte ho:\n• Placement rate & statistics\n• Package information\n• Upcoming interviews\n• Top companies\n• Unplaced students\n• Navigation help\n\nType **"help"** for all features, ya neeche se koi suggestion choose karo! 🎓`,
  time: new Date(),
};

function formatText(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Message({ msg }) {
  const isAgent = msg.role === 'agent';
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      flexDirection: isAgent ? 'row' : 'row-reverse',
      marginBottom: 4,
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isAgent ? '#6366f1' : '#e0e7ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isAgent
          ? <Bot size={16} color="white" />
          : <User size={16} color="#6366f1" />
        }
      </div>
      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        background: isAgent ? 'white' : '#6366f1',
        color: isAgent ? '#1e293b' : 'white',
        border: isAgent ? '1px solid #e2e8f0' : 'none',
        borderRadius: isAgent ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
        padding: '10px 14px',
        fontSize: 13.5,
        lineHeight: 1.7,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        whiteSpace: 'pre-wrap',
      }}>
        {formatText(msg.text)}
        <div style={{
          fontSize: 10,
          color: isAgent ? '#94a3b8' : 'rgba(255,255,255,0.6)',
          marginTop: 6,
          textAlign: 'right',
        }}>
          {new Date(msg.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export default function AIAgent() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg = { id: Date.now(), role: 'user', text: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: msg });
      const agentMsg = {
        id: Date.now() + 1,
        role: 'agent',
        text: res.data.response,
        time: new Date(),
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch (e) {
      toast.error('Agent unavailable. Check if backend is running.');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'agent',
        text: '⚠️ Sorry, I could not connect to the server. Please make sure the backend is running on port 5000.',
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#6366f1', borderRadius: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} color="white" />
          </div>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              AI Placement Agent
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Online
              </span>
            </h2>
            <p>Ask anything about placements, students, companies, or interviews</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={clearChat}>
          <RefreshCw size={14} /> Clear Chat
        </button>
      </div>

      {/* Chat window */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px 12px 12px 12px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              style={{
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: 20, padding: '5px 12px', fontSize: 12,
                cursor: 'pointer', color: '#475569', fontFamily: 'inherit',
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.target.style.background = '#e0e7ff'; e.target.style.color = '#6366f1'; e.target.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.target.style.background = '#f1f5f9'; e.target.style.color = '#475569'; e.target.style.borderColor = '#e2e8f0'; }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center', background: '#fafbff' }}>
          <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, transition: 'border .15s' }}
            onFocus={() => {}} >
            <Sparkles size={15} color="#6366f1" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about placements..."
              disabled={loading}
              style={{
                flex: 1, border: 'none', outline: 'none', padding: '10px 0',
                fontSize: 13.5, fontFamily: 'inherit', background: 'transparent', color: '#1e293b',
              }}
            />
          </div>
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ borderRadius: 10, padding: '10px 16px', flexShrink: 0 }}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
