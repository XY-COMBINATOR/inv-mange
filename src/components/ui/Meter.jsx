export function Meter({ value, tone = 'primary', label, className = '' }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`md-meter md-meter--${tone} ${className}`.trim()}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
    >
      <span className="md-meter__track">
        <span className="md-meter__fill" style={{ width: `${clamped}%` }} />
      </span>
    </div>
  );
}
