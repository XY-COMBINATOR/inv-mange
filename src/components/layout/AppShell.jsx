import { NavigationRail } from './NavigationRail';
import { BottomNav } from './BottomNav';
import { TopAppBar } from './TopAppBar';

export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <NavigationRail />
      <div className="app-frame">
        <TopAppBar />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <div className="app-content">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
