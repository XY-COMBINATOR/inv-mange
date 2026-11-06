import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Snackbar } from '../components/ui/Snackbar';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const id = ++toastId;
    setToasts([
      {
        id,
        message,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
      },
    ]);
    return id;
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const current = toasts[0];

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.id}
        toast={current}
        onDismiss={() => dismiss(current.id)}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}
