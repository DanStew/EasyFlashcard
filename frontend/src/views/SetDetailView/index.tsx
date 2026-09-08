import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  Folder as FolderIcon,
  Play,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { Flashcard3D } from '@/components/shared/Flashcard3D';
import { Modal } from '@/components/shared/Modal';
import { Skeleton } from '@/components/shared/Skeleton';
import { TextArea } from '@/components/shared/TextArea';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { ApiError } from '@/services/apiClient';
import { flashcardService } from '@/services/flashcardService';
import { setService } from '@/services/setService';
import type { Flashcard } from '@/types/flashcard';
import type { SetModel } from '@/types/set';
import { NotFoundView } from '@/views/NotFoundView';
import type { SetDetailViewProps } from './types';
import './style.scss';

export function SetDetailView({ setId: propSetId }: SetDetailViewProps) {
  const params = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { getBreadcrumbsForFolder } = useWorkspace();

  const activeSetId = propSetId || params.setId;

  const [set, setSet] = useState<SetModel | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Edit Card Modal
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editFrontText, setEditFrontText] = useState('');
  const [editBackText, setEditBackText] = useState('');
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);

  // Delete Set Modal
  const [isDeleteSetOpen, setIsDeleteSetOpen] = useState(false);
  const [isDeletingSet, setIsDeletingSet] = useState(false);

  const loadSetAndCards = useCallback(async () => {
    if (!activeSetId) return;

    try {
      setIsLoading(true);
      setIsNotFound(false);
      const [setData, cardsData] = await Promise.all([
        setService.getSet(activeSetId),
        flashcardService.listCardsBySet(activeSetId),
      ]);
      setSet(setData);
      setCards(cardsData);
      setActiveCardIndex(0);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isNotFound) {
        setIsNotFound(true);
      } else {
        showError(err instanceof Error ? err.message : 'Failed to load flashcard set');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeSetId, showError]);

  useEffect(() => {
    loadSetAndCards();
  }, [loadSetAndCards]);

  const handleOpenEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setEditFrontText(card.front.text);
    setEditBackText(card.back.text);
  };

  const handleUpdateCard = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editFrontText.trim() || !editBackText.trim()) return;

    try {
      setIsUpdatingCard(true);
      await flashcardService.updateCard(editingCard.id, {
        front: { text: editFrontText.trim() },
        back: { text: editBackText.trim() },
      });

      showSuccess('Flashcard updated!');
      setEditingCard(null);
      loadSetAndCards();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to update card');
    } finally {
      setIsUpdatingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await flashcardService.deleteCard(cardId);
      showSuccess('Card deleted');
      loadSetAndCards();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to delete card');
    }
  };

  const handleDeleteSet = async () => {
    if (!activeSetId) return;

    try {
      setIsDeletingSet(true);
      await setService.deleteSet(activeSetId);
      showSuccess('Set deleted');
      setIsDeleteSetOpen(false);
      navigate('/');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to delete set');
    } finally {
      setIsDeletingSet(false);
    }
  };

  const currentStageCard = cards[activeCardIndex] || null;

  if (isNotFound) {
    return <NotFoundView entityType="set" />;
  }

  const baseBreadcrumbs = getBreadcrumbsForFolder(set?.folderId || null);
  const breadcrumbs = set
    ? [...baseBreadcrumbs, { id: set.id, label: set.name }]
    : baseBreadcrumbs;

  return (
    <div className="set-detail-view animate-fade-in">
      {/* Breadcrumb Navigation Trail */}
      <div className="set-detail-view__breadcrumbs">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Header */}
      <div className="set-detail-view__header">
        <div className="set-detail-view__meta">
          <div className="set-detail-view__badges">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => navigate(set?.folderId ? `/folder/${set.folderId}` : '/')}
            >
              {set?.folderId ? 'Back to Folder' : 'Back to Library'}
            </Button>
            <Badge variant="primary" size="md">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </Badge>
            {set?.folderId && (
              <Badge variant="default" size="md" icon={<FolderIcon size={12} />}>
                In Folder
              </Badge>
            )}
            {set?.tags?.map((tag) => (
              <Badge key={tag} variant="subtle" size="md">
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="set-detail-view__title">
            {isLoading ? <Skeleton variant="text" width="280px" /> : set?.name}
          </h1>

          {set?.description && <p className="set-detail-view__desc">{set.description}</p>}
        </div>

        <div className="set-detail-view__actions">
          <Button
            variant="gradient"
            size="lg"
            leftIcon={<Play size={18} />}
            disabled={cards.length === 0}
            tooltip={
              cards.length === 0
                ? 'Add flashcards to this set to begin studying'
                : 'Study flashcards with interactive flips and swipe gestures'
            }
            onClick={() => navigate(`/set/${activeSetId}/study`)}
          >
            Study Flashcards
          </Button>

          <Button
            variant="secondary"
            size="md"
            leftIcon={<Edit size={16} />}
            onClick={() => navigate(`/set/${activeSetId}/edit`)}
          >
            Edit Set
          </Button>

          <Button
            variant="danger"
            size="md"
            leftIcon={<Trash2 size={16} />}
            onClick={() => setIsDeleteSetOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Stage Focus Preview (if cards exist) */}
      {cards.length > 0 && currentStageCard && (
        <section className="set-detail-view__stage">
          <div className="set-detail-view__stage-card-wrapper">
            <Flashcard3D
              key={currentStageCard.id}
              card={currentStageCard}
              size="lg"
              showActions={false}
            />
          </div>

          <div className="set-detail-view__stage-controls">
            <span className="set-detail-view__stage-counter">
              Card {activeCardIndex + 1} of {cards.length}
            </span>

            <div className="set-detail-view__stage-nav">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ChevronLeft size={16} />}
                disabled={activeCardIndex === 0}
                onClick={() => setActiveCardIndex((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight size={16} />}
                disabled={activeCardIndex === cards.length - 1}
                onClick={() => setActiveCardIndex((prev) => Math.min(cards.length - 1, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* All Cards Section */}
      <section className="set-detail-view__section">
        <div className="set-detail-view__section-header">
          <h2 className="set-detail-view__section-title">All Flashcards ({cards.length})</h2>
        </div>

        {isLoading ? (
          <div className="set-detail-view__cards-grid">
            <Skeleton variant="card" count={3} />
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={32} />}
            title="No Flashcards in this Set"
            description="Edit this set to add terms, definitions, and customize your flashcards."
            action={
              <Button
                variant="gradient"
                size="md"
                leftIcon={<Edit size={16} />}
                onClick={() => navigate(`/set/${activeSetId}/edit`)}
              >
                Edit Set to Add Cards
              </Button>
            }
          />
        ) : (
          <div className="set-detail-view__cards-grid">
            {cards.map((card) => (
              <Flashcard3D
                key={card.id}
                card={card}
                size="md"
                onEdit={handleOpenEditCard}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
        )}
      </section>

      {/* Edit Card Modal */}
      <Modal
        isOpen={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
        title="Edit Flashcard"
      >
        <form onSubmit={handleUpdateCard} className="set-detail-view__modal-form">
          <TextArea
            label="Term / Front"
            value={editFrontText}
            onChange={(e) => setEditFrontText(e.target.value)}
            rows={2}
            autoFocus
            fullWidth
            required
          />

          <TextArea
            label="Definition / Back"
            value={editBackText}
            onChange={(e) => setEditBackText(e.target.value)}
            rows={4}
            fullWidth
            required
          />

          <p className="set-detail-view__format-hint">
            Supports Markdown formatting and LaTeX equations ($...$ inline, $$...$$ block)
          </p>

          <div className="set-detail-view__modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingCard(null)}
              disabled={isUpdatingCard}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdatingCard}
              disabled={!editFrontText.trim() || !editBackText.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Set Modal */}
      <Modal
        isOpen={isDeleteSetOpen}
        onClose={() => setIsDeleteSetOpen(false)}
        title="Delete Flashcard Set"
        subtitle="Are you sure you want to delete this entire set and all its flashcards?"
      >
        <p>This action cannot be undone.</p>
        <div className="set-detail-view__modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsDeleteSetOpen(false)}
            disabled={isDeletingSet}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDeleteSet}
            isLoading={isDeletingSet}
          >
            Delete Set
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export type { SetDetailViewProps } from './types';

