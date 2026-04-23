import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateSummary, collectModuleImages } from '../../services/geminiService';
import { Sparkles, Download, Type, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AISummary({ module }) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(state.settings.fontSize);
  const [progressMsg, setProgressMsg] = useState('');

  const handleGenerate = async () => {
    if (!state.apiKey) {
      setError('Please set your Groq API key in Settings first.');
      return;
    }
    if (!module.extractedText) {
      setError('No text content to summarize.');
      return;
    }

    setLoading(true);
    setError('');
    setProgressMsg('Preparing content...');

    try {
      // Collect ALL images from the module: page renders + embedded images
      const allImages = collectModuleImages(module);
      console.log(`Found ${allImages.length} images to analyze`);

      const summary = await generateSummary(
        state.apiKey,
        module.extractedText,
        allImages,
        (msg) => setProgressMsg(msg)
      );
      dispatch({
        type: 'UPDATE_MODULE',
        payload: { id: module.id, updates: { summary } },
      });
    } catch (err) {
      setError(`Failed to generate summary: ${err.message}`);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!module.summary) return;
    const blob = new Blob([module.summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.name}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">{progressMsg || 'Generating detailed AI summary...'}</div>
        <div style={{ maxWidth: '400px', width: '100%', marginTop: '16px' }}>
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

  if (!module.summary) {
    const imageCount = collectModuleImages(module).length;
    return (
      <div className="generate-prompt animate-fade-in-up">
        <div className="empty-state-icon" style={{ margin: '0 auto 24px' }}>
          <Sparkles size={36} />
        </div>
        <h3>Generate AI Summary</h3>
        <p>Create a comprehensive, exam-ready summary of your uploaded material using AI.</p>
        {imageCount > 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-cyan-light)', marginBottom: '12px' }}>
            🖼️ {imageCount} image{imageCount !== 1 ? 's' : ''} detected — visual content will be analyzed too
          </p>
        )}
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleGenerate}>
          <Sparkles size={16} /> Generate Summary
        </button>
      </div>
    );
  }

  return (
    <div className="ai-content-area animate-fade-in-up">
      {/* Header */}
      <div className="ai-content-header">
        <h2 className="ai-content-title">AI Summary</h2>
        <div className="ai-content-controls">
          <div className="font-size-slider">
            <Type size={14} />
            <input
              type="range"
              min="12"
              max="22"
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
            />
            <Type size={18} />
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleGenerate} title="Regenerate">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={handleDownload} title="Download">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* File badges */}
      <div className="file-badges">
        {module.files?.map((file, i) => (
          <span key={i} className="file-badge">{file.name}</span>
        ))}
      </div>

      {/* Content */}
      <div className="ai-content-body" style={{ fontSize: `${fontSize}px` }}>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{module.summary}</ReactMarkdown>
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '16px' }}>{error}</p>}
    </div>
  );
}
