import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { useStore } from '../../store/StoreContext';
import './ai-panel.css';

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

const SUGGESTIONS = [
  'Restock 20 units of Aurora Wireless Headphones',
  'Which items are low in stock?',
  'Show total inventory valuation',
  'Create item group Smart Home with code SMRT',
  'Create product Wireless Mouse SKU WMS-01 in Electronics price 1299',
  'Issue 5 units of Halo Desk Lamp',
  'Update price of Aurora Wireless Headphones to 1499',
  'Add supplier Acme Corp',
];

function formatMarkdown(text) {
  if (!text) return null;
  // Simple markdown renderer for bold, code, bullets, and linebreaks
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bullets
    if (line.trim().startsWith('- ')) {
      const content = line.trim().slice(2);
      return (
        <li key={idx} dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
      );
    }
    if (line.trim() === '') {
      return <div key={idx} style={{ height: 6 }} />;
    }
    return (
      <p key={idx} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
    );
  });
}

function renderInline(str) {
  let s = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Bold **text**
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline code `code`
  s = s.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>');
  return s;
}

export function AIPanel({ open, onClose }) {
  const { refreshData } = useStore();
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const [input, setInput] = useState('');

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat({
    transport: chatTransport,
    onFinish: () => {
      // Auto-sync PostgreSQL database state across the whole app
      refreshData();
    },
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSuggestion = (promptText) => {
    void sendMessage({ text: promptText });
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    void sendMessage({ text });
  };

  return (
    <>
      <div className="ai-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ai-panel" aria-label="AI Inventory Copilot">
        <header className="ai-panel__header">
          <div className="ai-panel__title-wrap">
            <span className="ai-panel__icon-box">
              <Icon name="smart_toy" size={22} />
            </span>
            <div className="ai-panel__headings">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2>AI Copilot</h2>
                <span className="ai-panel__badge">Vercel AI SDK</span>
              </div>
              <span className="md-body-small text-muted">
                Task-executing assistant for PostgreSQL
              </span>
            </div>
          </div>

          <div className="ai-panel__actions">
            {messages.length > 0 && (
              <IconButton
                icon="delete"
                tooltip="Clear chat"
                size="small"
                onClick={handleClear}
              />
            )}
            <IconButton
              icon="close"
              tooltip="Close AI Copilot"
              size="small"
              onClick={onClose}
            />
          </div>
        </header>

        <div className="ai-panel__body">
          {messages.length === 0 ? (
            <div className="ai-suggestions">
              <h3 className="ai-suggestions__title">Try asking or instructing:</h3>
              <div className="ai-suggestions__chips">
                {SUGGESTIONS.map((text, i) => (
                  <button
                    key={i}
                    type="button"
                    className="ai-suggestion-chip"
                    onClick={() => handleSuggestion(text)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`ai-msg ${m.role === 'user' ? 'ai-msg--user' : 'ai-msg--assistant'}`}
              >
                <div className="ai-msg__bubble">
                  {m.parts.map((part, index) => {
                    if (part.type === 'text') {
                      return <span key={`${m.id}-text-${index}`}>{formatMarkdown(part.text)}</span>;
                    }

                    if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                      const toolName = part.type === 'dynamic-tool'
                        ? part.toolName
                        : part.type.slice('tool-'.length);
                      const toolInput = part.input;
                      const state = part.state === 'output-available'
                        ? 'Completed'
                        : part.state === 'output-error'
                          ? 'Failed'
                          : 'Running...';

                      return (
                        <div key={part.toolCallId} className="ai-tool-card">
                          <div className="ai-tool-card__header">
                            <span>Executed: {toolName}</span>
                            <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                              {state}
                            </span>
                          </div>
                          {toolInput !== undefined && (
                            <div className="ai-tool-card__body">
                              {JSON.stringify(toolInput)}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="ai-msg ai-msg--assistant" role="alert">
              <div className="ai-msg__bubble">
                Chat request failed: {error.message}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="ai-msg ai-msg--assistant">
              <div className="ai-typing-indicator">
                <span className="ai-dot" />
                <span className="ai-dot" />
                <span className="ai-dot" />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <footer className="ai-panel__footer">
          <form className="ai-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="ai-input-field"
              placeholder="Give a task, restock items, or ask questions…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={!input.trim() || isLoading}
              aria-label="Send prompt"
            >
              <Icon name="send" size={18} />
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
}
