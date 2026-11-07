export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'space_dashboard', end: true },
  { to: '/inventory', label: 'Inventory', icon: 'inventory_2' },
  { to: '/groups', label: 'Item groups', icon: 'category' },
  { to: '/movements', label: 'Stock', icon: 'swap_vert' },
  { to: '/suppliers', label: 'Suppliers', icon: 'local_shipping' },
  { action: 'open-ai', label: 'AI Chat', icon: 'smart_toy' },
];

export const SETTINGS_ITEM = {
  to: '/settings',
  label: 'Settings',
  icon: 'settings',
};

export const ALL_NAV_ITEMS = [...NAV_ITEMS, SETTINGS_ITEM];

export const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/groups': 'Item groups',
  '/movements': 'Stock movements',
  '/suppliers': 'Suppliers',
  '/settings': 'Settings',
};
