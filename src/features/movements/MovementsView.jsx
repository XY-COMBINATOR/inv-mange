import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Icon';
import { SearchField } from '../../components/ui/SearchField';
import { EmptyState } from '../../components/ui/EmptyState';
import { StockDialog } from '../inventory/StockDialog';
import { useStore } from '../../store/StoreContext';
import {
  formatDate,
  formatNumber,
  formatTime,
  signedNumber,
} from '../../utils/format';
import { MOVEMENT_TYPE_META } from '../../utils/stock';

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'receive', label: 'Received' },
  { value: 'issue', label: 'Issued' },
  { value: 'adjust', label: 'Adjusted' },
];

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(value);
}

export function MovementsView() {
  const { movements, products } = useStore();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [stockOpen, setStockOpen] = useState(false);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const counts = useMemo(() => {
    const result = { all: movements.length, receive: 0, issue: 0, adjust: 0 };
    for (const movement of movements) result[movement.type] += 1;
    return result;
  }, [movements]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...movements]
      .filter((movement) => {
        if (type !== 'all' && movement.type !== type) return false;
        if (!term) return true;
        const product = productsById.get(movement.productId);
        return [
          product?.name ?? '',
          product?.sku ?? '',
          movement.reason,
          movement.note,
          movement.by,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [movements, type, search, productsById]);

  const groups = useMemo(() => {
    const result = [];
    for (const movement of filtered) {
      const label = dayLabel(movement.createdAt);
      const last = result.at(-1);
      if (last && last.label === label) {
        last.items.push(movement);
      } else {
        result.push({ label, items: [movement] });
      }
    }
    return result;
  }, [filtered]);

  const hasFilters = Boolean(search.trim()) || type !== 'all';

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div className="page-header__text">
          <span className="page-header__eyebrow">
            <Icon name="history" size={16} />
            Audit trail · {movements.length} movements
          </span>
          <h1 className="md-headline-large">Stock movements</h1>
          <p className="md-body-large page-header__subtitle">
            Every receive, issue, and adjustment in one place.
          </p>
        </div>
        <div className="page-actions">
          <Button icon="swap_vert" onClick={() => setStockOpen(true)}>
            Record stock
          </Button>
        </div>
      </header>

      <div className="movements-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search stock movements"
          placeholder="Search product, reason, or note…"
          className="movements-search"
        />
        <div
          className="status-filters"
          role="group"
          aria-label="Filter by movement type"
        >
          {TYPE_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              selected={type === filter.value}
              onClick={() => setType(filter.value)}
            >
              {filter.label}
              <span className="chip-count">{counts[filter.value]}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="inventory-meta">
        <p className="md-body-medium text-muted" aria-live="polite">
          Showing <strong>{filtered.length}</strong> of {movements.length}{' '}
          movements
        </p>
        {hasFilters ? (
          <Button
            variant="text"
            size="small"
            icon="filter_alt_off"
            onClick={() => {
              setSearch('');
              setType('all');
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <Card variant="outlined" className="movements-panel">
        {filtered.length === 0 ? (
          <EmptyState
            icon={movements.length === 0 ? 'history' : 'search_off'}
            title={
              movements.length === 0
                ? 'No movements yet'
                : 'No movements match'
            }
            description={
              movements.length === 0
                ? 'Record your first stock movement to start the audit trail.'
                : 'Try another search term or clear the filters.'
            }
            action={
              movements.length === 0
                ? {
                    label: 'Record stock',
                    icon: 'swap_vert',
                    onClick: () => setStockOpen(true),
                  }
                : {
                    label: 'Clear filters',
                    icon: 'filter_alt_off',
                    onClick: () => {
                      setSearch('');
                      setType('all');
                    },
                  }
            }
          />
        ) : (
          groups.map((group) => (
            <section key={group.label} className="movement-group">
              <h2 className="movement-group__label md-label-medium">
                {group.label}
              </h2>
              <ul className="movement-list">
                {group.items.map((movement) => {
                  const product = productsById.get(movement.productId);
                  const meta = MOVEMENT_TYPE_META[movement.type];
                  return (
                    <li key={movement.id} className="movement-row">
                      <span
                        className={`movement-row__icon movement-row__icon--${movement.type}`}
                        aria-hidden="true"
                      >
                        <Icon name={meta.icon} size={20} />
                      </span>
                      <div className="movement-row__body">
                        <div className="movement-row__title">
                          <span className="movement-row__product md-title-small">
                            {product?.name ?? 'Removed product'}
                          </span>
                          <span
                            className={`movement-type movement-type--${movement.type}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="movement-row__detail md-body-small">
                          {product?.sku ? `${product.sku} · ` : ''}
                          {movement.reason}
                          {movement.note ? ` · ${movement.note}` : ''}
                        </p>
                        <p className="movement-row__meta md-body-small text-muted">
                          {formatTime(movement.createdAt)} · {movement.by}
                        </p>
                      </div>
                      <div className="movement-row__amount">
                        <span
                          className={`movement-row__delta ${movement.delta > 0 ? 'is-positive' : movement.delta < 0 ? 'is-negative' : ''}`}
                        >
                          {signedNumber(movement.delta)}
                        </span>
                        <span className="movement-row__stock md-body-small text-muted">
                          {formatNumber(movement.resultingStock)} units on hand
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </Card>

      <StockDialog open={stockOpen} onClose={() => setStockOpen(false)} />
    </div>
  );
}
