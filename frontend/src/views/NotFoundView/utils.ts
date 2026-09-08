import type { NotFoundEntityType } from './types';

export interface NotFoundConfig {
  code: string;
  defaultTitle: string;
  defaultDescription: string;
  primaryActionText: string;
  primaryActionHref: string;
  secondaryActionText?: string;
  secondaryActionHref?: string;
}

export function getNotFoundConfig(entityType: NotFoundEntityType): NotFoundConfig {
  switch (entityType) {
    case 'set':
      return {
        code: '404',
        defaultTitle: 'Flashcard Set Not Found',
        defaultDescription:
          "The flashcard set you are looking for doesn't exist, may have been deleted, or belongs to another user account.",
        primaryActionText: 'Back to Library',
        primaryActionHref: '/',
        secondaryActionText: 'Create New Set',
        secondaryActionHref: '/create-set',
      };
    case 'folder':
      return {
        code: '404',
        defaultTitle: 'Folder Not Found',
        defaultDescription:
          "The folder you requested could not be located. It might have been moved, renamed, or deleted.",
        primaryActionText: 'Back to Library',
        primaryActionHref: '/',
        secondaryActionText: 'Explore All Sets',
        secondaryActionHref: '/',
      };
    case 'page':
    default:
      return {
        code: '404',
        defaultTitle: 'Page Not Found',
        defaultDescription:
          "The page you're trying to reach doesn't exist. Please check the URL or return to the main dashboard.",
        primaryActionText: 'Back to Library',
        primaryActionHref: '/',
        secondaryActionText: 'Create Flashcard Set',
        secondaryActionHref: '/create-set',
      };
  }
}
