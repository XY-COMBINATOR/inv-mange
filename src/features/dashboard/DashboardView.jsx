import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { StockBadge } from '../../components/ui/StockBadge';
import { Meter } from '../../components/ui/Meter';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductDialog } from '../inventory/ProductDialog';
import { StockDialog } from '../inventory/StockDialog';
import { useStore } from '../../store/StoreContext';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatRelative,
  signedNumber,
  todayLong,
} from '../../utils/format';
import { getStockStatus, valueByCategory } from '../../utils/stock';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView() {
  const { products, movements, suppliers } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [stockDialog, setStockDialog] = useState({ open: false, productId: '' });

  const stats = useMemo(() => {
    const value = products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0,
    );
    const cost = products.reduce(
      (sum, product) => sum + product.cost * product.quantity,
      0,
    );
    const units = products.reduce((sum, product) => sum + product.quantity, 0);
    const low = products.filter(
      (product) => getStockStatus(product).key === 'low',
    );
    const out = products.filter(
      (product) => getStockStatus(product).key === 'out',
    );
    const healthy = products.length - low.length - out.length;
    return { value, cost, units, low, out, healthy };
  }, [products]);

  const attention = useMemo(() => {
    const rank = { out: 0, low: 1, in: 2 };
    return products
      .filter((product) => getStockStatus(product).key !== 'in')
      .sort((a, b) => {
        const byStatus = rank[getStockStatus(a).key] - rank[getStockStatus(b).key];
        if (byStatus !== 0) return byStatus;
        return a.quantity - b.quantity;
      })
      .slice(0, 4);
  }, [products]);

  const categories = useMemo(() => valueByCategory(products).slice(0, 5), [products]);
  const categoryCount = useMemo(
    () => new Set(products.map((product) => product.category)).size,
    [products],
  );
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const recent = useMemo(
    () =>
      [...movements]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [movements],
  );

  const total = products.length;
  const pct = (count) => (total === 0 ? 0 : Math.round((count / total) * 100));
  const healthyPct = pct(stats.healthy);
  const lowPct = pct(stats.low.length);
  const outPct = pct(stats.out.length);

  const kpis = [
    {
      label: 'Inventory value',
      value: formatCurrencyCompact(stats.value),
      detail: `${formatCurrency(stats.cost)} at cost`,
      icon: 'account_balance_wallet',
      tone: 'primary',
    },
    {
      label: 'Units in stock',
      value: formatNumber(stats.units),
      detail: `Across ${categoryCount} categories`,
      icon: 'inventory_2',
      tone: 'neutral',
    },
    {
      label: 'Low stock',
      value: formatNumber(stats.low.length),
      detail: stats.low.length ? 'Reorder soon' : 'All above reorder point',
      icon: 'warning',
      tone: 'warning',
    },
    {
      label: 'Out of stock',
      value: formatNumber(stats.out.length),
      detail: stats.out.length ? 'Unavailable to sell' : 'Nothing unavailable',
      icon: 'production_quantity_limits',
      tone: 'error',
    },
  ];

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div className="page-header__text">
          <span className="page-header__eyebrow">
            <Icon name="calendar_today" size={16} />
            {todayLong()}
          </span>
          <h1 className="md-headline-large">
            {greeting()}, Jignesh
          </h1>
          <p className="md-body-large page-header__subtitle">
            Here is how your inventory is doing today.
          </p>
        </div>
        <div className="page-actions">
          <Button
            variant="tonal"
            icon="swap_vert"
            onClick={() => setStockDialog({ open: true, productId: '' })}
          >
            Record stock
          </Button>
          <Button icon="add" onClick={() => setAddOpen(true)}>
            Add product
          </Button>
        </div>
      </header>

      <section className="kpi-grid" aria-label="Inventory overview">
        {kpis.map((kpi) => (
          <Card key={kpi.label} variant="outlined" className="kpi-card">
            <div className="kpi-card__top">
              <span className={`kpi-card__icon kpi-card__icon--${kpi.tone}`}>
                <Icon name={kpi.icon} size={22} />
              </span>
              <span className="kpi-card__label">{kpi.label}</span>
            </div>
            <div className="kpi-card__bottom">
              <span className="kpi-card__value">{kpi.value}</span>
              <span className="md-body-small text-muted">{kpi.detail}</span>
            </div>
          </Card>
        ))}
      </section>

      <div className="dash-grid">
        <div className="dash-column">
          <Card variant="outlined" className="dash-card">
            <div className="dash-card__header">
              <div>
                <h2 className="md-title-large">Stock health</h2>
                <p className="md-body-small text-muted">
                  {total} products across your catalog
                </p>
              </div>
              <Link to="/inventory" className="section__link">
                View inventory
                <Icon name="arrow_forward" size={18} />
              </Link>
            </div>

            <div className="health-body">
              <div
                className="health-donut"
                role="img"
                aria-label={`${stats.healthy} products in stock, ${stats.low.length} low stock, ${stats.out.length} out of stock`}
              >
                <div
                  className="health-donut__ring"
                  style={{
                    background:
                      total === 0
                        ? 'var(--md-sys-color-surface-container-highest)'
                        : `conic-gradient(
                            var(--md-sys-color-success) 0% ${healthyPct}%,
                            var(--md-sys-color-warning) ${healthyPct}% ${healthyPct + lowPct}%,
                            var(--md-sys-color-error) ${healthyPct + lowPct}% 100%
                          )`,
                  }}
                >
                  <div className="health-donut__hole">
                    <span className="health-donut__value">{stats.healthy}</span>
                    <span className="health-donut__label md-body-small">
                      healthy
                    </span>
                  </div>
                </div>
              </div>

              <ul className="health-legend">
                <li className="health-legend__row">
                  <span className="health-dot health-dot--success" />
                  <span className="health-legend__name">In stock</span>
                  <span className="health-legend__count">
                    {stats.healthy}
                    <span className="text-muted"> · {healthyPct}%</span>
                  </span>
                </li>
                <li className="health-legend__row">
                  <span className="health-dot health-dot--warning" />
                  <span className="health-legend__name">Low stock</span>
                  <span className="health-legend__count">
                    {stats.low.length}
                    <span className="text-muted"> · {lowPct}%</span>
                  </span>
                </li>
                <li className="health-legend__row">
                  <span className="health-dot health-dot--error" />
                  <span className="health-legend__name">Out of stock</span>
                  <span className="health-legend__count">
                    {stats.out.length}
                    <span className="text-muted"> · {outPct}%</span>
                  </span>
                </li>
                <li className="health-legend__meta md-body-small text-muted">
                  {suppliers.length} active suppliers · {formatNumber(stats.units)}{' '}
                  units on hand
                </li>
              </ul>
            </div>
          </Card>

          <Card variant="outlined" className="dash-card">
            <div className="dash-card__header">
              <div>
                <h2 className="md-title-large">Needs attention</h2>
                <p className="md-body-small text-muted">
                  At or below the reorder point
                </p>
              </div>
              <span className="count-pill">{attention.length > 0 ? `${stats.low.length + stats.out.length} items` : 'All clear'}</span>
            </div>

            {attention.length === 0 ? (
              <EmptyState
                icon="check_circle"
                title="Everything is stocked"
                description="No products are below their reorder point."
              />
            ) : (
              <ul className="attention-list">
                {attention.map((product) => (
                  <li key={product.id} className="attention-row">
                    <div className="attention-row__main">
                      <StockBadge product={product} showLabel={false} />
                      <div className="attention-row__text">
                        <span className="md-title-small">{product.name}</span>
                        <span className="md-body-small text-muted">
                          {product.quantity} on hand · reorder at{' '}
                          {product.reorderPoint}
                        </span>
                      </div>
                    </div>
                    <IconButton
                      icon="add"
                      label={`Record stock for ${product.name}`}
                      variant="tonal"
                      onClick={() =>
                        setStockDialog({ open: true, productId: product.id })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="dash-column">
          <Card variant="outlined" className="dash-card">
            <div className="dash-card__header">
              <div>
                <h2 className="md-title-large">Value by category</h2>
                <p className="md-body-small text-muted">
                  Retail value at current stock
                </p>
              </div>
            </div>
            {categories.length === 0 ? (
              <p className="md-body-medium text-muted">No inventory yet.</p>
            ) : (
              <ul className="category-list">
                {categories.map((row) => (
                  <li key={row.category} className="category-row">
                    <div className="category-row__top">
                      <span className="md-body-medium">{row.category}</span>
                      <span className="md-title-small">
                        {formatCurrencyCompact(row.value)}
                      </span>
                    </div>
                    <Meter
                      value={row.share * 100}
                      label={`${row.category} share of inventory value`}
                      tone="primary"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="outlined" className="dash-card">
            <div className="dash-card__header">
              <div>
                <h2 className="md-title-large">Recent activity</h2>
                <p className="md-body-small text-muted">Latest stock changes</p>
              </div>
              <Link to="/movements" className="section__link">
                View all
                <Icon name="arrow_forward" size={18} />
              </Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon="history"
                title="No movements yet"
                description="Stock changes will appear here."
              />
            ) : (
              <ul className="activity-list">
                {recent.map((movement) => {
                  const product = productsById.get(movement.productId);
                  return (
                    <li key={movement.id} className="activity-row">
                      <span
                        className={`activity-row__icon activity-row__icon--${movement.type}`}
                        aria-hidden="true"
                      >
                        <Icon
                          name={
                            movement.type === 'receive'
                              ? 'add'
                              : movement.type === 'issue'
                                ? 'remove'
                                : 'tune'
                          }
                          size={18}
                        />
                      </span>
                      <div className="activity-row__body">
                        <span className="md-body-medium">
                          {product?.name ?? 'Removed product'}
                        </span>
                        <span className="md-body-small text-muted">
                          {movement.reason} · {formatRelative(movement.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`activity-row__delta ${movement.delta > 0 ? 'is-positive' : 'is-negative'}`}
                      >
                        {signedNumber(movement.delta)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ProductDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <StockDialog
        open={stockDialog.open}
        initialProductId={stockDialog.productId}
        onClose={() => setStockDialog({ open: false, productId: '' })}
      />
    </div>
  );
}
