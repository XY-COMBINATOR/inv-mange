import { Icon } from './Icon';

export function IconButton({
  icon,
  label,
  variant = 'standard',
  size = 'medium',
  filled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'md-icon-button',
        `md-icon-button--${variant}`,
        size === 'small' ? 'md-icon-button--small' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <Icon name={icon} size={size === 'small' ? 20 : 24} filled={filled} />
    </button>
  );
}
