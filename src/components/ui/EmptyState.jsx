import { Icon } from './Icon';
import { Button } from './Button';

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="md-empty">
      <span className="md-empty__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="md-title-medium">{title}</h3>
      {description ? (
        <p className="md-body-medium text-muted md-empty__description">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button
          variant="tonal"
          icon={action.icon}
          onClick={action.onClick}
          className="md-empty__action"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
