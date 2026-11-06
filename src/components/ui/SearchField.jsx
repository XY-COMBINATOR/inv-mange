import { useId } from 'react';
import { Icon } from './Icon';

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  label = 'Search',
  className = '',
  autoFocus = false,
}) {
  const id = useId();

  return (
    <div className={`md-search ${className}`.trim()} role="search">
      <Icon name="search" size={24} className="md-search__icon" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value ? (
        <button
          type="button"
          className="md-search__clear"
          aria-label="Clear search"
          onClick={() => onChange('')}
        >
          <Icon name="close" size={20} />
        </button>
      ) : null}
    </div>
  );
}
