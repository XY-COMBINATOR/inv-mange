import { useId } from 'react';
import { Icon } from './Icon';

export function SelectField({
  label,
  id: idProp,
  error = '',
  supportingText = '',
  options = [],
  placeholder,
  leadingIcon,
  className = '',
  required = false,
  value,
  ...props
}) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const supportId = `${id}-support`;
  const message = error || supportingText;
  const filled = value !== undefined && value !== '';

  return (
    <div
      className={`md-field md-field--select ${error ? 'is-error' : ''} ${className}`.trim()}
      data-filled={filled}
    >
      <div className="md-field__container">
        {leadingIcon ? (
          <Icon name={leadingIcon} size={20} className="md-field__leading" />
        ) : null}
        <select
          id={id}
          value={value}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={message ? supportId : undefined}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label htmlFor={id}>
          {label}
          {required ? (
            <span className="md-field__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
        <Icon name="arrow_drop_down" size={24} className="md-field__chevron" />
      </div>
      {message ? (
        <p
          id={supportId}
          className={`md-field__support ${error ? 'md-field__support--error' : ''}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
