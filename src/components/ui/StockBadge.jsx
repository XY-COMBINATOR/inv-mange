import { Icon } from './Icon';
import { getStockStatus } from '../../utils/stock';

export function StockBadge({ product, showLabel = true }) {
  const status = getStockStatus(product);
  return (
    <span
      className={`stock-badge stock-badge--${status.tone}`}
      aria-label={status.label}
      title={status.label}
    >
      <Icon name={status.icon} size={16} filled />
      {showLabel ? <span>{status.label}</span> : null}
    </span>
  );
}
