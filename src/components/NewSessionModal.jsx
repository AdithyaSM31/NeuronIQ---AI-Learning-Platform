import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { X, Upload, FileText, Presentation, Loader } from 'lucide-react';
import { parsePDF } from '../utils/pdfParser';
import { parsePPTX } from '../utils/pptxParser';

const EMOJIS = ['📚', '🧠', '🔬', '📐', '💻', '🎓', '📊', '🧪', '📖', '🌍', '⚡', '🎨', '📝', '🔮', '💡'];

export default function NewSessionModal({ onClose }) {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [sessionName, setSessionName] = useState('');
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');

  const handleFiles = useCallback(async (fileList) => {
    const validFiles = Array.from(fileList).filter(f => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ['pdf', 'ppt', 'pptx'].includes(ext);
    });
    if (validFiles.length === 0) {
      setError('Please upload PDF or PPT/PPTX files only.');
      return;
    }
    setError('');
    setFiles(prev => [...prev, ...validFiles]);
    
    if (!sessionName && validFiles.length > 0) {
      const name = validFiles[0].name.replace(/\.(pdf|pptx?)/i, '');
      setSessionName(name);
    }
  }, [sessionName]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setError('');

    try {
      const parsedFiles = [];
      let allText = '';
      let allImages = []; // Collect all images for AI vision

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.toLowerCase().split('.').pop();

        if (ext === 'pdf') {
          setProgressText(`Parsing ${file.name}...`);
          const result = await parsePDF(file, (pageNum, totalPages) => {
            const fileProgress = (i / files.length) * 80;
            const pageProgress = (pageNum / totalPages) * (80 / files.length);
            setProgress(fileProgress + pageProgress);
            setProgressText(`Rendering ${file.name} — page ${pageNum} of ${totalPages}`);
          });
          
          parsedFiles.push({
            name: file.name,
            type: 'pdf',
            pages: result.pages,
          });
          allText += result.fullText + '\n\n';
          
          // Collect page images for AI
          result.pages.forEach(p => {
            if (p.imageDataUrl) allImages.push(p.imageDataUrl);
          });
        } else {
          setProgressText(`Extracting ${file.name}...`);
          setProgress(((i) / files.length) * 80);
          
          const result = await parsePPTX(file);
          parsedFiles.push({
            name: file.name,
            type: 'pptx',
            slides: result.slides,
          });
          allText += result.fullText + '\n\n';
          
          // Collect PPTX images for AI
          allImages = allImages.concat(result.allImages || []);
        }
      }

      setProgress(90);
      setProgressText('Creating session...');

      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const moduleName = sessionName.trim() || files[0].name.replace(/\.(pdf|pptx?)/i, '');

      dispatch({
        type: 'CREATE_MODULE',
        payload: {
          name: moduleName,
          files: parsedFiles,
          extractedText: allText.trim(),
          // Store up to 8 images for vision AI (to avoid localStorage limits)
          images: allImages.slice(0, 8),
          emoji,
        },
      });

      setProgress(100);
      setProgressText('Done!');

      setTimeout(() => {
        const stateStr = localStorage.getItem('neuroniq_state');
        if (stateStr) {
          const state = JSON.parse(stateStr);
          if (state.modules?.length > 0) {
            navigate(`/module/${state.modules[0].id}`);
          }
        }
        onClose();
      }, 300);
    } catch (err) {
      console.error('Parse error:', err);
      setError(`Error processing files: ${err.message}`);
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal new-session-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h2 className="modal-title">New Study Session</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-field">
          <label className="modal-label">Session Name</label>
          <input
            className="session-name-input"
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="e.g., BIOL304: Plant Biology"
            style={{ width: '100%' }}
          />
        </div>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ppt,.pptx"
            multiple
            onChange={e => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">
            <Upload size={28} />
          </div>
          <div className="upload-title">Drop your files here</div>
          <div className="upload-subtitle">or click to browse — images will be extracted too</div>
          <div className="upload-formats">
            <span className="format-badge">PDF</span>
            <span className="format-badge">PPT</span>
            <span className="format-badge">PPTX</span>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {file.name.toLowerCase().endsWith('.pdf') ?
                  <FileText size={16} style={{ color: 'var(--error)', flexShrink: 0 }} /> :
                  <Presentation size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                }
                <span style={{ flex: 1, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                {!processing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    style={{ color: 'var(--text-muted)', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {processing && (
          <div className="upload-progress" style={{ marginTop: '16px', maxWidth: '100%' }}>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="upload-progress-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
              {progressText || `Processing... ${Math.round(progress)}%`}
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '12px' }}>
            {error}
          </p>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={files.length === 0 || processing}
          >
            {processing ? 'Processing...' : `Create Session (${files.length} file${files.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  );
}
