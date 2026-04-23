import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateFlashcards } from '../../services/geminiService';
import {
  Layers, ChevronLeft, ChevronRight, RotateCcw, Shuffle, RefreshCw
} from 'lucide-react';

export default function AIFlashcards({ module }) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [cards, setCards] = useState(null);

  const flashcards = cards || module.flashcards;

  const handleGenerate = async () => {
    if (!state.apiKey) {
      setError('Please set your Groq API key in Settings first.');
      return;
    }
    if (!module.extractedText) {
      setError('No text content to create flashcards from.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await generateFlashcards(state.apiKey, module.extractedText);
      dispatch({
        type: 'UPDATE_MODULE',
        payload: { id: module.id, updates: { flashcards: result } },
      });
      setCards(null);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(`Failed to generate flashcards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goTo = (index) => {
    setFlipped(false);
    setTimeout(() => setCurrentIndex(index), 100);
  };

  const handleShuffle = () => {
    const src = module.flashcards;
    if (!src) return;
    const shuffledCards = [...src].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setShuffled(true);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleReset = () => {
    setCards(null);
    setShuffled(false);
    setCurrentIndex(0);
    setFlipped(false);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">Creating AI flashcards...</div>
      </div>
    );
  }

  if (!flashcards) {
    return (
      <div className="generate-prompt animate-fade-in-up">
        <div className="empty-state-icon" style={{ margin: '0 auto 24px' }}>
          <Layers size={36} />
        </div>
        <h3>Generate AI Flashcards</h3>
        <p>Create interactive flashcards to test your knowledge with spaced repetition.</p>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleGenerate}>
          <Layers size={16} /> Generate Flashcards
        </button>
      </div>
    );
  }

  const card = flashcards[currentIndex];

  return (
    <div className="flashcards-container animate-fade-in-up">
      {/* Action bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={handleShuffle}
          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
        >
          <Shuffle size={14} /> Shuffle
        </button>
        {shuffled && (
          <button
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ fontSize: '0.8rem' }}
          >
            <RotateCcw size={14} /> Reset Order
          </button>
        )}
        <button
          className="btn btn-ghost"
          onClick={handleGenerate}
          style={{ fontSize: '0.8rem', marginLeft: 'auto' }}
        >
          <RefreshCw size={14} /> Regenerate
        </button>
      </div>

      {/* Card */}
      <div className="flashcard-wrapper" onClick={() => setFlipped(!flipped)}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <span className="flashcard-label">Question</span>
            <div className="flashcard-text">{card?.front}</div>
            <span className="flashcard-hint">Click to reveal answer</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="flashcard-label">Answer</span>
            <div className="flashcard-text">{card?.back}</div>
            <span className="flashcard-hint">Click to see question</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flashcard-controls">
        <button
          className="flashcard-nav-btn"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flashcard-counter">
          {currentIndex + 1} / {flashcards.length}
        </span>
        <button
          className="flashcard-nav-btn"
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {flashcards.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: i === currentIndex ? 'var(--accent-violet)' : 'var(--bg-elevated)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
    </div>
  );
}
