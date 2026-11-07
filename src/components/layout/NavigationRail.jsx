import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SETTINGS_ITEM } from '../../navigation';
import { Icon } from '../ui/Icon';

function RailItem({ item, onClick, collapsed }) {
  const className = 'app-rail__item';
  const content = (
    <>
      <span className="app-rail__indicator">
        <Icon name={item.icon} size={24} />
      </span>
      {!collapsed && (
        <span className="app-rail__label md-label-medium">{item.label}</span>
      )}
    </>
  );

  if (item.action) {
    return (
      <button
        type="button"
        className={`${className} app-rail__action`}
        onClick={onClick}
        title={item.label}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `${className} ${isActive ? 'is-active' : ''}`
      }
      title={item.label}
    >
      {content}
    </NavLink>
  );
}

export function NavigationRail({ onOpenAI, open = false, collapsed = false }) {
  return (
    <nav
      className={`app-rail ${open ? 'is-open' : ''} ${
        collapsed ? 'is-collapsed' : ''
      }`}
      aria-label="Primary"
    >
      <div className="app-rail__brand" aria-hidden="true">
        <Icon name="inventory_2" size={26} filled />
      </div>

      <div className="app-rail__items">
        {NAV_ITEMS.map((item) => (
          <RailItem
            key={item.to ?? item.action}
            item={item}
            collapsed={collapsed}
            onClick={item.action === 'open-ai' ? onOpenAI : undefined}
          />
        ))}
      </div>

      <div className="app-rail__footer">
        <span className="app-rail__divider" aria-hidden="true" />
        <RailItem item={SETTINGS_ITEM} collapsed={collapsed} />
      </div>
    </nav>
  );
}
