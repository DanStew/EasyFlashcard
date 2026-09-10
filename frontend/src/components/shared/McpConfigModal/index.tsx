// ==============================================================================
// EasyFlashcard - MCP Config Modal Component
// ==============================================================================

import { useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Download,
  FileCode2,
  Info,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { McpConfigModalProps, McpConfigTab } from './types';
import {
  downloadAuthJsonFile,
  generateAntigravityConfigSnippet,
  generateClaudeDesktopConfigSnippet,
  generateEnvSnippet,
  getActiveUserId,
} from './utils';
import './style.scss';

export function McpConfigModal({ isOpen, onClose }: McpConfigModalProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<McpConfigTab>('antigravity');
  const [copiedField, setCopiedField] = useState<'id' | 'snippet' | null>(null);

  const activeUserId = getActiveUserId(currentUser);

  const getSnippetContent = (): string => {
    switch (activeTab) {
      case 'antigravity':
        return generateAntigravityConfigSnippet(activeUserId);
      case 'claude':
        return generateClaudeDesktopConfigSnippet(activeUserId);
      case 'env':
        return generateEnvSnippet(activeUserId);
    }
  };

  const handleCopyUserId = async () => {
    await navigator.clipboard.writeText(activeUserId);
    setCopiedField('id');
    showSuccess('User ID copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopySnippet = async () => {
    const text = getSnippetContent();
    await navigator.clipboard.writeText(text);
    setCopiedField('snippet');
    showSuccess('Configuration snippet copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadCredentials = () => {
    downloadAuthJsonFile(activeUserId);
    showSuccess('Downloaded .easyflashcard-auth.json file!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Agent & MCP Integration"
      subtitle="Connect AI coding assistants and agents (Antigravity, Claude, Cursor) to your EasyFlashcard workspace"
    >
      <div className="mcp-config-modal">
        {/* User Account ID Section */}
        <div className="mcp-config-modal__section">
          <div className="mcp-config-modal__section-title">Active User Identifier</div>
          <div className="mcp-config-modal__id-box">
            <div className="mcp-config-modal__id-box-content">
              <span className="mcp-config-modal__id-box-value">{activeUserId}</span>
              <span className="mcp-config-modal__id-box-badge">
                {isAuthenticated
                  ? `Signed in (${currentUser?.email || 'Firebase Auth'})`
                  : 'Local Development Default Account'}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={copiedField === 'id' ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopyUserId}
            >
              {copiedField === 'id' ? 'Copied' : 'Copy ID'}
            </Button>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div className="mcp-config-modal__section">
          <div className="mcp-config-modal__section-title">Agent Configuration</div>
          <div className="mcp-config-modal__tabs">
            <button
              type="button"
              className={`mcp-config-modal__tab-btn ${
                activeTab === 'antigravity' ? 'mcp-config-modal__tab-btn--active' : ''
              }`}
              onClick={() => setActiveTab('antigravity')}
            >
              <Bot size={14} />
              <span>Antigravity (.agents/mcp_config.json)</span>
            </button>
            <button
              type="button"
              className={`mcp-config-modal__tab-btn ${
                activeTab === 'claude' ? 'mcp-config-modal__tab-btn--active' : ''
              }`}
              onClick={() => setActiveTab('claude')}
            >
              <FileCode2 size={14} />
              <span>Claude Desktop</span>
            </button>
            <button
              type="button"
              className={`mcp-config-modal__tab-btn ${
                activeTab === 'env' ? 'mcp-config-modal__tab-btn--active' : ''
              }`}
              onClick={() => setActiveTab('env')}
            >
              <Terminal size={14} />
              <span>Environment Variables</span>
            </button>
          </div>

          {/* Code Viewer Container */}
          <div className="mcp-config-modal__code-container">
            <div className="mcp-config-modal__code-header">
              <span>{activeTab === 'env' ? '.env' : 'mcp_config.json'}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={copiedField === 'snippet' ? <Check size={12} /> : <Copy size={12} />}
                onClick={handleCopySnippet}
              >
                {copiedField === 'snippet' ? 'Copied' : 'Copy Snippet'}
              </Button>
            </div>
            <pre className="mcp-config-modal__code-content">{getSnippetContent()}</pre>
          </div>
        </div>

        {/* Auto Launcher Notice */}
        <div className="mcp-config-modal__notice">
          <Info size={16} className="mcp-config-modal__notice-icon" />
          <span>
            <strong>Automatic Backend:</strong> When running the MCP server locally via <code>npx</code>, it automatically starts the FastAPI backend for you if it isn't already running.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="mcp-config-modal__actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleDownloadCredentials}
            title="Download .easyflashcard-auth.json to workspace or user home folder"
          >
            Download Credentials File
          </Button>

          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { McpConfigModalProps, McpConfigTab } from './types';
