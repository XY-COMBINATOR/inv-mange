import { NavLink } from 'react-router-dom';
import { ALL_NAV_ITEMS } from '../../navigation';
import { Icon } from '../ui/Icon';

export function BottomNav({ onOpenAI }) {
  return (
    <nav className="app-bottomnav" aria-label="Primary">
      {ALL_NAV_ITEMS.map((item) => (
        item.action ? (
          <button
            key={item.action}
            type="button"
            className="app-bottomnav__item app-bottomnav__action"
            onClick={item.action === 'open-ai' ? onOpenAI : undefined}
          >
            <span className="app-bottomnav__indicator">
              <Icon name={item.icon} size={24} />
            </span>
            <span className="app-bottomnav__label md-label-medium">
              {item.label}
            </span>
          </button>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `app-bottomnav__item ${isActive ? 'is-active' : ''}`
            }
          >
            <span className="app-bottomnav__indicator">
              <Icon name={item.icon} size={24} />
            </span>
            <span className="app-bottomnav__label md-label-medium">
              {item.label}
            </span>
          </NavLink>
        )
      ))}
    </nav>
  );
}
