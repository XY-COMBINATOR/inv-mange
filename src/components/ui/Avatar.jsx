import { initials } from '../../utils/format';

const TONES = ['violet', 'teal', 'pink', 'blue', 'amber'];

export function Avatar({ name = '', size = 40, tone, className = '' }) {
  const index = tone
    ? TONES.indexOf(tone)
    : [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      TONES.length;
  const resolvedTone = TONES[Math.max(0, index)];

  return (
    <span
      className={`md-avatar md-avatar--${resolvedTone} ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.round(size * 0.36)}px`,
      }}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  );
}
