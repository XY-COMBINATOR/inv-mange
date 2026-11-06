import { Icon } from './Icon';

export function Chip({
  children,
  selected = false,
  icon,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={['md-chip', selected ? 'is-selected' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {selected ? <Icon name="check" size={18} /> : null}
      {!selected && icon ? <Icon name={icon} size={18} /> : null}
      <span>{children}</span>
    </button>
  );
}
