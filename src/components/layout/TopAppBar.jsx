import { useLocation } from 'react-router-dom';
import { ROUTE_TITLES } from '../../navigation';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { Avatar } from '../ui/Avatar';
import { useTheme } from '../../store/ThemeContext';
import { useStore } from '../../store/StoreContext';

export function TopAppBar() {
  const { resolvedTheme, toggle } = useTheme();
  const { dbStatus } = useStore();
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] ?? 'Invmage';

  return (
    <header className="app-topbar">
      <div className="app-topbar__inner">
        <div className="app-brand">
          <span className="app-brand__mark" aria-hidden="true">
            <Icon name="inventory_2" size={22} filled />
          </span>
          <span className="app-brand__name">
            <span className="app-brand__invmage md-title-medium">Invmage</span>
            <span className="app-brand__page md-body-small text-muted">
              {title}
            </span>
          </span>
        </div>

        <div className="app-topbar__actions">
          <span
            className={`db-status-pill ${dbStatus?.connected ? 'is-connected' : ''}`}
            title={dbStatus?.message || dbStatus?.type}
          >
            <Icon name="database" size={14} />
            <span>{dbStatus?.connected ? 'PostgreSQL' : 'PG Ready'}</span>
          </span>

          <IconButton
            icon={resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
            label={
              resolvedTheme === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            onClick={toggle}
          />
          <span className="app-topbar__divider" aria-hidden="true" />
          <span className="app-topbar__user" title="Jignesh Patel">
            <Avatar name="Jignesh Patel" size={36} />
          </span>
        </div>
      </div>
    </header>
  );
}
