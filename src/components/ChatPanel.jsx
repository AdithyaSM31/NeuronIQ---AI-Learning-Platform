import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { chatWithContext } from '../services/geminiService';
import { MessageCircle, Send, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const SUGGESTIONS = [
  'Summarize the key points',
  'Explain the main concept',
  'Give me an example',
  'Compare and contrast',
  'What are the key takeaways?',
];

export default function ChatPanel({ module }) {
  const { state, dispatch } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  const chatHistory = module?.chatHistory || [];

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const sendMessage = async (text) => {
    const question = text || input.trim();
    if (!question || loading || !state.apiKey) return;

    setInput('');

    // Add user message
    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: {
        moduleId: module.id,
        message: { role: 'user', content: question, timestamp: Date.now() },
      },
    });

    setLoading(true);

    try {
      const response = await chatWithContext(
        state.apiKey,
        module.extractedText,
        question,
        chatHistory
      );

      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          moduleId: module.id,
          message: { role: 'ai', content: response, timestamp: Date.now() },
        },
      });
    } catch (err) {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          moduleId: module.id,
          message: {
            role: 'ai',
            content: `Sorry, I encountered an error: ${err.message}. Please check your API key in Settings.`,
            timestamp: Date.now(),
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (collapsed) {
    return (
      <div className="chat-panel collapsed">
        <button
          onClick={() => setCollapsed(false)}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
            color: 'var(--text-muted)',
          }}
          title="Open AI Tutor"
        >
          <MessageCircle size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <Sparkles size={18} style={{ color: 'var(--accent-violet-light)' }} />
        <span className="chat-header-title">AI Tutor</span>
        <button
          onClick={() => setCollapsed(true)}
          style={{ marginLeft: 'auto', color: 'var(--text-muted)', padding: '4px' }}
          title="Collapse panel"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Welcome or Messages */}
      {chatHistory.length === 0 ? (
        <>
          <div className="chat-welcome">
            <div className="chat-orb" />
            <h3>Have a Question?</h3>
            <p>Ask anything about your uploaded material and I'll help you understand it better.</p>
          </div>
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="chat-suggestion-chip"
                onClick={() => sendMessage(s)}
                disabled={!state.apiKey}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="chat-messages" ref={messagesRef}>
          {chatHistory.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className="chat-avatar">
                {msg.role === 'user' ? state.user.name[0]?.toUpperCase() : 'N'}
              </div>
              <div className="chat-bubble">
                {msg.role === 'ai' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message ai">
              <div className="chat-avatar">N</div>
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        {!state.apiKey && (
          <p style={{ fontSize: '0.7rem', color: 'var(--warning)', marginBottom: '8px', textAlign: 'center' }}>
            ⚠️ Set your Groq API key in Settings to use the AI Tutor
          </p>
        )}
        <div className="chat-input-wrapper">
          <input
            className="chat-input"
            type="text"
            placeholder={state.apiKey ? "Ask AI assistant..." : "API key required..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!state.apiKey || loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading || !state.apiKey}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
