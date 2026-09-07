import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { FolderSelect } from '@/components/shared/FolderSelect';
import { Input } from '@/components/shared/Input';
import { Skeleton } from '@/components/shared/Skeleton';
import { TextArea } from '@/components/shared/TextArea';
import { useToast } from '@/hooks/useToast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { flashcardService } from '@/services/flashcardService';
import { folderService } from '@/services/folderService';
import { setService } from '@/services/setService';
import type { FlashcardCreate } from '@/types/flashcard';
import type { Folder } from '@/types/folder';
import type { CardDraft } from './types';
import { createEmptyCardDraft, validateSetDraft } from './utils';
import './style.scss';

export function SetEditorView() {
  const params = useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { getBreadcrumbsForFolder } = useWorkspace();

  const isEditMode = Boolean(params.setId);
  const setId = params.setId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(searchParams.get('folderId') || '');
  const [tagsString, setTagsString] = useState('');
  const [cards, setCards] = useState<CardDraft[]>([
    createEmptyCardDraft(0),
    createEmptyCardDraft(1),
    createEmptyCardDraft(2),
  ]);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const allFolders = await folderService.listFolders();
      setFolders(allFolders);

      if (isEditMode && setId) {
        setIsLoading(true);
        const [existingSet, existingCards] = await Promise.all([
          setService.getSet(setId),
          flashcardService.listCardsBySet(setId),
        ]);

        setName(existingSet.name);
        setDescription(existingSet.description || '');
        setFolderId(existingSet.folderId || '');
        setTagsString(existingSet.tags.join(', '));

        if (existingCards.length > 0) {
          setCards(
            existingCards.map((c, i) => ({
              id: c.id,
              frontText: c.front.text,
              backText: c.back.text,
              orderIndex: i,
            }))
          );
        }
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to load editor data');
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, setId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCardRow = () => {
    setCards((prev) => [...prev, createEmptyCardDraft(prev.length)]);
  };

  const handleRemoveCardRow = (index: number) => {
    setCards((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    setCards((prev) => {
      const newCards = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newCards.length) return prev;

      const temp = newCards[index];
      newCards[index] = newCards[targetIndex];
      newCards[targetIndex] = temp;
      return newCards;
    });
  };

  const handleCardChange = (index: number, field: 'frontText' | 'backText', value: string) => {
    setCards((prev) => {
      const newCards = [...prev];
      newCards[index] = { ...newCards[index], [field]: value };
      return newCards;
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    const { valid, error } = validateSetDraft(name, cards);
    if (!valid && error) {
      showError(error);
      return;
    }

    try {
      setIsSaving(true);
      const tags = tagsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let targetSetId = setId;

      if (isEditMode && targetSetId) {
        await setService.updateSet(targetSetId, {
          name: name.trim(),
          description: description.trim() || undefined,
          folderId: folderId || null,
          tags,
        });

        // Save card edits / new cards
        const validCards = cards.filter((c) => c.frontText.trim() && c.backText.trim());
        for (let i = 0; i < validCards.length; i++) {
          const c = validCards[i];
          if (c.id) {
            await flashcardService.updateCard(c.id, {
              front: { text: c.frontText.trim() },
              back: { text: c.backText.trim() },
              orderIndex: i,
            });
          } else {
            await flashcardService.createCard(targetSetId, {
              front: { text: c.frontText.trim() },
              back: { text: c.backText.trim() },
              orderIndex: i,
            });
          }
        }

        showSuccess('Set and flashcards updated!');
      } else {
        const createdSet = await setService.createSet({
          name: name.trim(),
          description: description.trim() || undefined,
          folderId: folderId || null,
          tags,
        });
        targetSetId = createdSet.id;

        const validCards = cards.filter((c) => c.frontText.trim() && c.backText.trim());
        if (validCards.length > 0) {
          const bulkPayload: FlashcardCreate[] = validCards.map((c, i) => ({
            front: { text: c.frontText.trim() },
            back: { text: c.backText.trim() },
            orderIndex: i,
          }));

          await flashcardService.createCardsBulk(targetSetId, { cards: bulkPayload });
        }

        showSuccess('Flashcard set created!');
      }

      navigate(`/set/${targetSetId}`);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save set');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="set-editor-view animate-fade-in">
        <Skeleton variant="rectangular" height="80px" />
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  const baseBreadcrumbs = getBreadcrumbsForFolder(folderId || null);
  const breadcrumbs = [
    ...baseBreadcrumbs,
    { id: 'editor', label: isEditMode ? 'Edit Set' : 'New Flashcard Set' },
  ];

  return (
    <form onSubmit={handleSave} className="set-editor-view animate-fade-in">
      {/* Breadcrumbs Navigation Trail */}
      <div className="set-editor-view__breadcrumbs">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Header */}
      <div className="set-editor-view__header">
        <h1 className="set-editor-view__title">
          {isEditMode ? 'Edit Flashcard Set' : 'Create New Flashcard Set'}
        </h1>

        <div className="set-editor-view__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEditMode && setId ? `/set/${setId}` : '/')}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="gradient"
            size="md"
            leftIcon={<Save size={16} />}
            isLoading={isSaving}
          >
            Save Set
          </Button>
        </div>
      </div>

      {/* Meta info card */}
      <Card variant="raised" className="set-editor-view__meta-card">
        <Input
          label="Title"
          placeholder="e.g. Molecular Biology - Chapter 4"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          required
          fullWidth
        />

        <TextArea
          label="Description (Optional)"
          placeholder="Brief description of the topics covered in this set..."
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          rows={2}
          fullWidth
        />

        <div className="set-editor-view__meta-grid">
          <FolderSelect
            folders={folders}
            selectedFolderId={folderId}
            onSelectFolder={setFolderId}
          />

          <Input
            label="Tags (Comma separated)"
            placeholder="e.g. biology, exam, semester-1"
            value={tagsString}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTagsString(e.target.value)}
            fullWidth
          />
        </div>
      </Card>

      {/* Cards List Editor */}
      <section className="set-editor-view__cards-section">
        <div className="set-editor-view__cards-header">
          <h2 className="set-editor-view__cards-title">Cards ({cards.length})</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={handleAddCardRow}
          >
            Add Card
          </Button>
        </div>

        {cards.map((card, index) => (
          <div key={index} className="set-editor-view__card-row">
            <div className="set-editor-view__row-header">
              <span className="set-editor-view__row-number">{index + 1}</span>

              <div className="set-editor-view__row-actions">
                <button
                  type="button"
                  className="set-editor-view__row-btn"
                  onClick={() => handleMoveCard(index, 'up')}
                  disabled={index === 0}
                  title="Move card up"
                  aria-label="Move card up"
                >
                  <ArrowUp size={14} />
                </button>

                <button
                  type="button"
                  className="set-editor-view__row-btn"
                  onClick={() => handleMoveCard(index, 'down')}
                  disabled={index === cards.length - 1}
                  title="Move card down"
                  aria-label="Move card down"
                >
                  <ArrowDown size={14} />
                </button>

                <button
                  type="button"
                  className="set-editor-view__row-btn set-editor-view__row-btn--delete"
                  onClick={() => handleRemoveCardRow(index)}
                  disabled={cards.length <= 1}
                  title="Delete card"
                  aria-label="Delete card"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="set-editor-view__row-fields">
              <TextArea
                label="Term (Front)"
                placeholder="Enter term or question..."
                value={card.frontText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  handleCardChange(index, 'frontText', e.target.value)
                }
                rows={3}
                fullWidth
              />

              <TextArea
                label="Definition (Back)"
                placeholder="Enter definition or answer..."
                value={card.backText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  handleCardChange(index, 'backText', e.target.value)
                }
                rows={3}
                fullWidth
              />
            </div>
          </div>
        ))}

        <div className="set-editor-view__add-card-wrapper">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            leftIcon={<Plus size={18} />}
            onClick={handleAddCardRow}
          >
            + Add Card Row
          </Button>
        </div>

        <div className="set-editor-view__bottom-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEditMode && setId ? `/set/${setId}` : '/')}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            leftIcon={<Save size={18} />}
            isLoading={isSaving}
          >
            Save Flashcard Set
          </Button>
        </div>
      </section>
    </form>
  );
}
