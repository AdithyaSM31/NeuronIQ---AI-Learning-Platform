import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  BookOpen, PanelLeftClose, PanelLeft, Plus, Library, FolderOpen,
  Clock, Settings, FileText, Presentation, Menu, X
} from 'lucide-react';
import SettingsModal from './SettingsModal';
import NewSessionModal from './NewSessionModal';
import { BackgroundBeams } from './BackgroundBeams';

export default function Layout({ children }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const collapsed = state.settings.sidebarCollapsed && !mobileMenuOpen;

  const recentModules = [...state.modules]
    .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
    .slice(0, 5);

  const handleMobileNav = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="app-layout">
      <BackgroundBeams style={{ opacity: 0.4 }} />
      
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-brand">
          <img src="/logo.png" alt="NeuronIQ" className="mobile-logo" />
          <span>NeuronIQ</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="NeuronIQ" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-brand">NeuronIQ</span>}
          <button
            className="sidebar-toggle"
            onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : dispatch({ type: 'TOGGLE_SIDEBAR' })}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {mobileMenuOpen ? <X size={18} /> : (collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />)}
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
