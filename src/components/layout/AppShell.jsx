import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NavigationRail } from './NavigationRail';
import { BottomNav } from './BottomNav';
import { TopAppBar } from './TopAppBar';
import { AIPanel } from '../../features/ai/AIPanel';

export function AppShell({ children }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <NavigationRail
        onOpenAI={() => setAiOpen(true)}
        open={navOpen}
      />
      {navOpen && (
        <div
          className="app-drawer-backdrop"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="app-frame">
        <TopAppBar onMenu={() => setNavOpen((prev) => !prev)} />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <div className="app-content">{children}</div>
        </main>
      </div>
      <BottomNav onOpenAI={() => setAiOpen(true)} />
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
