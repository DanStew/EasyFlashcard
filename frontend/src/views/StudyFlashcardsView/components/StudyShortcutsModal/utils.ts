export interface ShortcutItem {
  keys: string[];
  description: string;
}

export function getShortcutsList(): ShortcutItem[] {
  return [
    { keys: ['Space', 'Enter'], description: 'Flip the current flashcard' },
    { keys: ['←', 'Left Arrow'], description: 'Mark as Needs Practice (Swipe Left)' },
    { keys: ['→', 'Right Arrow'], description: 'Mark as Mastered (Swipe Right)' },
    { keys: ['↑', '↓'], description: 'Flip card back and forth' },
    { keys: ['Z'], description: 'Undo last swipe verdict' },
    { keys: ['S'], description: 'Toggle random deck shuffle' },
    { keys: ['D'], description: 'Switch Front face (Term ↔ Definition)' },
    { keys: ['R'], description: 'Reset study session to card 1' },
    { keys: ['F'], description: 'Toggle distraction-free Focus mode' },
    { keys: ['?'], description: 'Open this shortcuts guide' },
  ];
}
