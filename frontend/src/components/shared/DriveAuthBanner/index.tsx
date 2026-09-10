// ==========================================
// DriveAuthBanner - Component Presentation
// ==========================================

import { AlertTriangle, Cloud, HardDrive, RefreshCw, ShieldAlert, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import type { DriveAuthBannerProps } from './types';
import { getBannerInfoForError } from './utils';
import './style.scss';

export function DriveAuthBanner({
  errorCode,
  errorMessage,
  onConnectDrive,
  onDismiss,
  isConnecting = false,
}: DriveAuthBannerProps) {
  const { variant, title, description, actionText } = getBannerInfoForError(errorCode, errorMessage);

  const renderIcon = () => {
    switch (errorCode) {
      case 'DRIVE_PERMISSION_DENIED':
        return <ShieldAlert size={20} />;
      case 'DRIVE_QUOTA_EXCEEDED':
        return <HardDrive size={20} />;
      case 'DRIVE_AUTH_REQUIRED':
        return <AlertTriangle size={20} />;
      case 'DRIVE_SCOPE_UPGRADE':
        return <Sparkles size={20} />;
      default:
        return <Cloud size={20} />;
    }
  };

  return (
    <div className={`drive-auth-banner drive-auth-banner--${variant}`} role="alert">
      <div className="drive-auth-banner__left">
        <div className="drive-auth-banner__icon-box">{renderIcon()}</div>
        <div className="drive-auth-banner__content">
          <h4 className="drive-auth-banner__title">{title}</h4>
          <p className="drive-auth-banner__desc">{description}</p>
        </div>
      </div>

      <div className="drive-auth-banner__actions">
        {actionText && onConnectDrive && (
          <Button
            variant={variant === 'error' ? 'outline' : 'gradient'}
            size="sm"
            onClick={onConnectDrive}
            disabled={isConnecting}
            leftIcon={isConnecting ? <RefreshCw size={14} className="spin-animation" /> : <Cloud size={14} />}
          >
            {isConnecting ? 'Connecting...' : actionText}
          </Button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="drive-auth-banner__dismiss-btn"
            onClick={onDismiss}
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export type { DriveAuthBannerProps } from './types';
