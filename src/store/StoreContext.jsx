import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createSeedState, ITEM_GROUPS } from '../data/seed';

const STORAGE_KEY = 'invmage:data:v2';
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
    // Upgrade if missing itemGroups
    if (!Array.isArray(parsed.itemGroups) || parsed.itemGroups.length === 0) {
      parsed.itemGroups = ITEM_GROUPS;
      parsed.products = parsed.products.map((p) => {
        if (!p.groupId) {
          const match = ITEM_GROUPS.find(
            (g) => g.name.toLowerCase() === p.category?.toLowerCase()
          );
          return { ...p, groupId: match ? match.id : null };
        }
        return p;
      });
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'data/load':
      return {
        ...state,
        products: action.payload.products ?? state.products,
        itemGroups: action.payload.itemGroups ?? state.itemGroups,
        suppliers: action.payload.suppliers ?? state.suppliers,
        movements: action.payload.movements ?? state.movements,
      };

    case 'group/add':
      return {
        ...state,
        itemGroups: [action.group, ...state.itemGroups],
      };

    case 'group/update':
      return {
        ...state,
        itemGroups: state.itemGroups.map((group) =>
          group.id === action.group.id ? action.group : group
        ),
        products: state.products.map((product) =>
          product.groupId === action.group.id
            ? { ...product, category: action.group.name }
            : product
        ),
      };

    case 'group/delete':
      return {
        ...state,
        itemGroups: state.itemGroups.filter((group) => group.id !== action.id),
        products: state.products.map((product) =>
          product.groupId === action.id ? { ...product, groupId: null } : product
        ),
      };

    case 'product/add':
      return { ...state, products: [action.product, ...state.products] };

    case 'product/update':
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.product.id ? action.product : product
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
          (product) => product.id === action.product.id
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
            : product
        ),
      };

    case 'supplier/add':
      return { ...state, suppliers: [action.supplier, ...state.suppliers] };

    case 'supplier/update':
      return {
        ...state,
        suppliers: state.suppliers.map((supplier) =>
          supplier.id === action.supplier.id ? action.supplier : supplier
        ),
      };

    case 'supplier/delete':
      return {
        ...state,
        suppliers: state.suppliers.filter(
          (supplier) => supplier.id !== action.id
        ),
        products: state.products.map((product) =>
          product.supplierId === action.id
            ? { ...product, supplierId: null }
            : product
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
  const [dbStatus, setDbStatus] = useState({
    connected: false,
    type: 'Connecting...',
    message: '',
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist locally as fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* LocalStorage safe fallback */
    }
  }, [state]);

    // Sync with PostgreSQL API server
    const refreshData = useCallback(async () => {
      try {
        const statusRes = await fetch('/api/system/status');
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          setDbStatus(statusJson.database);

          const [groupsRes, productsRes, suppliersRes, movementsRes] =
            await Promise.all([
              fetch('/api/item-groups'),
              fetch('/api/products'),
              fetch('/api/suppliers'),
              fetch('/api/movements'),
            ]);

          if (
            groupsRes.ok &&
            productsRes.ok &&
            suppliersRes.ok &&
            movementsRes.ok
          ) {
            const itemGroups = await groupsRes.json();
            const products = await productsRes.json();
            const suppliers = await suppliersRes.json();
            const movements = await movementsRes.json();

            dispatch({
              type: 'data/load',
              payload: { itemGroups, products, suppliers, movements },
            });
          }
        } else {
          setDbStatus({
            connected: false,
            type: 'Local Browser Storage',
            message: 'PostgreSQL API server not running. Using offline browser storage.',
          });
        }
      } catch {
        setDbStatus({
          connected: false,
          type: 'Local Browser Storage',
          message: 'PostgreSQL API server offline. Using local browser storage.',
        });
      }
    }, []);

    useEffect(() => {
      refreshData();
    }, [refreshData]);

    // Item Group Actions
    const addItemGroup = useCallback(async (values) => {
      const tempGroup = {
        id: makeId('grp'),
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || '',
        color: values.color || '#3b82f6',
        itemCount: 0,
        totalQuantity: 0,
        totalValue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'group/add', group: tempGroup });

      try {
        const res = await fetch('/api/item-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tempGroup),
        });
        if (res.ok) {
          const created = await res.json();
          dispatch({ type: 'group/update', group: created });
          return created;
        }
      } catch {
        /* Fallback to local */
      }
      return tempGroup;
    }, []);

    const updateItemGroup = useCallback(async (id, values) => {
      const current = stateRef.current.itemGroups?.find((g) => g.id === id);
      if (!current) return null;

      const updated = {
        ...current,
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || '',
        color: values.color || current.color,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'group/update', group: updated });

      try {
        const res = await fetch(`/api/item-groups/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        if (res.ok) {
          const serverGroup = await res.json();
          dispatch({ type: 'group/update', group: serverGroup });
          return serverGroup;
        }
      } catch {
        /* Fallback to local */
      }
      return updated;
    }, []);

    const deleteItemGroup = useCallback(async (id) => {
      dispatch({ type: 'group/delete', id });
      try {
        await fetch(`/api/item-groups/${id}`, { method: 'DELETE' });
      } catch {
        /* Fallback to local */
      }
    }, []);

    // Product Actions
    const addProduct = useCallback(async (values) => {
      const now = new Date().toISOString();
        const tempProduct = {
          id: makeId('prd'),
          name: values.name.trim(),
          sku: values.sku.trim().toUpperCase(),
          groupId: values.groupId || null,
          category: values.category?.trim() || 'General',
          supplierId: values.supplierId || null,
          price: Number(values.price) || 0,
          cost: Number(values.cost) || 0,
          quantity: Math.max(0, Math.floor(Number(values.quantity) || 0)),
          reorderPoint: Math.max(0, Math.floor(Number(values.reorderPoint) || 0)),
          location: values.location?.trim() || '',
          createdAt: now,
          updatedAt: now,
        };

        dispatch({ type: 'product/add', product: tempProduct });

    try {
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tempProduct),
          });
          if(res.ok) {
            const created = await res.json();
    dispatch({ type: 'product/update', product: created });
    return created;
  }
    } catch {
  /* Fallback to local */
}
return tempProduct;
  }, []);

  const updateProduct = useCallback(async (id, values) => {
    const current = stateRef.current.products.find((item) => item.id === id);
    if (!current) return null;

      const updated = {
        ...current,
        name: values.name.trim(),
        sku: values.sku.trim().toUpperCase(),
        groupId: values.groupId || null,
        category: values.category?.trim() || current.category,
        supplierId: values.supplierId || null,
        price: Number(values.price) || 0,
        cost: Number(values.cost) || 0,
        reorderPoint: Math.max(0, Math.floor(Number(values.reorderPoint) || 0)),
        location: values.location?.trim() || '',
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'product/update', product: updated });

    try {
        const res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        if(res.ok) {
          const serverProd = await res.json();
  dispatch({ type: 'product/update', product: serverProd });
  return serverProd;
}
    } catch {
  /* Fallback to local */
}
return updated;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    const current = stateRef.current.products.find((item) => item.id === id);
    dispatch({ type: 'product/delete', id });
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch {
      /* Fallback to local */
    }
    return current;
  }, []);

    const restoreProduct = useCallback(async (product) => {
      dispatch({ type: 'product/restore', product });
      try {
        await fetch('/api/products/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      } catch {
        /* Fallback to local */
      }
    }, []);

    // Movement Actions
    const recordMovement = useCallback(
        async ({ productId, type, quantity, reason, note }) => {
          const product = stateRef.current.products.find(
            (item) => item.id === productId
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

          try {
            const res = await fetch('/api/movements', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(movement),
            });
            if (res.ok) {
              const result = await res.json();
              return result.movement;
            }
          } catch {
            /* Fallback to local */
          }
          return movement;
        },
          []
  );

      // Supplier Actions
      const addSupplier = useCallback(async (values) => {
        const supplier = {
          id: makeId('sup'),
          name: values.name.trim(),
          contactName: values.contactName?.trim() || '',
          email: values.email?.trim() || '',
          phone: values.phone?.trim() || '',
          leadTime: Math.max(0, Math.floor(Number(values.leadTime) || 0)),
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'supplier/add', supplier });
        try {
          const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplier),
          });
          if (res.ok) {
            const created = await res.json();
            dispatch({ type: 'supplier/update', supplier: created });
            return created;
          }
        } catch {
          /* Fallback to local */
        }
        return supplier;
      }, []);

        const updateSupplier = useCallback(async (id, values) => {
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
          try {
            const res = await fetch(`/api/suppliers/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(supplier),
            });
            if (res.ok) {
              const updated = await res.json();
              dispatch({ type: 'supplier/update', supplier: updated });
              return updated;
            }
          } catch {
            /* Fallback to local */
          }
          return supplier;
        }, []);

          const deleteSupplier = useCallback(async (id) => {
            dispatch({ type: 'supplier/delete', id });
            try {
              await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
            } catch {
              /* Fallback to local */
            }
          }, []);

            const resetData = useCallback(async () => {
              dispatch({ type: 'data/reset' });
            try {
              await fetch('/api/system/reset', { method: 'POST' });
              await refreshData();
            } catch {
              /* Local reset handled */
            }
          }, [refreshData]);

          const value = useMemo(
            () => ({
              ...state,
              itemGroups: state.itemGroups || ITEM_GROUPS,
              dbStatus,
              refreshData,
              addItemGroup,
              updateItemGroup,
              deleteItemGroup,
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
              dbStatus,
              refreshData,
              addItemGroup,
              updateItemGroup,
              deleteItemGroup,
              addProduct,
              updateProduct,
              deleteProduct,
              restoreProduct,
              recordMovement,
              addSupplier,
              updateSupplier,
              deleteSupplier,
              resetData,
    ]
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
