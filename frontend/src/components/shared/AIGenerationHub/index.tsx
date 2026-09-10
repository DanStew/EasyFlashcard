// ==========================================
// AIGenerationHub - Presentation Component
// ==========================================

import { FileText, FileUp, MessageSquarePlus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import type { AIGenerationHubProps } from './types';
import { AI_CAPABILITIES } from './utils';
import './style.scss';

export function AIGenerationHub({
  onOpenUpload,
  onOpenPromptModal,
  onExploreDocuments,
}: AIGenerationHubProps) {
  const handleAction = (id: string) => {
    switch (id) {
      case 'document':
        onOpenUpload();
        break;
      case 'prompt':
        onOpenPromptModal('prompt');
        break;
      case 'text':
        onOpenPromptModal('text');
        break;
      default:
        onExploreDocuments();
        break;
    }
  };

  const renderIcon = (id: string) => {
    switch (id) {
      case 'document':
        return <FileUp size={20} />;
      case 'prompt':
        return <MessageSquarePlus size={20} />;
      case 'text':
        return <FileText size={20} />;
      default:
        return <Sparkles size={20} />;
    }
  };

  return (
    <section className="ai-generation-hub">
      <div className="ai-generation-hub__header">
        <div className="ai-generation-hub__title-group">
          <div className="ai-generation-hub__icon-mark">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="ai-generation-hub__title">AI Flashcard Generation Hub</h2>
            <p className="ai-generation-hub__tagline">
              Generate structured, high-yield flashcard decks with smart AI extraction
            </p>
          </div>
        </div>
      </div>

      <div className="ai-generation-hub__grid">
        {AI_CAPABILITIES.map((cap) => (
          <div
            key={cap.id}
            className={`ai-generation-hub__card ai-generation-hub__card--${cap.id}`}
          >
            <div className="ai-generation-hub__card-top">
              <div
                className={`ai-generation-hub__card-icon-box ai-generation-hub__card-icon-box--${cap.id}`}
              >
                {renderIcon(cap.id)}
              </div>
              <Badge variant={cap.badgeVariant} size="sm">
                {cap.badge}
              </Badge>
            </div>

            <div className="ai-generation-hub__card-body">
              <h3 className="ai-generation-hub__card-title">{cap.title}</h3>
              <p className="ai-generation-hub__card-desc">{cap.description}</p>
            </div>

            <div className="ai-generation-hub__card-footer">
              <span className="ai-generation-hub__card-pill">{cap.highlightPill}</span>
            </div>

            <button
              type="button"
              className={`ai-generation-hub__action-btn ${
                cap.id === 'prompt'
                  ? 'ai-generation-hub__action-btn--gradient'
                  : 'ai-generation-hub__action-btn--outline'
              }`}
              onClick={() => handleAction(cap.id)}
            >
              <Sparkles size={15} />
              <span>{cap.actionText}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export type { AIGenerationHubProps } from './types';
