import { Icon } from './Icon';

export function SegmentedButton({
  options,
  value,
  onChange,
  label,
  className = '',
}) {
  return (
    <div
      className={`md-segmented ${className}`.trim()}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={`md-segmented__item ${selected ? 'is-selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {selected ? <Icon name="check" size={18} /> : null}
            {option.icon ? <Icon name={option.icon} size={18} /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
