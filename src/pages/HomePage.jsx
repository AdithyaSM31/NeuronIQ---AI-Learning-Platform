import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, MoreVertical, Trash2, BookOpen,
  Pencil, FolderPlus, Folder, X, ChevronRight, ChevronDown
} from 'lucide-react';
import NewSessionModal from '../components/NewSessionModal';

export default function HomePage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastAccessed');
  const [showNewSession, setShowNewSession] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { id, x, y }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [renaming, setRenaming] = useState(null); // module id
  const [renameValue, setRenameValue] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const renameRef = useRef(null);

  useEffect(() => {
    if (renaming && renameRef.current) renameRef.current.focus();
  }, [renaming]);

  let modules = [...state.modules];

  // Filter
  if (search.trim()) {
    const q = search.toLowerCase();
    modules = modules.filter(m => m.name.toLowerCase().includes(q) || (m.folder || '').toLowerCase().includes(q));
  }

  // Sort
  modules.sort((a, b) => {
    if (sortBy === 'lastAccessed') return new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  // Group by folder — include both folders from state and folders with modules
  const folders = {};
  const ungrouped = [];
  // Initialize from persisted folders
  (state.folders || []).forEach(f => { folders[f] = []; });
  modules.forEach(m => {
    if (m.folder) {
      if (!folders[m.folder]) folders[m.folder] = [];
      folders[m.folder].push(m);
    } else {
      ungrouped.push(m);
    }
  });
  const folderNames = Object.keys(folders).sort();

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_MODULE', payload: id });
    setDeleteConfirm(null);
    setContextMenu(null);
  };

  const handleRename = (id) => {
    if (renameValue.trim()) {
      dispatch({ type: 'UPDATE_MODULE', payload: { id, updates: { name: renameValue.trim() } } });
    }
    setRenaming(null);
  };

  const handleContextMenu = (e, moduleId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ id: moduleId, x: rect.right - 160, y: rect.bottom + 4 });
  };

  const handleMoveToFolder = (moduleId, folder) => {
    dispatch({ type: 'UPDATE_MODULE', payload: { id: moduleId, updates: { folder: folder || null } } });
    setContextMenu(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      dispatch({ type: 'CREATE_FOLDER', payload: newFolderName.trim() });
      setShowNewFolder(false);
      setNewFolderName('');
    }
  };

  const toggleFolder = (name) => {
    setCollapsedFolders(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const renderModuleRow = (m, index) => (
    <div
      key={m.id}
      className="module-row"
      style={{ animationDelay: `${index * 0.04}s`, animation: 'fadeInUp 0.3s ease-out both', position: 'relative' }}
      onClick={() => navigate(`/module/${m.id}`)}
    >
      <div className="module-emoji">{m.emoji}</div>

      {renaming === m.id ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleRename(m.id); }}
          onClick={e => e.stopPropagation()}
          style={{ flex: 1 }}
        >
          <input
            ref={renameRef}
            className="rename-input"
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={() => handleRename(m.id)}
            onKeyDown={e => { if (e.key === 'Escape') setRenaming(null); }}
          />
        </form>
      ) : (
        <div className="module-name">{m.name}</div>
      )}

      <div className="module-type">
        {m.files?.length || 0} file{(m.files?.length || 0) !== 1 ? 's' : ''}
      </div>
      <div className="module-date">{formatDate(m.lastAccessedAt)}</div>
      <div className="module-status">{m.summary ? '✓ Generated' : '—'}</div>

      <button className="module-more" onClick={(e) => handleContextMenu(e, m.id)}>
        <MoreVertical size={16} />
      </button>
    </div>
  );

  return (
    <div className="app-content home-page">
      {/* Greeting */}
      <div className="home-header">
        <h1 className="home-greeting">
          Hello, <span>{state.user.name}</span>! 👋
        </h1>
        <p className="home-subtitle">Ready to learn something new today?</p>
      </div>

      {/* Controls */}
      <div className="home-controls">
        <div className="search-bar">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by title or folder..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="lastAccessed">Last accessed</option>
          <option value="name">Name</option>
          <option value="created">Date created</option>
        </select>
        <div className="home-actions">
          <button className="btn btn-secondary" onClick={() => setShowNewFolder(true)}>
            <FolderPlus size={16} /> New Folder
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewSession(true)}>
            <Plus size={16} /> New Session
          </button>
        </div>
      </div>

      {/* Modules List */}
      {modules.length > 0 ? (
        <div className="modules-list">
          {/* Folders */}
          {folderNames.map(folderName => (
            <div key={folderName} className="folder-group">
              <button className="folder-header" onClick={() => toggleFolder(folderName)}>
                {collapsedFolders[folderName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <Folder size={16} style={{ color: 'var(--accent-cyan-light)' }} />
                <span className="folder-name">{folderName}</span>
                <span className="folder-count">{folders[folderName].length}</span>
              </button>
              {!collapsedFolders[folderName] && (
                <div className="modules-grid">
                  {folders[folderName].map((m, i) => renderModuleRow(m, i))}
                </div>
              )}
            </div>
          ))}

          {/* Ungrouped modules */}
          {ungrouped.length > 0 && (
            <div className="modules-grid">
              {ungrouped.map((m, i) => renderModuleRow(m, i))}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={36} />
          </div>
          <h3>No study sessions yet</h3>
          <p>Upload your PDFs or PowerPoint files to get started with AI-powered learning.</p>
          <button className="btn btn-primary" onClick={() => setShowNewSession(true)}>
            <Plus size={16} /> Create Your First Session
          </button>
        </div>
      )}

      {/* Context Menu (fixed positioned) */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1040 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x, position: 'fixed', zIndex: 1050 }}
          >
            <button
              className="context-menu-item"
              onClick={() => {
                const mod = state.modules.find(m => m.id === contextMenu.id);
                setRenameValue(mod?.name || '');
                setRenaming(contextMenu.id);
                setContextMenu(null);
              }}
            >
              <Pencil size={14} /> Rename
            </button>

            {/* Move to folder submenu */}
            {folderNames.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
                <div style={{ padding: '4px 12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Move to folder
                </div>
                {folderNames.map(f => {
                  const mod = state.modules.find(m => m.id === contextMenu.id);
                  return (
                    <button
                      key={f}
                      className={`context-menu-item ${mod?.folder === f ? 'active' : ''}`}
                      onClick={() => handleMoveToFolder(contextMenu.id, mod?.folder === f ? null : f)}
                    >
                      <Folder size={14} /> {f} {mod?.folder === f ? '✓' : ''}
                    </button>
                  );
                })}
                {state.modules.find(m => m.id === contextMenu.id)?.folder && (
                  <button
                    className="context-menu-item"
                    onClick={() => handleMoveToFolder(contextMenu.id, null)}
                  >
                    <X size={14} /> Remove from folder
                  </button>
                )}
              </>
            )}

            <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
            <button
              className="context-menu-item danger"
              onClick={() => {
                setDeleteConfirm(contextMenu.id);
                setContextMenu(null);
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Session?</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              This will permanently delete this study session and all generated content. This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="delete-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Folder</h2>
              <button className="modal-close" onClick={() => setShowNewFolder(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-field">
              <label className="modal-label">Folder Name</label>
              <input
                type="text"
                style={{ width: '100%' }}
                placeholder="e.g., Semester 4, Computer Networks..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
                autoFocus
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              After creating a folder, use the ⋮ menu on any module to move it into this folder.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewFolder(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                <FolderPlus size={14} /> Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSession && (
        <NewSessionModal onClose={() => setShowNewSession(false)} />
      )}
    </div>
  );
}
