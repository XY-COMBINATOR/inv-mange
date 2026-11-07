import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { Menu } from '../../components/ui/Menu';
import { SearchField } from '../../components/ui/SearchField';
import { StockBadge } from '../../components/ui/StockBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProductDialog } from './ProductDialog';
import { StockDialog } from './StockDialog';
import { DeleteProductDialog } from './DeleteProductDialog';
import { useStore } from '../../store/StoreContext';
import { formatCurrency, formatNumber, formatRelative } from '../../utils/format';
import { getStockStatus } from '../../utils/stock';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name · A to Z' },
  { value: 'name-desc', label: 'Name · Z to A' },
  { value: 'stock-asc', label: 'Stock · low to high' },
  { value: 'stock-desc', label: 'Stock · high to low' },
  { value: 'value-desc', label: 'Value · high to low' },
  { value: 'updated-desc', label: 'Recently updated' },
];

function FilterSelect({ label, icon, value, onChange, options }) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="filter-select">
      <Icon name={icon} size={18} className="filter-select__icon" />
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name="arrow_drop_down" size={20} className="filter-select__chevron" />
    </div>
  );
}

export function InventoryView() {
  const { products, suppliers, itemGroups = [] } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGroup = searchParams.get('group') || 'all';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState(initialGroup);
  const [sort, setSort] = useState('name-asc');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [stockProductId, setStockProductId] = useState('');
  const [stockOpen, setStockOpen] = useState(false);

  useEffect(() => {
    const g = searchParams.get('group');
    if (g) setCategory(g);
  }, [searchParams]);

  const groupsById = useMemo(
    () => new Map(itemGroups.map((g) => [g.id, g])),
    [itemGroups],
  );

  const groupsByName = useMemo(
    () => new Map(itemGroups.map((g) => [g.name.toLowerCase(), g])),
    [itemGroups],
  );

  const suppliersById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  const categories = useMemo(() => {
    const names = new Set();
    itemGroups.forEach((g) => names.add(g.name));
    products.forEach((p) => {
      if (p.category) names.add(p.category);
    });
    return [...names].sort();
  }, [itemGroups, products]);

  const statusCounts = useMemo(() => {
    const counts = { all: products.length, in: 0, low: 0, out: 0 };
    for (const product of products) counts[getStockStatus(product).key] += 1;
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = products.filter((product) => {
      if (status !== 'all' && getStockStatus(product).key !== status) {
        return false;
      }
      if (category !== 'all' && product.category !== category) return false;
      if (!term) return true;
      const supplier = suppliersById.get(product.supplierId);
      return [product.name, product.sku, product.category, supplier?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term);
    });

    const sorters = {
      'name-asc': (a, b) => a.name.localeCompare(b.name),
      'name-desc': (a, b) => b.name.localeCompare(a.name),
      'stock-asc': (a, b) => a.quantity - b.quantity,
      'stock-desc': (a, b) => b.quantity - a.quantity,
      'value-desc': (a, b) => b.price * b.quantity - a.price * a.quantity,
      'updated-desc': (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    };

    return result.sort(sorters[sort]);
  }, [products, status, category, search, sort, suppliersById]);

  const hasFilters = Boolean(search.trim()) || status !== 'all' || category !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
  };

  const openStock = (productId = '') => {
    setStockProductId(productId);
    setStockOpen(true);
  };

  const rowMenu = (product) => [
    { label: 'Edit details', icon: 'edit', onSelect: () => setEditing(product) },
    {
      label: 'Record stock',
      icon: 'swap_vert',
      onSelect: () => openStock(product.id),
    },
    { divider: true },
    {
      label: 'Delete product',
      icon: 'delete',
      danger: true,
      onSelect: () => setDeleting(product),
    },
  ];

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div className="page-header__text">
          <span className="page-header__eyebrow">
            <Icon name="inventory_2" size={16} />
            Catalog · {products.length} products
          </span>
          <h1 className="md-headline-large">Inventory</h1>
          <p className="md-body-large page-header__subtitle">
            Search, filter, and keep every stock level accurate.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="tonal" icon="swap_vert" onClick={() => openStock()}>
            Record stock
          </Button>
          <Button icon="add" onClick={() => setAddOpen(true)}>
            Add product
          </Button>
        </div>
      </header>

      <div className="inventory-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search products"
          placeholder="Search products, SKUs, suppliers…"
          className="inventory-search"
        />

        <div className="inventory-toolbar__filters">
          <div
            className="status-filters"
            role="group"
            aria-label="Filter by stock status"
          >
            {STATUS_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                selected={status === filter.value}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
                <span className="chip-count">
                  {statusCounts[filter.value]}
                </span>
              </Chip>
            ))}
          </div>

          <div className="toolbar-selects">
            <FilterSelect
              label="Category"
              icon="category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'all', label: 'All categories' },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
            />
            <FilterSelect
              label="Sort order"
              icon="sort"
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
            />
          </div>
        </div>
      </div>

      <div className="inventory-meta">
        <p className="md-body-medium text-muted" aria-live="polite">
          Showing <strong>{filtered.length}</strong> of {products.length}{' '}
          products
        </p>
        {hasFilters ? (
          <Button variant="text" size="small" icon="filter_alt_off" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <Card variant="outlined" className="inventory-panel">
        {filtered.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No products match"
            description={
              hasFilters
                ? 'Try a different search term or clear the filters.'
                : 'Add your first product to start tracking stock.'
            }
            action={
              hasFilters
                ? { label: 'Clear filters', icon: 'filter_alt_off', onClick: clearFilters }
                : { label: 'Add product', icon: 'add', onClick: () => setAddOpen(true) }
            }
          />
        ) : (
          <>
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <caption className="sr-only">
                  Inventory products with stock status, value, and actions
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col" className="cell-category">
                      Category
                    </th>
                    <th scope="col">Stock</th>
                    <th scope="col" className="cell-numeric cell-unit">
                      Unit price
                    </th>
                    <th scope="col" className="cell-numeric">
                      Value
                    </th>
                    <th scope="col">Supplier</th>
                    <th scope="col">Updated</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const supplier = suppliersById.get(product.supplierId);
                    const group =
                      groupsById.get(product.groupId) ||
                      groupsByName.get(product.category?.toLowerCase());
                    return (
                      <tr key={product.id}>
                        <td className="cell-product">
                          <div className="product-cell">
                            <span className="product-cell__name md-title-small">
                              {product.name}
                            </span>
                            <span className="product-cell__meta md-body-small text-muted">
                              {product.sku}
                              {product.location ? ` · ${product.location}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="cell-category">
                          <span className="category-tag">
                            {group && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: group.color,
                                  marginRight: 6,
                                }}
                              />
                            )}
                            {product.category}
                          </span>
                        </td>
                        <td>
                          <div className="stock-cell">
                            <span className="stock-cell__qty">
                              {formatNumber(product.quantity)}
                            </span>
                            <StockBadge product={product} />
                          </div>
                        </td>
                        <td className="cell-numeric cell-unit">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="cell-numeric cell-strong">
                          {formatCurrency(product.price * product.quantity)}
                        </td>
                        <td className="cell-supplier">
                          <span className="truncate">
                            {supplier?.name ?? 'No supplier'}
                          </span>
                        </td>
                        <td className="cell-updated">
                          {formatRelative(product.updatedAt)}
                        </td>
                        <td className="cell-actions">
                          <div className="row-actions">
                            <IconButton
                              icon="add"
                              label={`Record stock for ${product.name}`}
                              size="small"
                              variant="tonal"
                              onClick={() => openStock(product.id)}
                            />
                            <Menu
                              items={rowMenu(product)}
                              label={`Actions for ${product.name}`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="inventory-cards">
              {filtered.map((product) => {
                const supplier = suppliersById.get(product.supplierId);
                return (
                  <li key={product.id} className="inventory-card">
                    <div className="inventory-card__top">
                      <div className="product-cell">
                        <span className="product-cell__name md-title-small">
                          {product.name}
                        </span>
                        <span className="product-cell__meta md-body-small text-muted">
                          {product.sku} · {product.category}
                        </span>
                      </div>
                      <Menu
                        items={rowMenu(product)}
                        label={`Actions for ${product.name}`}
                      />
                    </div>
                    <div className="inventory-card__stock">
                      <span className="stock-cell__qty">
                        {formatNumber(product.quantity)}
                      </span>
                      <span className="md-body-small text-muted">units</span>
                      <StockBadge product={product} />
                    </div>
                    <div className="inventory-card__meta md-body-small text-muted">
                      <span>{supplier?.name ?? 'No supplier'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatCurrency(product.price)} each</span>
                    </div>
                    <div className="inventory-card__footer">
                      <span className="inventory-card__value">
                        {formatCurrency(product.price * product.quantity)}
                      </span>
                      <Button
                        variant="tonal"
                        size="small"
                        icon="add"
                        onClick={() => openStock(product.id)}
                      >
                        Restock
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <button
        type="button"
        className="md-fab app-fab"
        onClick={() => setAddOpen(true)}
        aria-label="Add product"
      >
        <Icon name="add" size={24} />
        Add product
      </button>

      <ProductDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <ProductDialog
        open={Boolean(editing)}
        product={editing}
        onClose={() => setEditing(null)}
      />
      <StockDialog
        open={stockOpen}
        initialProductId={stockProductId}
        onClose={() => {
          setStockOpen(false);
          setStockProductId('');
        }}
      />
      <DeleteProductDialog
        open={Boolean(deleting)}
        product={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
