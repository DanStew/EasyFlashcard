// ==========================================
// AIGenerationModal - Presentation Component
// ==========================================

import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { FolderSelect } from '@/components/shared/FolderSelect';
import { Input } from '@/components/shared/Input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Modal } from '@/components/shared/Modal';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { TextArea } from '@/components/shared/TextArea';
import type { Document } from '@/types/document';
import type { AIGenerationRequest } from '@/types/aiGeneration';
import { GroundingDocPicker } from './GroundingDocPicker';
import type { AIGenerationModalProps } from './types';
import { AGENT_STEPS, FOCUS_SUGGESTIONS } from './utils';
import './style.scss';

export function AIGenerationModal({
  isOpen,
  onClose,
  folders = [],
  initialSelectedDoc = null,
  initialFolderId = null,
  onStartGeneration,
  generationEvent,
  isGenerating,
  onNavigateToSet,
}: AIGenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [setName, setSetName] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [showRawNotes, setShowRawNotes] = useState(false);

  // Sync initial doc and folder when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedDoc) {
        setSelectedDocs([initialSelectedDoc]);
      } else {
        setSelectedDocs([]);
      }
      setSelectedFolderId(initialFolderId);
    }
  }, [isOpen, initialSelectedDoc, initialFolderId]);

  const handleToggleDoc = (doc: Document) => {
    if (isGenerating) return;
    setSelectedDocs((prev) =>
      prev.some((d) => d.id === doc.id)
        ? prev.filter((d) => d.id !== doc.id)
        : [...prev, doc]
    );
  };

  const handleRemoveDoc = (docId: string) => {
    if (isGenerating) return;
    setSelectedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleClearAll = () => {
    if (isGenerating) return;
    setSelectedDocs([]);
  };

  const handleApplySuggestion = (snippet: string) => {
    if (isGenerating) return;
    setPrompt((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${snippet}` : snippet;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    const request: AIGenerationRequest = {
      prompt: prompt.trim() || undefined,
      documentIds: selectedDocs.map((d) => d.id),
      rawText: rawNotes.trim() || undefined,
      folderId: selectedFolderId,
      setName: setName.trim() || undefined,
    };

    onStartGeneration(request);
  };

  const isCompleted = generationEvent?.stage === 'completed';
  const isError = generationEvent?.stage === 'error';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isGenerating ? () => {} : onClose}
      title={isGenerating ? 'AI Multi-Agent Studio' : 'Generate Flashcards with Vertex AI'}
      subtitle={
        isGenerating
          ? 'LangGraph Multi-Agent synthesis & quality audit in progress'
          : 'Ground flashcards on study documents or generate from academic concepts'
      }
      size="lg"
    >
      <div className="ai-gen-modal">
        {/* PROGRESS / ACTIVE GENERATION VIEW */}
        {isGenerating || isCompleted ? (
          <div className="ai-gen-modal__progress-view">
            <div className="ai-gen-modal__progress-header">
              <div className="ai-gen-modal__progress-badge-row">
                <Badge variant={isCompleted ? 'success' : 'primary'} size="sm">
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Generation Complete</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="animate-spin-slow" />
                      <span>Gemini 3.7 Flash Reasoning</span>
                    </>
                  )}
                </Badge>
                {generationEvent?.cardCount ? (
                  <Badge variant="subtle" size="sm">
                    <Layers size={13} />
                    <span>{generationEvent.cardCount} Cards Synthesized</span>
                  </Badge>
                ) : null}
              </div>

              <h3 className="ai-gen-modal__progress-status-title">
                {isCompleted
                  ? `Set '${generationEvent?.setName || 'Study Deck'}' Created!`
                  : generationEvent?.message || 'Processing flashcard synthesis...'}
              </h3>

              <div className="ai-gen-modal__progress-bar-wrap">
                <ProgressBar
                  value={generationEvent?.progress || 10}
                  variant={isCompleted ? 'success' : 'gradient'}
                  size="md"
                />
              </div>
            </div>

            {/* Multi-Agent Timeline Steps */}
            <div className="ai-gen-modal__agent-timeline">
              {AGENT_STEPS.map((step, idx) => {
                const currentStage = generationEvent?.stage;
                const isStepActive = currentStage === step.stage;
                const isStepDone =
                  isCompleted ||
                  (currentStage === 'generating' && idx === 0) ||
                  (currentStage === 'reviewing' && idx <= 1) ||
                  (currentStage === 'persisting' && idx <= 2);

                return (
                  <div
                    key={step.stage}
                    className={`ai-gen-modal__timeline-step ${
                      isStepActive
                        ? 'ai-gen-modal__timeline-step--active'
                        : isStepDone
                        ? 'ai-gen-modal__timeline-step--done'
                        : 'ai-gen-modal__timeline-step--pending'
                    }`}
                  >
                    <div className="ai-gen-modal__timeline-marker">
                      {isStepDone ? (
                        <CheckCircle2 size={16} />
                      ) : isStepActive ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div className="ai-gen-modal__timeline-content">
                      <span className="ai-gen-modal__timeline-title">{step.title}</span>
                      <p className="ai-gen-modal__timeline-desc">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Callout */}
            {isError && (
              <div className="ai-gen-modal__error-box">
                <AlertCircle size={18} />
                <p>{generationEvent?.error || 'Generation failed. Please try again.'}</p>
              </div>
            )}

            {/* Completed Action Buttons */}
            {isCompleted && (
              <div className="ai-gen-modal__completed-actions">
                <Button
                  type="button"
                  variant="gradient"
                  fullWidth
                  leftIcon={<BookOpen size={16} />}
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => {
                    if (generationEvent?.setId && onNavigateToSet) {
                      onNavigateToSet(generationEvent.setId);
                      onClose();
                    } else {
                      onClose();
                    }
                  }}
                >
                  Open Generated Flashcard Set
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* FORM INPUT VIEW */
          <form onSubmit={handleSubmit} className="ai-gen-modal__form">
            {/* Top Hero Banner */}
            <div className="ai-gen-modal__hero">
              <div className="ai-gen-modal__hero-glow" />
              <div className="ai-gen-modal__hero-content">
                <div className="ai-gen-modal__hero-icon-wrap">
                  <Sparkles size={22} className="ai-gen-modal__hero-icon" />
                </div>
                <div className="ai-gen-modal__hero-text">
                  <div className="ai-gen-modal__hero-badge-row">
                    <span className="ai-gen-modal__hero-pill ai-gen-modal__hero-pill--primary">
                      ⚡ Gemini 3.7 Flash Reasoning
                    </span>
                    <span className="ai-gen-modal__hero-pill ai-gen-modal__hero-pill--secondary">
                      🧠 LangGraph Multi-Agent
                    </span>
                  </div>
                  <p className="ai-gen-modal__hero-desc">
                    Attach Google Drive documents to ground flashcards strictly on your lecture materials, or synthesize comprehensive decks directly from concepts.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Grounding Document Explorer */}
            <div className="ai-gen-modal__field-group">
              <div className="ai-gen-modal__field-header">
                <label className="ai-gen-modal__field-label">
                  <span>Grounding Documents (Google Drive)</span>
                </label>
                <span className="ai-gen-modal__field-hint">
                  {selectedDocs.length > 0
                    ? `${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} attached`
                    : 'Optional: Cards will ground strictly on attached files'}
                </span>
              </div>

              <GroundingDocPicker
                selectedDocs={selectedDocs}
                onToggleDoc={handleToggleDoc}
                onRemoveDoc={handleRemoveDoc}
                onClearAll={handleClearAll}
                disabled={isGenerating}
              />
            </div>

            {/* Custom Focus Prompt */}
            <div className="ai-gen-modal__field-group">
              <TextArea
                label="Custom Focus Prompt & Topics (Optional)"
                placeholder="e.g. Focus on Chapter 4 enzyme regulation mechanisms and LaTeX thermodynamic equations, or leave blank to cover everything exhaustively..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                fullWidth
              />

              {/* Quick Focus Chips */}
              <div className="ai-gen-modal__suggestions-wrap">
                <span className="ai-gen-modal__suggestions-label">Suggested Focus Styles:</span>
                <div className="ai-gen-modal__suggestions-grid">
                  {FOCUS_SUGGESTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="ai-gen-modal__suggestion-btn"
                      onClick={() => handleApplySuggestion(item.promptSnippet)}
                      title={item.promptSnippet}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Folder Selector */}
            <div className="ai-gen-modal__field-group">
              <FolderSelect
                folders={folders}
                selectedFolderId={selectedFolderId || ''}
                onSelectFolder={(id) => setSelectedFolderId(id || null)}
                label="Save New Set Into Folder"
              />
            </div>

            {/* Custom Set Title (Optional) */}
            <div className="ai-gen-modal__field-group">
              <Input
                label="Set Title (Optional)"
                placeholder="Leave blank for AI-generated title based on documents/topic"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                fullWidth
              />
            </div>

            {/* Optional Raw Notes Accordion */}
            <div className="ai-gen-modal__accordion-wrap">
              <button
                type="button"
                className="ai-gen-modal__accordion-toggle"
                onClick={() => setShowRawNotes((prev) => !prev)}
              >
                {showRawNotes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{showRawNotes ? 'Hide Pasted Notes' : 'Paste Additional Raw Lecture Notes / Markdown'}</span>
              </button>

              {showRawNotes && (
                <div className="ai-gen-modal__accordion-body">
                  <TextArea
                    placeholder="Paste lecture transcript, textbook summary, or raw markdown notes here..."
                    value={rawNotes}
                    onChange={(e) => setRawNotes(e.target.value)}
                    rows={4}
                    fullWidth
                  />
                </div>
              )}
            </div>

            {/* Modal Form Actions */}
            <div className="ai-gen-modal__actions">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                leftIcon={<Sparkles size={16} />}
              >
                Synthesize Flashcard Set
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

export type { AIGenerationModalProps } from './types';
