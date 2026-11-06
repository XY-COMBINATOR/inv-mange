export function Card({
  children,
  variant = 'filled',
  as: Tag = 'div',
  className = '',
  ...props
}) {
  return (
    <Tag
      className={['md-card', `md-card--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Tag>
  );
}
