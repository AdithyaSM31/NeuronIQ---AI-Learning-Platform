import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

const STORAGE_KEY = 'neuroniq_state';

const initialState = {
  user: { name: 'Learner' },
  apiKey: '',
  modules: [],
  folders: [], // user-created folder names
  settings: {
    fontSize: 16,
    sidebarCollapsed: false,
  },
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return initialState;
}

function saveState(state) {
  try {
    // Strip large binary data (images, page renders) before saving
    // These are kept in memory but too large for localStorage (~5MB limit)
    const stateToSave = {
      ...state,
      modules: state.modules.map(m => ({
        ...m,
        images: [], // Don't persist images array
        files: m.files?.map(f => ({
          ...f,
          pages: f.pages?.map(p => ({ ...p, imageDataUrl: null })),
          slides: f.slides?.map(s => ({ ...s, images: [] })),
        })),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };

    case 'SET_USER_NAME':
      return { ...state, user: { ...state.user, name: action.payload } };

    case 'CREATE_MODULE': {
      const newModule = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: action.payload.name,
        files: action.payload.files || [],
        extractedText: action.payload.extractedText || '',
        images: action.payload.images || [],
        summary: null,
        notes: null,
        flashcards: null,
        quiz: null,
        chatHistory: [],
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        emoji: action.payload.emoji || '📚',
      };
      return { ...state, modules: [newModule, ...state.modules] };
    }

    case 'UPDATE_MODULE': {
      const modules = state.modules.map(m =>
        m.id === action.payload.id
          ? { ...m, ...action.payload.updates, lastAccessedAt: new Date().toISOString() }
          : m
      );
      return { ...state, modules };
    }

    case 'DELETE_MODULE':
      return { ...state, modules: state.modules.filter(m => m.id !== action.payload) };

    case 'CREATE_FOLDER':
      if (state.folders.includes(action.payload)) return state;
      return { ...state, folders: [...state.folders, action.payload] };

    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter(f => f !== action.payload),
        modules: state.modules.map(m => m.folder === action.payload ? { ...m, folder: null } : m),
      };

    case 'ADD_CHAT_MESSAGE': {
      const modules = state.modules.map(m =>
        m.id === action.payload.moduleId
          ? { ...m, chatHistory: [...m.chatHistory, action.payload.message] }
          : m
      );
      return { ...state, modules };
    }

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        settings: { ...state.settings, sidebarCollapsed: !state.settings.sidebarCollapsed },
      };

    case 'SET_FONT_SIZE':
      return {
        ...state,
        settings: { ...state.settings, fontSize: action.payload },
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export default AppContext;
