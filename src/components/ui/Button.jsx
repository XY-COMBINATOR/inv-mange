import { Icon } from './Icon';

export function Button({
  children,
  variant = 'filled',
  size = 'medium',
  icon,
  trailingIcon,
  type = 'button',
  className = '',
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'md-button',
        `md-button--${variant}`,
        size === 'small' ? 'md-button--small' : '',
        fullWidth ? 'md-button--full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
      {trailingIcon ? <Icon name={trailingIcon} size={18} /> : null}
    </button>
  );
}
