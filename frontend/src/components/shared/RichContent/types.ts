/**
 * Types and interfaces for the RichContent component.
 */

export type RichContentSize = 'sm' | 'md' | 'lg' | 'focus';
export type RichContentFace = 'front' | 'back';
export type RichContentAlign = 'auto' | 'center' | 'left';
export type RichContentDensity = 'short' | 'medium' | 'dense' | 'code';

export interface RichContentProps {
  /** Raw text content supporting Markdown and LaTeX math syntax */
  content: string;
  /** Size context of the containing card surface */
  size?: RichContentSize;
  /** Flashcard face context (term front vs definition back) */
  face?: RichContentFace;
  /** Content alignment behavior ('auto' dynamically chooses based on density) */
  align?: RichContentAlign;
  /** Optional custom CSS class */
  className?: string;
}

export interface RichContentClassOptions {
  size: RichContentSize;
  face: RichContentFace;
  density: RichContentDensity;
  align: RichContentAlign;
  hasDisplayMath: boolean;
  hasCodeBlock: boolean;
  className?: string;
}
