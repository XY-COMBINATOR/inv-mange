import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Menu } from '../../components/ui/Menu';
import { Avatar } from '../../components/ui/Avatar';
import { SearchField } from '../../components/ui/SearchField';
import { EmptyState } from '../../components/ui/EmptyState';
import { SupplierDialog } from './SupplierDialog';
import { DeleteSupplierDialog } from './DeleteSupplierDialog';
import { useStore } from '../../store/StoreContext';
import { formatCurrencyCompact } from '../../utils/format';

export function SuppliersView() {
  const { suppliers, products } = useStore();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return suppliers
      .filter((supplier) =>
        [
          supplier.name,
          supplier.contactName,
          supplier.email,
          supplier.phone,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((supplier) => {
        const linked = products.filter(
          (product) => product.supplierId === supplier.id,
        );
        return {
          supplier,
          productCount: linked.length,
          stockValue: linked.reduce(
            (sum, product) => sum + product.price * product.quantity,
            0,
          ),
        };
      });
  }, [suppliers, products, search]);

  const supplierMenu = (supplier) => [
    { label: 'Edit supplier', icon: 'edit', onSelect: () => setEditing(supplier) },
    { divider: true },
    {
      label: 'Remove supplier',
      icon: 'delete',
      danger: true,
      onSelect: () => setDeleting(supplier),
    },
  ];

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div className="page-header__text">
          <span className="page-header__eyebrow">
            <Icon name="local_shipping" size={16} />
            Partners · {suppliers.length} suppliers
          </span>
          <h1 className="md-headline-large">Suppliers</h1>
          <p className="md-body-large page-header__subtitle">
            Contacts and lead times for every inventory partner.
          </p>
        </div>
        <div className="page-actions">
          <Button icon="add" onClick={() => setAddOpen(true)}>
            Add supplier
          </Button>
        </div>
      </header>

      <div className="suppliers-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search suppliers"
          placeholder="Search suppliers or contacts…"
          className="suppliers-search"
        />
      </div>

      {rows.length === 0 ? (
        <Card variant="outlined" className="suppliers-empty">
          <EmptyState
            icon={suppliers.length === 0 ? 'local_shipping' : 'search_off'}
            title={suppliers.length === 0 ? 'No suppliers yet' : 'No suppliers match'}
            description={
              suppliers.length === 0
                ? 'Add a partner to connect products with a source.'
                : 'Try a different name, contact, or email.'
            }
            action={
              suppliers.length === 0
                ? {
                    label: 'Add supplier',
                    icon: 'add',
                    onClick: () => setAddOpen(true),
                  }
                : {
                    label: 'Clear search',
                    icon: 'filter_alt_off',
                    onClick: () => setSearch(''),
                  }
            }
          />
        </Card>
      ) : (
        <div className="suppliers-grid">
          {rows.map(({ supplier, productCount, stockValue }) => (
            <Card
              key={supplier.id}
              variant="outlined"
              className="supplier-card"
              as="article"
            >
              <div className="supplier-card__header">
                <Avatar name={supplier.name} size={48} />
                <div className="supplier-card__identity">
                  <h2 className="md-title-medium">{supplier.name}</h2>
                  <p className="md-body-small text-muted">
                    {supplier.contactName || 'No contact person'}
                  </p>
                </div>
                <Menu
                  items={supplierMenu(supplier)}
                  label={`Actions for ${supplier.name}`}
                />
              </div>

              <dl className="supplier-details">
                <div className="supplier-details__row">
                  <dt>
                    <Icon name="mail" size={18} />
                    <span className="sr-only">Email</span>
                  </dt>
                  <dd>
                    {supplier.email ? (
                      <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                    ) : (
                      <span className="text-muted">Not provided</span>
                    )}
                  </dd>
                </div>
                <div className="supplier-details__row">
                  <dt>
                    <Icon name="call" size={18} />
                    <span className="sr-only">Phone</span>
                  </dt>
                  <dd>
                    {supplier.phone ? (
                      <a href={`tel:${supplier.phone.replace(/\s+/g, '')}`}>
                        {supplier.phone}
                      </a>
                    ) : (
                      <span className="text-muted">Not provided</span>
                    )}
                  </dd>
                </div>
                <div className="supplier-details__row">
                  <dt>
                    <Icon name="schedule" size={18} />
                    <span className="sr-only">Lead time</span>
                  </dt>
                  <dd>
                    {supplier.leadTime
                      ? `${supplier.leadTime} day${supplier.leadTime === 1 ? '' : 's'} lead time`
                      : 'Lead time not set'}
                  </dd>
                </div>
              </dl>

              <div className="supplier-card__footer">
                <span className="supplier-stat">
                  <Icon name="inventory_2" size={16} />
                  <strong>{productCount}</strong>{' '}
                  {productCount === 1 ? 'product' : 'products'}
                </span>
                <span className="supplier-stat text-muted">
                  {formatCurrencyCompact(stockValue)} in stock
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SupplierDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <SupplierDialog
        open={Boolean(editing)}
        supplier={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteSupplierDialog
        open={Boolean(deleting)}
        supplier={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
