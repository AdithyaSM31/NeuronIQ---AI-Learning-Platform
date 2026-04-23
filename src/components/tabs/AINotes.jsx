import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateNotes, collectModuleImages } from '../../services/geminiService';
import { FileText, Download, Copy, RefreshCw, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AINotes({ module }) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const handleGenerate = async () => {
    if (!state.apiKey) {
      setError('Please set your Groq API key in Settings first.');
      return;
    }
    if (!module.extractedText) {
      setError('No text content to create notes from.');
      return;
    }

    setLoading(true);
    setError('');
    setProgressMsg('Preparing content...');

    try {
      // Collect ALL images from the module
      const allImages = collectModuleImages(module);
      console.log(`Found ${allImages.length} images to analyze for notes`);

      const notes = await generateNotes(
        state.apiKey,
        module.extractedText,
        allImages,
        (msg) => setProgressMsg(msg)
      );
      dispatch({
        type: 'UPDATE_MODULE',
        payload: { id: module.id, updates: { notes } },
      });
    } catch (err) {
      setError(`Failed to generate notes: ${err.message}`);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleCopy = async () => {
    if (!module.notes) return;
    try {
      await navigator.clipboard.writeText(module.notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    if (!module.notes) return;
    const blob = new Blob([module.notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.name}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">{progressMsg || 'Creating comprehensive study notes...'}</div>
        <div style={{ maxWidth: '400px', width: '100%', marginTop: '16px' }}>
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line long" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line long" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line medium" />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '16px' }}>
          {collectModuleImages(module).length > 0
            ? '🖼️ Analyzing text + visual content (diagrams, charts, images)...'
            : '📄 Analyzing text content...'}
        </p>
      </div>
    );
  }

  if (!module.notes) {
    const imageCount = collectModuleImages(module).length;
    return (
      <div className="generate-prompt animate-fade-in-up">
        <div className="empty-state-icon" style={{ margin: '0 auto 24px' }}>
          <FileText size={36} />
        </div>
        <h3>Generate AI Notes</h3>
        <p>Create well-organized, exam-ready study notes from your material using AI.</p>
        {imageCount > 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan-light)', marginBottom: '12px' }}>
            🖼️ {imageCount} image{imageCount !== 1 ? 's' : ''} detected — visual content will be analyzed too
          </p>
        )}
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleGenerate}>
          <FileText size={16} /> Generate Notes
        </button>
      </div>
    );
  }

  return (
    <div className="ai-content-area animate-fade-in-up">
      <div className="ai-content-header">
        <h2 className="ai-content-title">AI Notes</h2>
        <div className="ai-content-controls">
          <button className="btn btn-ghost btn-icon" onClick={handleCopy} title="Copy notes">
            {copied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={handleGenerate} title="Regenerate">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={handleDownload} title="Download">
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="file-badges">
        {module.files?.map((file, i) => (
          <span key={i} className="file-badge">{file.name}</span>
        ))}
      </div>

      <div className="ai-content-body">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{module.notes}</ReactMarkdown>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '16px' }}>{error}</p>}
    </div>
  );
}
