// ==============================================================================
// EasyFlashcard - Server Configuration Modal Component
// ==============================================================================

import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Server,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/hooks/useToast';
import { getApiBaseUrl } from '@/utils/capacitorUtils';
import type { ServerConfigModalProps, ServerConfigState } from './types';
import {
  SERVER_PRESETS,
  executeServerTest,
  restoreDefaultServerEndpoint,
  saveServerEndpoint,
} from './utils';
import './style.scss';

export function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
  const { showSuccess } = useToast();
  const [state, setState] = useState<ServerConfigState>(() => ({
    apiUrl: getApiBaseUrl(),
    isTesting: false,
    status: 'idle',
    testResult: null,
  }));

  const handleSelectPreset = (url: string) => {
    setState((prev) => ({
      ...prev,
      apiUrl: url,
      status: 'idle',
      testResult: null,
    }));
  };

  const handleTestConnection = async () => {
    setState((prev) => ({
      ...prev,
      isTesting: true,
      status: 'testing',
      testResult: null,
    }));

    const { status, result } = await executeServerTest(state.apiUrl);
    setState((prev) => ({
      ...prev,
      isTesting: false,
      status,
      testResult: result,
    }));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!state.apiUrl.trim()) return;

    saveServerEndpoint(state.apiUrl);
    showSuccess(`Connected server endpoint updated to: ${state.apiUrl.trim()}`);
    onClose();
  };

  const handleReset = () => {
    const defaultUrl = restoreDefaultServerEndpoint();
    setState({
      apiUrl: defaultUrl,
      isTesting: false,
      status: 'idle',
      testResult: null,
    });
    showSuccess('Reset to default server endpoint');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backend Server Connection"
      subtitle="Configure API host address for mobile phone or local LAN development"
    >
      <form onSubmit={handleSave} className="server-config-modal">
        {/* Presets Grid */}
        <div className="server-config-modal__presets">
          <div className="server-config-modal__section-title">Quick Select Presets</div>
          <div className="server-config-modal__presets-grid">
            {SERVER_PRESETS.map((preset) => {
              const isSelected = state.apiUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`server-config-modal__preset-card ${
                    isSelected ? 'server-config-modal__preset-card--active' : ''
                  }`}
                  onClick={() => handleSelectPreset(preset.url)}
                >
                  <span className="server-config-modal__preset-card-title">{preset.label}</span>
                  <span className="server-config-modal__preset-card-desc">{preset.description}</span>
                  <code className="server-config-modal__preset-card-url">{preset.url}</code>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="server-config-modal__input-row">
          <div className="server-config-modal__section-title">Active Server URL</div>
          <Input
            value={state.apiUrl}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                apiUrl: e.target.value,
                status: 'idle',
                testResult: null,
              }))
            }
            placeholder="e.g. http://192.168.1.77:8000/api/v1"
            fullWidth
            required
          />
        </div>

        {/* Connection Feedback Banner */}
        {state.status === 'testing' && (
          <div className="server-config-modal__feedback server-config-modal__feedback--testing">
            <Loader2 size={16} className="app-sidebar__seed-icon--spin" />
            <span>Pinging backend server /health...</span>
          </div>
        )}

        {state.status === 'success' && state.testResult && (
          <div className="server-config-modal__feedback server-config-modal__feedback--success">
            <CheckCircle2 size={16} />
            <span>
              Connected successfully! ({state.testResult.durationMs}ms latency)
            </span>
          </div>
        )}

        {state.status === 'error' && state.testResult && (
          <div className="server-config-modal__feedback server-config-modal__feedback--error">
            <AlertCircle size={16} />
            <span>
              {state.testResult.error || 'Unable to reach server. Please check IP & Wi-Fi.'}
            </span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="server-config-modal__actions">
          <div className="server-config-modal__actions-left">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleReset}
              title="Reset to default endpoint"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Wifi size={14} />}
              onClick={handleTestConnection}
              isLoading={state.isTesting}
              disabled={!state.apiUrl.trim()}
            >
              Test Connection
            </Button>
          </div>

          <div className="server-config-modal__actions-right">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Server size={14} />}
              disabled={!state.apiUrl.trim()}
            >
              Save Endpoint
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export type { ServerConfigModalProps } from './types';
