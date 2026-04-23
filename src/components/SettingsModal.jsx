import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Eye, EyeOff, Key, User, Check, Loader } from 'lucide-react';
import { testApiKey } from '../services/geminiService';

export default function SettingsModal({ onClose }) {
  const { state, dispatch } = useApp();
  const [apiKey, setApiKey] = useState(state.apiKey);
  const [userName, setUserName] = useState(state.user.name);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    const valid = await testApiKey(apiKey.trim());
    setTestResult(valid ? 'valid' : 'invalid');
    setTesting(false);
  };

  const handleSave = () => {
    dispatch({ type: 'SET_API_KEY', payload: apiKey.trim() });
    dispatch({ type: 'SET_USER_NAME', payload: userName.trim() || 'Learner' });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-field">
          <label className="modal-label">
            <User size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
            Your Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Enter your name"
            style={{ width: '100%' }}
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">
            <Key size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
            Groq API Key
          </label>
          <div className="modal-input-wrapper">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setTestResult(null); }}
              placeholder="gsk_..."
            />
            <button className="modal-input-toggle" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleTestKey}
              disabled={testing || !apiKey.trim()}
              style={{ fontSize: '0.75rem', padding: '4px 12px' }}
            >
              {testing ? <Loader size={14} className="spin" /> : 'Test Key'}
            </button>
            {testResult === 'valid' && (
              <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Valid
              </span>
            )}
            {testResult === 'invalid' && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>
                ✗ Invalid key
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Get your free API key from{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
              Groq Console
            </a>
            {' '}— Powered by Llama 3.3 70B
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
