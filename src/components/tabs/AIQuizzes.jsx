import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateQuiz } from '../../services/geminiService';
import { HelpCircle, RefreshCw, ArrowRight, RotateCcw, Trophy } from 'lucide-react';

export default function AIQuizzes({ module }) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const quiz = module.quiz;

  const handleGenerate = async () => {
    if (!state.apiKey) {
      setError('Please set your Groq API key in Settings first.');
      return;
    }
    if (!module.extractedText) {
      setError('No text content to create a quiz from.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await generateQuiz(state.apiKey, module.extractedText);
      dispatch({
        type: 'UPDATE_MODULE',
        payload: { id: module.id, updates: { quiz: result } },
      });
      resetQuiz();
    } catch (err) {
      setError(`Failed to generate quiz: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setAnsweredCount(0);
    setShowResults(false);
  };

  const handleSelect = (index) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    setAnsweredCount(prev => prev + 1);
    if (index === quiz[currentQ].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= quiz.length) {
      setShowResults(true);
    } else {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const LETTERS = ['A', 'B', 'C', 'D'];

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-text">Generating AI quiz questions...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="generate-prompt animate-fade-in-up">
        <div className="empty-state-icon" style={{ margin: '0 auto 24px' }}>
          <HelpCircle size={36} />
        </div>
        <h3>Generate AI Quiz</h3>
        <p>Test your understanding with AI-generated multiple choice questions.</p>
        {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleGenerate}>
          <HelpCircle size={16} /> Generate Quiz
        </button>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / quiz.length) * 100);
    const getMessage = () => {
      if (percentage === 100) return "🎉 Perfect Score! Outstanding!";
      if (percentage >= 80) return "🌟 Excellent work! You really know this material!";
      if (percentage >= 60) return "👍 Good effort! Keep studying to improve.";
      if (percentage >= 40) return "📚 Not bad! Review the material and try again.";
      return "💪 Keep going! More practice will help.";
    };

    return (
      <div className="quiz-results animate-fade-in-up">
        <div className="quiz-score-circle">
          <span className="quiz-score-number">{percentage}%</span>
          <span className="quiz-score-label">Score</span>
        </div>
        <h2 style={{ fontSize: 'var(--font-2xl)', marginBottom: '8px' }}>Quiz Complete!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-lg)', marginBottom: '8px' }}>
          {getMessage()}
        </p>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>
          You got <strong style={{ color: 'var(--text-primary)' }}>{score}</strong> out of <strong style={{ color: 'var(--text-primary)' }}>{quiz.length}</strong> questions correct
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={resetQuiz}>
            <RotateCcw size={16} /> Retry Quiz
          </button>
          <button className="btn btn-primary" onClick={handleGenerate}>
            <RefreshCw size={16} /> New Quiz
          </button>
        </div>
      </div>
    );
  }

  const question = quiz[currentQ];

  return (
    <div className="quiz-container">
      {/* Progress */}
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{ width: `${((currentQ + (answered ? 1 : 0)) / quiz.length) * 100}%` }}
          />
        </div>
        <div className="quiz-progress-text">
          {currentQ + 1} / {quiz.length}
        </div>
      </div>

      {/* Question */}
      <div className="quiz-question">
        <div className="quiz-question-label">Question {currentQ + 1}</div>
        <div className="quiz-question-text">{question.question}</div>
      </div>

      {/* Options */}
      <div className="quiz-options">
        {question.options.map((option, i) => {
          let className = 'quiz-option';
          if (answered) {
            className += ' disabled';
            if (i === question.correctIndex) className += ' correct';
            else if (i === selectedAnswer && i !== question.correctIndex) className += ' incorrect';
          } else if (selectedAnswer === i) {
            className += ' selected';
          }

          return (
            <button
              key={i}
              className={className}
              onClick={() => handleSelect(i)}
              disabled={answered}
            >
              <span className="quiz-option-letter">{LETTERS[i]}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && question.explanation && (
        <div className="quiz-explanation">
          <div className="quiz-explanation-title">
            {selectedAnswer === question.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
          </div>
          <p>{question.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {answered && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleNext}>
            {currentQ + 1 >= quiz.length ? (
              <><Trophy size={16} /> See Results</>
            ) : (
              <><ArrowRight size={16} /> Next Question</>
            )}
          </button>
        </div>
      )}

      {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '16px' }}>{error}</p>}
    </div>
  );
}
