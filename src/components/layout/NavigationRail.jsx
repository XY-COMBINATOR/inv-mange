import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, SETTINGS_ITEM } from '../../navigation';
import { Icon } from '../ui/Icon';

function RailItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `app-rail__item ${isActive ? 'is-active' : ''}`
      }
      title={item.label}
    >
      <span className="app-rail__indicator">
        <Icon name={item.icon} size={24} />
      </span>
      <span className="app-rail__label md-label-medium">{item.label}</span>
    </NavLink>
  );
}

export function NavigationRail() {
  return (
    <nav className="app-rail" aria-label="Primary">
      <div className="app-rail__brand" aria-hidden="true">
        <Icon name="inventory_2" size={26} filled />
      </div>

      <div className="app-rail__items">
        {NAV_ITEMS.map((item) => (
          <RailItem key={item.to} item={item} />
        ))}
      </div>

      <div className="app-rail__footer">
        <span className="app-rail__divider" aria-hidden="true" />
        <RailItem item={SETTINGS_ITEM} />
      </div>
    </nav>
  );
}
