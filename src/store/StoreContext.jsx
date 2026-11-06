import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { createSeedState } from '../data/seed';

const STORAGE_KEY = 'invmage:data:v1';

const StoreContext = createContext(null);

const makeId = (prefix) => {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.products) ||
      !Array.isArray(parsed.suppliers) ||
      !Array.isArray(parsed.movements)
    ) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'product/add':
      return { ...state, products: [action.product, ...state.products] };

    case 'product/update':
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.product.id ? action.product : product,
        ),
      };

    case 'product/delete':
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.id),
      };

    case 'product/restore':
      return {
        ...state,
        products: state.products.some(
          (product) => product.id === action.product.id,
        )
          ? state.products
          : [...state.products, action.product],
      };

    case 'movement/add':
      return {
        ...state,
        movements: [action.movement, ...state.movements],
        products: state.products.map((product) =>
          product.id === action.movement.productId
            ? {
                ...product,
                quantity: action.movement.resultingStock,
                updatedAt: action.movement.createdAt,
              }
            : product,
        ),
      };

    case 'supplier/add':
      return { ...state, suppliers: [action.supplier, ...state.suppliers] };

    case 'supplier/update':
      return {
        ...state,
        suppliers: state.suppliers.map((supplier) =>
          supplier.id === action.supplier.id ? action.supplier : supplier,
        ),
      };

    case 'supplier/delete':
      return {
        ...state,
        suppliers: state.suppliers.filter(
          (supplier) => supplier.id !== action.id,
        ),
        products: state.products.map((product) =>
          product.supplierId === action.id
            ? { ...product, supplierId: null }
            : product,
        ),
      };

    case 'data/reset':
      return createSeedState();

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Storage can be unavailable in private mode; the app still works. */
    }
  }, [state]);

  const addProduct = useCallback((values) => {
    const now = new Date().toISOString();
    const product = {
      id: makeId('prd'),
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      category: values.category.trim(),
      supplierId: values.supplierId || null,
      price: Number(values.price) || 0,
      cost: Number(values.cost) || 0,
      quantity: Math.max(0, Math.floor(Number(values.quantity) || 0)),
      reorderPoint: Math.max(0, Math.floor(Number(values.reorderPoint) || 0)),
      location: values.location?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'product/add', product });
    return product;
  }, []);

  const updateProduct = useCallback((id, values) => {
    const current = stateRef.current.products.find((item) => item.id === id);
    if (!current) return null;
    const product = {
      ...current,
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      category: values.category.trim(),
      supplierId: values.supplierId || null,
      price: Number(values.price) || 0,
      cost: Number(values.cost) || 0,
      reorderPoint: Math.max(0, Math.floor(Number(values.reorderPoint) || 0)),
      location: values.location?.trim() || '',
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'product/update', product });
    return product;
  }, []);

  const deleteProduct = useCallback((id) => {
    dispatch({ type: 'product/delete', id });
  }, []);

  const restoreProduct = useCallback((product) => {
    dispatch({ type: 'product/restore', product });
  }, []);

  const recordMovement = useCallback(
    ({ productId, type, quantity, reason, note }) => {
      const product = stateRef.current.products.find(
        (item) => item.id === productId,
      );
      if (!product) return null;

      const qty = Math.max(0, Math.floor(Number(quantity) || 0));
      const delta =
        type === 'receive'
          ? qty
          : type === 'issue'
            ? -qty
            : qty - product.quantity;

      const movement = {
        id: makeId('mov'),
        productId,
        type,
        delta,
        reason,
        note: note?.trim() || '',
        createdAt: new Date().toISOString(),
        resultingStock: product.quantity + delta,
        by: 'Jignesh Patel',
      };

      dispatch({ type: 'movement/add', movement });
      return movement;
    },
    [],
  );

  const addSupplier = useCallback((values) => {
    const supplier = {
      id: makeId('sup'),
      name: values.name.trim(),
      contactName: values.contactName?.trim() || '',
      email: values.email?.trim() || '',
      phone: values.phone?.trim() || '',
      leadTime: Math.max(0, Math.floor(Number(values.leadTime) || 0)),
    };
    dispatch({ type: 'supplier/add', supplier });
    return supplier;
  }, []);

  const updateSupplier = useCallback((id, values) => {
    const current = stateRef.current.suppliers.find((item) => item.id === id);
    if (!current) return null;
    const supplier = {
      ...current,
      name: values.name.trim(),
      contactName: values.contactName?.trim() || '',
      email: values.email?.trim() || '',
      phone: values.phone?.trim() || '',
      leadTime: Math.max(0, Math.floor(Number(values.leadTime) || 0)),
    };
    dispatch({ type: 'supplier/update', supplier });
    return supplier;
  }, []);

  const deleteSupplier = useCallback((id) => {
    dispatch({ type: 'supplier/delete', id });
  }, []);

  const resetData = useCallback(() => {
    dispatch({ type: 'data/reset' });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      addProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      recordMovement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      resetData,
    }),
    [
      state,
      addProduct,
      updateProduct,
      deleteProduct,
      restoreProduct,
      recordMovement,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      resetData,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used inside a StoreProvider');
  }
  return context;
}
