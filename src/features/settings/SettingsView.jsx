import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Dialog } from '../../components/ui/Dialog';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../../store/ToastContext';
import { formatDate, formatNumber } from '../../utils/format';

const THEMES = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright surfaces',
    icon: 'light_mode',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dimmed surfaces',
    icon: 'dark_mode',
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match device',
    icon: 'contrast',
  },
];

const SWATCHES = [
  { label: 'Primary', token: '--md-sys-color-primary' },
  { label: 'Secondary', token: '--md-sys-color-secondary' },
  { label: 'Tertiary', token: '--md-sys-color-tertiary' },
  { label: 'Error', token: '--md-sys-color-error' },
  { label: 'Surface', token: '--md-sys-color-surface-container-high' },
];

export function SettingsView() {
  const { mode, setMode } = useTheme();
  const { products, movements, suppliers, resetData } = useStore();
  const { showToast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const storageSize = useMemo(() => {
    try {
      const raw = localStorage.getItem('invmage:data:v1');
      return raw ? (new Blob([raw]).size / 1024).toFixed(1) : '0';
    } catch {
      return '0';
    }
  }, [products, movements, suppliers]);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      products,
      suppliers,
      movements,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invmage-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.');
  };

  const handleReset = () => {
    resetData();
    setResetOpen(false);
    showToast('Sample data restored.');
  };

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div className="page-header__text">
          <span className="page-header__eyebrow">
            <Icon name="settings" size={16} />
            Workspace
          </span>
          <h1 className="md-headline-large">Settings</h1>
          <p className="md-body-large page-header__subtitle">
            Personalize the app and manage the data stored on this device.
          </p>
        </div>
      </header>

      <div className="settings-stack">
        <Card variant="outlined" className="settings-card">
          <div className="settings-heading">
            <div>
              <h2 className="md-title-large">Appearance</h2>
              <p className="md-body-medium text-muted">
                Theme follows Material 3 color roles and adapts every component.
              </p>
            </div>
          </div>

          <div className="theme-options" role="radiogroup" aria-label="Theme">
            {THEMES.map((theme) => (
              <label
                key={theme.value}
                className={`theme-option ${mode === theme.value ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={theme.value}
                  checked={mode === theme.value}
                  onChange={() => setMode(theme.value)}
                  className="sr-only"
                />
                <span
                  className={`theme-preview theme-preview--${theme.value}`}
                  aria-hidden="true"
                >
                  <span className="theme-preview__rail" />
                  <span className="theme-preview__heading" />
                  <span className="theme-preview__row theme-preview__row--one" />
                  <span className="theme-preview__row theme-preview__row--two" />
                </span>
                <span className="theme-option__label">
                  <Icon name={theme.icon} size={18} />
                  {theme.label}
                </span>
                <span className="theme-option__indicator" aria-hidden="true">
                  {mode === theme.value ? (
                    <Icon name="check" size={14} />
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card variant="outlined" className="settings-card">
          <div className="settings-heading">
            <div>
              <h2 className="md-title-large">Data</h2>
              <p className="md-body-medium text-muted">
                Invmage saves everything in this browser. Nothing leaves your
                device.
              </p>
            </div>
          </div>

          <div className="settings-rows">
            <div className="settings-row">
              <span className="settings-row__icon" aria-hidden="true">
                <Icon name="download" size={20} />
              </span>
              <div className="settings-row__text">
                <p className="md-title-small">Export backup</p>
                <p className="md-body-small text-muted">
                  Download {formatNumber(products.length)} products,{' '}
                  {formatNumber(suppliers.length)} suppliers, and{' '}
                  {formatNumber(movements.length)} movements as JSON.
                </p>
              </div>
              <Button variant="outlined" icon="download" onClick={handleExport}>
                Export
              </Button>
            </div>

            <div className="settings-row">
              <span className="settings-row__icon" aria-hidden="true">
                <Icon name="restart_alt" size={20} />
              </span>
              <div className="settings-row__text">
                <p className="md-title-small">Restore sample data</p>
                <p className="md-body-small text-muted">
                  Replace the current workspace with the original demo catalog.
                  This cannot be undone.
                </p>
              </div>
              <Button
                variant="text-danger"
                icon="restart_alt"
                onClick={() => setResetOpen(true)}
              >
                Reset
              </Button>
            </div>

            <div className="settings-row">
              <span className="settings-row__icon" aria-hidden="true">
                <Icon name="database" size={20} />
              </span>
              <div className="settings-row__text">
                <p className="md-title-small">Local storage</p>
                <p className="md-body-small text-muted">
                  {storageSize} KB used · saved automatically on this device
                </p>
              </div>
              <span className="settings-badge">
                <Icon name="check_circle" size={16} filled />
                Active
              </span>
            </div>
          </div>
        </Card>

        <Card variant="outlined" className="settings-card settings-about">
          <div className="about-brand">
            <span className="about-brand__mark" aria-hidden="true">
              <Icon name="inventory_2" size={26} filled />
            </span>
            <div>
              <h2 className="md-title-large">Invmage</h2>
              <p className="md-body-small text-muted">
                Version 1.0 · Built with React and Material 3
              </p>
            </div>
          </div>

          <p className="md-body-medium text-muted settings-about__copy">
            A small, focused inventory workspace. Components use Material 3
            color roles, type scale, shape, elevation, and motion tokens, with
            keyboard-friendly dialogs and reduced-motion support.
          </p>

          <div className="swatch-row">
            {SWATCHES.map((swatch) => (
              <div key={swatch.label} className="swatch">
                <span
                  className="swatch__color"
                  style={{ background: `var(${swatch.token})` }}
                  aria-hidden="true"
                />
                <span className="md-label-small text-muted">{swatch.label}</span>
              </div>
            ))}
          </div>

          <div className="settings-links">
            <a
              href="https://m3.material.io/"
              target="_blank"
              rel="noreferrer"
            >
              Material 3 guidelines
              <Icon name="open_in_new" size={16} />
            </a>
            <a
              href="https://developer.android.com/design"
              target="_blank"
              rel="noreferrer"
            >
              Android design
              <Icon name="open_in_new" size={16} />
            </a>
            <a
              href="https://developers.google.com/style"
              target="_blank"
              rel="noreferrer"
            >
              Google style guide
              <Icon name="open_in_new" size={16} />
            </a>
          </div>
        </Card>
      </div>

      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restore sample data?"
        description={`Your current workspace (${products.length} products) will be replaced.`}
        actions={
          <>
            <Button variant="text" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon="restart_alt" onClick={handleReset}>
              Reset workspace
            </Button>
          </>
        }
      >
        <div className="reset-summary">
          <Icon name="restart_alt" size={22} />
          <p className="md-body-small">
            This resets products, suppliers, and stock movements to the demo
            data. Export a backup first if you want to keep the current state.
            Last updated {formatDate(new Date())}.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
