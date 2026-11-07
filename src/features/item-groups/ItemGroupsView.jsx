import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { Menu } from '../../components/ui/Menu';
import { SearchField } from '../../components/ui/SearchField';
import { EmptyState } from '../../components/ui/EmptyState';
import { ItemGroupDialog } from './ItemGroupDialog';
import { DeleteItemGroupDialog } from './DeleteItemGroupDialog';
import { useStore } from '../../store/StoreContext';
import { formatCurrency, formatNumber } from '../../utils/format';
import './item-groups.css';

export function ItemGroupsView() {
  const { itemGroups = [], products = [] } = useStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Calculate metrics per group
  const groupMetrics = useMemo(() => {
    const map = new Map();
    for (const group of itemGroups) {
      map.set(group.id, {
        itemCount: 0,
        totalQuantity: 0,
        totalValue: 0,
        lowStockCount: 0,
      });
    }

    for (const p of products) {
      // match by groupId or fallback to group name matching category
      let g = itemGroups.find(
        (group) =>
          group.id === p.groupId ||
          group.name.toLowerCase() === p.category?.toLowerCase()
      );
      if (g) {
        const curr = map.get(g.id);
        if (curr) {
          curr.itemCount += 1;
          curr.totalQuantity += Number(p.quantity || 0);
          curr.totalValue += Number(p.price || 0) * Number(p.quantity || 0);
          if (p.quantity <= p.reorderPoint) {
            curr.lowStockCount += 1;
          }
        }
      }
    }
    return map;
  }, [itemGroups, products]);

  // Filtered rows
  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return itemGroups;
    return itemGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.code.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term)
    );
  }, [itemGroups, search]);

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalAssignedItems = 0;
    let totalGroupValue = 0;
    groupMetrics.forEach((metrics) => {
      totalAssignedItems += metrics.itemCount;
      totalGroupValue += metrics.totalValue;
    });
    return {
      totalGroups: itemGroups.length,
      totalAssignedItems,
      totalGroupValue,
    };
  }, [itemGroups, groupMetrics]);

  return (
    <div className="page page-enter">
      <header className="page-header">
        <div className="page-header__text">
          <span className="page-header__eyebrow">
            <Icon name="category" size={16} />
            Catalog Hierarchy · {itemGroups.length} Item Groups
          </span>
          <h1 className="md-headline-large">Item Groups</h1>
          <p className="md-body-large page-header__subtitle">
            Classify and manage product categories, codes, and stock aggregates.
          </p>
        </div>
        <div className="page-actions">
          <Button icon="add" onClick={() => setAddOpen(true)}>
            New item group
          </Button>
        </div>
      </header>

      {/* KPI Stats */}
      <section className="item-groups-stats">
        <Card variant="outlined" className="item-group-stat-card">
          <span className="item-group-stat-icon">
            <Icon name="category" size={24} />
          </span>
          <div className="item-group-stat-body">
            <span className="md-label-medium item-group-stat-label">Total Groups</span>
            <span className="md-headline-small item-group-stat-val">
              {overallStats.totalGroups}
            </span>
          </div>
        </Card>

        <Card variant="outlined" className="item-group-stat-card">
          <span className="item-group-stat-icon" style={{ backgroundColor: 'var(--md-sys-color-secondary-container)', color: 'var(--md-sys-color-on-secondary-container)' }}>
            <Icon name="inventory_2" size={24} />
          </span>
          <div className="item-group-stat-body">
            <span className="md-label-medium item-group-stat-label">Classified Products</span>
            <span className="md-headline-small item-group-stat-val">
              {formatNumber(overallStats.totalAssignedItems)} items
            </span>
          </div>
        </Card>

        <Card variant="outlined" className="item-group-stat-card">
          <span className="item-group-stat-icon" style={{ backgroundColor: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)' }}>
            <Icon name="account_balance_wallet" size={24} />
          </span>
          <div className="item-group-stat-body">
            <span className="md-label-medium item-group-stat-label">Stock Value in Groups</span>
            <span className="md-headline-small item-group-stat-val">
              {formatCurrency(overallStats.totalGroupValue)}
            </span>
          </div>
        </Card>
      </section>

      {/* Search Toolbar */}
      <div className="item-groups-toolbar">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search groups by name, code, or description…"
          className="item-groups-search"
        />
      </div>

      {/* Group Cards Grid */}
      {filteredGroups.length === 0 ? (
        <Card variant="outlined" style={{ padding: 40, textAlign: 'center' }}>
          <EmptyState
            icon="category"
            title={search ? 'No matching item groups' : 'No item groups yet'}
            description={
              search
                ? `No group matches "${search}". Try searching for another name or code.`
                : 'Create your first item group to organize products and manage category inventory.'
            }
            action={
              search ? (
                <Button variant="tonal" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button icon="add" onClick={() => setAddOpen(true)}>
                  Create Item Group
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="item-groups-grid">
          {filteredGroups.map((group) => {
            const metrics = groupMetrics.get(group.id) || {
              itemCount: 0,
              totalQuantity: 0,
              totalValue: 0,
            };

            const menuItems = [
              {
                label: 'Edit group',
                icon: 'edit',
                onSelect: () => setEditing(group),
              },
              { divider: true },
              {
                label: 'Delete group',
                icon: 'delete',
                danger: true,
                onSelect: () => setDeleting(group),
              },
            ];

            return (
              <Card
                key={group.id}
                variant="outlined"
                className="item-group-card"
                style={{ '--group-color': group.color || '#3b82f6' }}
              >
                <div>
                  <div className="item-group-card__header">
                    <div className="item-group-card__title-wrap">
                      <span
                        className="item-group-card__color-dot"
                        style={{ backgroundColor: group.color || '#3b82f6' }}
                      />
                      <h2 className="md-title-medium item-group-card__name">
                        {group.name}
                      </h2>
                      <span className="item-group-card__code-chip">
                        {group.code}
                      </span>
                    </div>

                    <Menu
                      trigger={
                        <IconButton
                          icon="more_vert"
                          tooltip="Group options"
                          aria-label={`Options for ${group.name}`}
                        />
                      }
                      items={menuItems}
                    />
                  </div>

                  <p className="item-group-card__desc">
                    {group.description || 'No description provided.'}
                  </p>

                  <div className="item-group-card__metrics">
                    <div className="item-group-metric">
                      <span className="item-group-metric__label">Products</span>
                      <span className="item-group-metric__value">
                        {formatNumber(metrics.itemCount)}
                      </span>
                    </div>
                    <div className="item-group-metric">
                      <span className="item-group-metric__label">Units</span>
                      <span className="item-group-metric__value">
                        {formatNumber(metrics.totalQuantity)}
                      </span>
                    </div>
                    <div className="item-group-metric">
                      <span className="item-group-metric__label">Value</span>
                      <span className="item-group-metric__value">
                        {formatCurrency(metrics.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="item-group-card__footer">
                  <Button
                    variant="tonal"
                    icon="arrow_forward"
                    onClick={() =>
                      navigate(`/inventory?group=${encodeURIComponent(group.name)}`)
                    }
                  >
                    View items
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ItemGroupDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />

      <ItemGroupDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        group={editing}
      />

      <DeleteItemGroupDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        group={deleting}
      />
    </div>
  );
}

