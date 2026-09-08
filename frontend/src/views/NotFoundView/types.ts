export type NotFoundEntityType = 'set' | 'folder' | 'page';

export interface NotFoundViewProps {
  entityType?: NotFoundEntityType;
  title?: string;
  description?: string;
  customBackUrl?: string;
  customBackLabel?: string;
}
