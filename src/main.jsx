import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/roboto';
import './styles/tokens.css';
import './styles/base.css';
import './styles/forms.css';
import './components/ui/ui.css';
import './components/layout/layout.css';
import './features/dashboard/dashboard.css';
import './features/inventory/inventory.css';
import './features/movements/movements.css';
import './features/suppliers/suppliers.css';
import './features/settings/settings.css';
import { App } from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
