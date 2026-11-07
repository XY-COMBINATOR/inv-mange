import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './store/ThemeContext';
import { StoreProvider } from './store/StoreContext';
import { ToastProvider } from './store/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './features/dashboard/DashboardView';
import { InventoryView } from './features/inventory/InventoryView';
import { ItemGroupsView } from './features/item-groups/ItemGroupsView';
import { MovementsView } from './features/movements/MovementsView';
import { SuppliersView } from './features/suppliers/SuppliersView';
import { SettingsView } from './features/settings/SettingsView';
import { ROUTE_TITLES } from './navigation';

function RouteEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.title = `${ROUTE_TITLES[pathname] ?? 'Inventory'} · Invmage`;
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <StoreProvider>
          <RouteEffects />
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/inventory" element={<InventoryView />} />
              <Route path="/groups" element={<ItemGroupsView />} />
              <Route path="/movements" element={<MovementsView />} />
              <Route path="/suppliers" element={<SuppliersView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </StoreProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
