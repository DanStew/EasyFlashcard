export type FormatAction =
  | 'bold'
  | 'italic'
  | 'latex-inline'
  | 'latex-block'
  | 'code'
  | 'bullet'
  | 'swap';

export interface SetEditorQuickFormatBarProps {
  onFormat: (action: FormatAction) => void;
  disabled?: boolean;
}
