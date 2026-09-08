import type {
  RichContentAlign,
  RichContentClassOptions,
  RichContentDensity,
} from './types';

/**
 * Checks if the content string contains LaTeX display (block) math equations.
 */
export function hasDisplayMath(content: string): boolean {
  if (!content) return false;
  return /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/.test(content);
}

/**
 * Checks if the content string contains code blocks (fenced triple-backtick).
 */
export function hasCodeBlock(content: string): boolean {
  if (!content) return false;
  return /```[\s\S]*?```/.test(content);
}

/**
 * Checks if the content string contains structured markdown elements
 * such as lists, headings, blockquotes, or tables.
 */
export function hasStructuredMarkdown(content: string): boolean {
  if (!content) return false;
  const listPattern = /(?:^|\n)\s*(?:[-*+]|\d+\.)\s+/;
  const headingPattern = /(?:^|\n)#{1,6}\s+/;
  const tablePattern = /(?:^|\n)\|.*?\|(?:\n\|[-:| ]+\|)/;
  const blockquotePattern = /(?:^|\n)>\s+/;

  return (
    listPattern.test(content) ||
    headingPattern.test(content) ||
    tablePattern.test(content) ||
    blockquotePattern.test(content)
  );
}

/**
 * Computes an adaptive density rating for the text.
 * Determines how typography size and margins are styled to guarantee
 * that content stays comfortably within flashcard bounds.
 */
export function detectContentDensity(content: string): RichContentDensity {
  if (!content) return 'short';

  const trimmed = content.trim();

  if (hasCodeBlock(trimmed)) {
    return 'code';
  }

  const isStructured = hasStructuredMarkdown(trimmed);
  const isDisplayMath = hasDisplayMath(trimmed);
  const charCount = trimmed.length;
  const lineCount = trimmed.split('\n').length;

  if (charCount > 180 || lineCount > 4 || isStructured || isDisplayMath) {
    return 'dense';
  }

  if (charCount > 60 || lineCount > 2) {
    return 'medium';
  }

  return 'short';
}

/**
 * Resolves the effective text alignment.
 * When set to 'auto', short titles/terms are centered,
 * while structured lists, code, and long paragraphs align to the left.
 */
export function resolveEffectiveAlign(
  align: RichContentAlign,
  density: RichContentDensity,
  isStructured: boolean
): 'center' | 'left' {
  if (align === 'center') return 'center';
  if (align === 'left') return 'left';

  // 'auto' mode
  if (density === 'short') {
    return 'center';
  }

  if (density === 'code' || isStructured) {
    return 'left';
  }

  return density === 'medium' ? 'center' : 'left';
}

/**
 * Composes the CSS class names for the RichContent root element.
 */
export function getRichContentClassNames({
  size,
  face,
  density,
  align,
  hasDisplayMath: isDisplayMath,
  hasCodeBlock: isCode,
  className = '',
}: RichContentClassOptions): string {
  const isStructured = density === 'dense' || density === 'code';
  const effectiveAlign = resolveEffectiveAlign(align, density, isStructured);

  return [
    'rich-content',
    `rich-content--size-${size}`,
    `rich-content--face-${face}`,
    `rich-content--density-${density}`,
    `rich-content--align-${effectiveAlign}`,
    isDisplayMath ? 'rich-content--has-display-math' : '',
    isCode ? 'rich-content--has-code' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
