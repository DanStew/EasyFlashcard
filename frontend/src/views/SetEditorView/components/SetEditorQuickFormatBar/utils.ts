import type { FormatAction } from './types';

/**
 * Applies Markdown or LaTeX formatting to a given text based on selection.
 */
export function applyTextFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: FormatAction
): { newText: string; newCursorPos: number } {
  const before = text.substring(0, selectionStart);
  const selected = text.substring(selectionStart, selectionEnd);
  const after = text.substring(selectionEnd);

  let prefix = '';
  let suffix = '';
  let defaultPlaceholder = '';

  switch (action) {
    case 'bold':
      prefix = '**';
      suffix = '**';
      defaultPlaceholder = 'bold text';
      break;
    case 'italic':
      prefix = '*';
      suffix = '*';
      defaultPlaceholder = 'italic text';
      break;
    case 'latex-inline':
      prefix = '$';
      suffix = '$';
      defaultPlaceholder = 'x = \\frac{a}{b}';
      break;
    case 'latex-block':
      prefix = '\n$$\n';
      suffix = '\n$$\n';
      defaultPlaceholder = 'E = mc^2';
      break;
    case 'code':
      prefix = '`';
      suffix = '`';
      defaultPlaceholder = 'code';
      break;
    case 'bullet':
      prefix = '\n- ';
      suffix = '';
      defaultPlaceholder = 'item';
      break;
    default:
      return { newText: text, newCursorPos: selectionStart };
  }

  const contentToWrap = selected || defaultPlaceholder;
  const newText = `${before}${prefix}${contentToWrap}${suffix}${after}`;
  const newCursorPos = before.length + prefix.length + contentToWrap.length + suffix.length;

  return { newText, newCursorPos };
}
