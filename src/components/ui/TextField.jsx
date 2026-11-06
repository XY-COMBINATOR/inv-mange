import { useId } from 'react';
import { Icon } from './Icon';

export function TextField({
  label,
  id: idProp,
  error = '',
  supportingText = '',
  leadingIcon,
  trailing,
  className = '',
  required = false,
  ...props
}) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const supportId = `${id}-support`;
  const message = error || supportingText;

  return (
    <div className={`md-field ${error ? 'is-error' : ''} ${className}`.trim()}>
      <div className="md-field__container">
        {leadingIcon ? (
          <Icon name={leadingIcon} size={20} className="md-field__leading" />
        ) : null}
        <input
          id={id}
          placeholder=" "
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={message ? supportId : undefined}
          {...props}
        />
        <label htmlFor={id}>
          {label}
          {required ? (
            <span className="md-field__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
        {trailing ? <div className="md-field__trailing">{trailing}</div> : null}
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
