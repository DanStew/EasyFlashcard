import { Modal } from '@/components/shared/Modal';
import type { StudyShortcutsModalProps } from './types';
import { getShortcutsList } from './utils';
import './style.scss';

export function StudyShortcutsModal({ isOpen, onClose }: StudyShortcutsModalProps) {
  const shortcuts = getShortcutsList();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      subtitle="Study faster and stay in the zone without touching your mouse."
      size="md"
    >
      <div className="study-shortcuts">
        {shortcuts.map((item) => (
          <div key={item.description} className="study-shortcuts__item">
            <span className="study-shortcuts__desc">{item.description}</span>
            <div className="study-shortcuts__keys">
              {item.keys.map((k) => (
                <kbd key={k} className="study-shortcuts__key">
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export type { StudyShortcutsModalProps } from './types';
