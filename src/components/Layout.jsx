import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BookOpen, PanelLeftClose, PanelLeft, Plus, Library, FolderOpen,
  Clock, Settings, FileText, Presentation
} from 'lucide-react';
import SettingsModal from './SettingsModal';
import NewSessionModal from './NewSessionModal';

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const collapsed = state.settings.sidebarCollapsed;

  const recentModules = [...state.modules]
    .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
    .slice(0, 5);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="NeuronIQ" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-brand">NeuronIQ</span>}
          <button
            className="sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className="sidebar-body">
          <button
            className="sidebar-new-btn"
            onClick={() => setShowNewSession(true)}
          >
            <Plus size={18} />
            {!collapsed && 'New Study Session'}
          </button>

          {!collapsed && (
            <>
              <div className="sidebar-section-title">Library</div>
              <Link
                to="/"
                className={`sidebar-nav-item ${location.pathname === '/' ? 'active' : ''}`}
              >
                <Library size={18} />
                My Library
              </Link>

              {recentModules.length > 0 && (
                <>
                  <div className="sidebar-section-title">Recent</div>
                  {recentModules.map(m => (
                    <Link
                      key={m.id}
                      to={`/module/${m.id}`}
                      className="sidebar-recent-item"
                    >
                      {m.files?.[0]?.type === 'pdf' ? 
                        <FileText size={14} /> : 
                        <Presentation size={14} />
                      }
                      {m.name}
                    </Link>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button
            className="sidebar-settings-btn"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={18} />
            {!collapsed && 'Settings'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showNewSession && (
        <NewSessionModal onClose={() => setShowNewSession(false)} />
      )}
    </div>
  );
}
