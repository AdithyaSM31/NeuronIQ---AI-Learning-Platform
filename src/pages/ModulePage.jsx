import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronRight } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';
import OriginalContent from '../components/tabs/OriginalContent';
import AISummary from '../components/tabs/AISummary';
import AINotes from '../components/tabs/AINotes';
import AIFlashcards from '../components/tabs/AIFlashcards';
import AIQuizzes from '../components/tabs/AIQuizzes';

const TABS = [
  { id: 'original', label: 'Original Content' },
  { id: 'summary', label: 'AI Summary' },
  { id: 'notes', label: 'AI Notes' },
  { id: 'flashcards', label: 'AI Flashcards' },
  { id: 'quizzes', label: 'AI Quizzes' },
];

export default function ModulePage() {
  const { id } = useParams();
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('summary');

  const module = state.modules.find(m => m.id === id);

  if (!module) {
    return <Navigate to="/" replace />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'original':
        return <OriginalContent module={module} />;
      case 'summary':
        return <AISummary module={module} />;
      case 'notes':
        return <AINotes module={module} />;
      case 'flashcards':
        return <AIFlashcards module={module} />;
      case 'quizzes':
        return <AIQuizzes module={module} />;
      default:
        return null;
    }
  };

  return (
    <div className="module-page">
      <div className="module-content">
        {/* Breadcrumb */}
        <div className="module-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{module.name}</span>
        </div>

        {/* Tabs */}
        <div className="tabs-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content" key={activeTab}>
          {renderTab()}
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel module={module} />
    </div>
  );
}
