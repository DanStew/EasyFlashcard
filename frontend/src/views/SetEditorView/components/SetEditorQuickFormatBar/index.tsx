import {
  ArrowLeftRight,
  Bold,
  Code,
  Italic,
  List,
  Pi,
  Sigma,
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import type { FormatAction, SetEditorQuickFormatBarProps } from './types';
import './style.scss';

export function SetEditorQuickFormatBar({
  onFormat,
  disabled = false,
}: SetEditorQuickFormatBarProps) {
  const { hapticTick } = useHaptics();

  const handleAction = (action: FormatAction) => {
    hapticTick();
    onFormat(action);
  };

  return (
    <div className="set-editor-quick-format-bar" role="toolbar" aria-label="Quick formatting tools">
      <button
        type="button"
        className="set-editor-quick-format-bar__btn"
        onClick={() => handleAction('bold')}
        disabled={disabled}
        title="Bold text (**text**)"
        aria-label="Format bold text"
      >
        <Bold size={13} />
        <span>Bold</span>
      </button>

      <button
        type="button"
        className="set-editor-quick-format-bar__btn"
        onClick={() => handleAction('italic')}
        disabled={disabled}
        title="Italic text (*text*)"
        aria-label="Format italic text"
      >
        <Italic size={13} />
        <span>Italic</span>
      </button>

      <button
        type="button"
        className="set-editor-quick-format-bar__btn set-editor-quick-format-bar__btn--latex"
        onClick={() => handleAction('latex-inline')}
        disabled={disabled}
        title="Inline LaTeX formula ($x$)"
        aria-label="Insert inline LaTeX math"
      >
        <Pi size={14} />
        <span>$x$</span>
      </button>

      <button
        type="button"
        className="set-editor-quick-format-bar__btn set-editor-quick-format-bar__btn--latex"
        onClick={() => handleAction('latex-block')}
        disabled={disabled}
        title="Block LaTeX equation ($$...$$)"
        aria-label="Insert block LaTeX equation"
      >
        <Sigma size={14} />
        <span>$$Eq$$</span>
      </button>

      <button
        type="button"
        className="set-editor-quick-format-bar__btn"
        onClick={() => handleAction('code')}
        disabled={disabled}
        title="Inline code (`code`)"
        aria-label="Format inline code"
      >
        <Code size={13} />
        <span>Code</span>
      </button>

      <button
        type="button"
        className="set-editor-quick-format-bar__btn"
        onClick={() => handleAction('bullet')}
        disabled={disabled}
        title="Bullet list (- item)"
        aria-label="Insert bullet item"
      >
        <List size={13} />
        <span>List</span>
      </button>

      <button
        type="button"
        className="set-editor-quick-format-bar__btn"
        onClick={() => handleAction('swap')}
        disabled={disabled}
        title="Swap Front and Back content"
        aria-label="Swap front and back content"
      >
        <ArrowLeftRight size={13} />
        <span>Swap</span>
      </button>
    </div>
  );
}

export type { FormatAction, SetEditorQuickFormatBarProps } from './types';
