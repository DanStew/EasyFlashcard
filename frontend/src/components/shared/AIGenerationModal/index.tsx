// ==========================================
// AIGenerationModal - Presentation Component
// ==========================================

import { useState, type FormEvent } from 'react';
import { FileText, FileUp, Info, MessageSquarePlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { TextArea } from '@/components/shared/TextArea';
import type { AIGenerationConfig, AIGenerationMode, AIGenerationModalProps } from './types';
import { CARD_COUNT_OPTIONS, DIFFICULTY_OPTIONS, GENERATION_MODES } from './utils';
import './style.scss';

export function AIGenerationModal({
  isOpen,
  initialMode = 'prompt',
  initialDocumentName = null,
  onClose,
  onGenerate,
}: AIGenerationModalProps) {
  const [mode, setMode] = useState<AIGenerationMode>(initialMode);
  const [topic, setTopic] = useState('');
  const [notesText, setNotesText] = useState('');
  const [cardCount, setCardCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const config: AIGenerationConfig = {
      mode,
      topic: topic.trim(),
      notesText: notesText.trim(),
      cardCount,
      difficulty,
    };
    onGenerate(config);
    onClose();
  };

  const renderModeIcon = (m: AIGenerationMode) => {
    switch (m) {
      case 'prompt':
        return <MessageSquarePlus size={15} />;
      case 'text':
        return <FileText size={15} />;
      case 'document':
        return <FileUp size={15} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Flashcards with AI"
      subtitle="Synthesize high-yield study flashcards automatically"
      size="lg"
    >
      <div className="ai-gen-modal">
        {/* Mode Tabs */}
        <div className="ai-gen-modal__modes-bar">
          {GENERATION_MODES.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ai-gen-modal__mode-btn ${
                mode === tab.id ? 'ai-gen-modal__mode-btn--active' : ''
              }`}
              onClick={() => setMode(tab.id)}
            >
              {renderModeIcon(tab.id)}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="ai-gen-modal__form">
          {mode === 'prompt' && (
            <div className="ai-gen-modal__field-group">
              <Input
                label="Study Topic / Subject Area"
                placeholder="e.g. Krebs Cycle & Cellular Respiration, Constitutional Law, React Hooks"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                autoFocus
                required
                fullWidth
              />
            </div>
          )}

          {mode === 'text' && (
            <div className="ai-gen-modal__field-group">
              <TextArea
                label="Paste Study Notes / Transcript"
                placeholder="Paste lecture transcript, textbook summary, or raw markdown notes here..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={6}
                required
                fullWidth
              />
            </div>
          )}

          {mode === 'document' && (
            <div className="ai-gen-modal__field-group">
              <label className="ai-gen-modal__field-label">Selected Source Document</label>
              <Input
                value={initialDocumentName || 'No document pre-selected (Will use current folder notes)'}
                disabled
                fullWidth
              />
            </div>
          )}

          {/* Flashcard Count Selector */}
          <div className="ai-gen-modal__field-group">
            <label className="ai-gen-modal__field-label">Flashcard Deck Size</label>
            <div className="ai-gen-modal__options-row">
              {CARD_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`ai-gen-modal__chip-btn ${
                    cardCount === count ? 'ai-gen-modal__chip-btn--active' : ''
                  }`}
                  onClick={() => setCardCount(count)}
                >
                  {count} Cards
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="ai-gen-modal__field-group">
            <label className="ai-gen-modal__field-label">Question Depth & Difficulty</label>
            <select
              className="ai-gen-modal__select"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')
              }
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Feature Status Notice */}
          <div className="ai-gen-modal__banner">
            <Info size={18} className="ai-gen-modal__banner-icon" />
            <p className="ai-gen-modal__banner-text">
              <strong>AI Flashcard Studio Pipeline:</strong> Generation workflows are fully configured and ready for automated AI synthesis in the upcoming backend release.
            </p>
          </div>

          <div className="ai-gen-modal__actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              leftIcon={<Sparkles size={16} />}
            >
              Generate Flashcard Set
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export type { AIGenerationModalProps } from './types';
