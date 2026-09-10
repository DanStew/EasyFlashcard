// ==========================================
// AIGenerationHub - Presentation Component
// ==========================================

import {
  FileCheck,
  FileUp,
  Sigma,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import type { AIGenerationHubProps } from './types';
import { STUDIO_FEATURES } from './utils';
import './style.scss';

export function AIGenerationHub({
  onOpenGenerator,
  onOpenUpload,
  totalDocsCount = 0,
}: AIGenerationHubProps) {
  const renderFeatureIcon = (name: string) => {
    switch (name) {
      case 'FileCheck':
        return <FileCheck size={18} />;
      case 'Sigma':
        return <Sigma size={18} />;
      case 'Workflow':
        return <Workflow size={18} />;
      default:
        return <Sparkles size={18} />;
    }
  };

  return (
    <section className="ai-generation-hub">
      {/* Studio Banner */}
      <div className="ai-generation-hub__banner">
        <div className="ai-generation-hub__banner-content">
          <div className="ai-generation-hub__badge-row">
            <Badge variant="primary" size="sm">
              <Sparkles size={12} />
              <span>Vertex AI Gemini 3.7 Flash</span>
            </Badge>
            <Badge variant="subtle" size="sm">
              <span>LangGraph Multi-Agent Engine</span>
            </Badge>
            {totalDocsCount > 0 && (
              <Badge variant="success" size="sm">
                <span>{totalDocsCount} Docs Ready to Ground</span>
              </Badge>
            )}
          </div>

          <h2 className="ai-generation-hub__title">AI Flashcard Synthesis Studio</h2>
          <p className="ai-generation-hub__tagline">
            Synthesize exhaustive, active recall flashcard sets directly grounded in your Google Drive documents or academic focus prompts.
          </p>

          <div className="ai-generation-hub__actions-row">
            <Button
              variant="gradient"
              size="lg"
              leftIcon={<Sparkles size={18} />}
              onClick={onOpenGenerator}
            >
              Synthesize Flashcards with AI
            </Button>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<FileUp size={17} />}
              onClick={onOpenUpload}
            >
              Upload Study Document
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="ai-generation-hub__features-grid">
        {STUDIO_FEATURES.map((feat) => (
          <div key={feat.id} className="ai-generation-hub__feature-card">
            <div className="ai-generation-hub__feature-icon-wrap">
              {renderFeatureIcon(feat.iconName)}
            </div>
            <div className="ai-generation-hub__feature-text">
              <h3 className="ai-generation-hub__feature-title">{feat.title}</h3>
              <p className="ai-generation-hub__feature-desc">{feat.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export type { AIGenerationHubProps } from './types';
