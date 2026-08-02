'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ShoppingBag, Minus, Plus, X } from 'lucide-react';

const BLUSH = '#D6432F';
const RED = '#D4222A';

const STORAGE_KEY = 'arttrolley_cart';

export type CartItem = {
  code: string;
  name: string;
  price: number;
  size: string;
  img: string;
  qty: number;
};

type CartState = { items: CartItem[] };

type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'qty'>; qty?: number }
  | { type: 'REMOVE'; code: string; size: string }
  | { type: 'SET_QTY'; code: string; size: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

function lineKey(code: string, size: string) {
  return `${code}__${size}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items };
    case 'ADD': {
      const addQty = action.qty ?? 1;
      const existingIdx = state.items.findIndex(
        (i) => lineKey(i.code, i.size) === lineKey(action.item.code, action.item.size),
      );
      if (existingIdx !== -1) {
        const items = [...state.items];
        items[existingIdx] = { ...items[existingIdx], qty: items[existingIdx].qty + addQty };
        return { items };
      }
      return { items: [...state.items, { ...action.item, qty: addQty }] };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => lineKey(i.code, i.size) !== lineKey(action.code, action.size)) };
    case 'SET_QTY': {
      if (action.qty <= 0) {
        return { items: state.items.filter((i) => lineKey(i.code, i.size) !== lineKey(action.code, action.size)) };
      }
      return {
        items: state.items.map((i) =>
          lineKey(i.code, i.size) === lineKey(action.code, action.size) ? { ...i, qty: action.qty } : i,
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeFromCart: (code: string, size: string) => void;
  setQty: (code: string, size: string, qty: number) => void;
  clearCart: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  isOrderComplete: boolean;
  lastOrderNumber: string | null;
  completeOrder: () => void;
  resetOrder: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isOrderComplete, setOrderComplete] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);

  // hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', items: parsed });
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // persist on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items, hydrated]);

  const count = useMemo(() => state.items.reduce((sum, i) => sum + i.qty, 0), [state.items]);
  const subtotal = useMemo(() => state.items.reduce((sum, i) => sum + i.qty * i.price, 0), [state.items]);

  const value: CartContextValue = {
    items: state.items,
    count,
    subtotal,
    addToCart: (item, qty = 1) => dispatch({ type: 'ADD', item, qty }),
    removeFromCart: (code, size) => dispatch({ type: 'REMOVE', code, size }),
    setQty: (code, size, qty) => dispatch({ type: 'SET_QTY', code, size, qty }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    isCheckoutOpen,
    openCheckout: () => {
      setDrawerOpen(false);
      setOrderComplete(false);
      setCheckoutOpen(true);
    },
    closeCheckout: () => setCheckoutOpen(false),
    isOrderComplete,
    lastOrderNumber,
    completeOrder: () => {
      const orderNumber = `AT-${Date.now()}`;
      setLastOrderNumber(orderNumber);
      setOrderComplete(true);
      dispatch({ type: 'CLEAR' });
    },
    resetOrder: () => {
      setOrderComplete(false);
      setCheckoutOpen(false);
      setLastOrderNumber(null);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ------------------------------------------------------------- cart icon */
export function CartIcon() {
  const { count, openDrawer } = useCart();
  const [pop, setPop] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setPop(true);
      const t = window.setTimeout(() => setPop(false), 280);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Open cart"
      data-cart-count={count}
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 hover:scale-[1.08]"
      style={{ color: BLUSH }}
      onMouseEnter={(e) => (e.currentTarget.style.color = RED)}
      onMouseLeave={(e) => (e.currentTarget.style.color = BLUSH)}
    >
      <ShoppingBag size={24} strokeWidth={1.75} />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold"
          style={{
            background: RED,
            color: '#fff',
            transform: pop ? 'scale(1.35)' : 'scale(1)',
            transition: 'transform .28s cubic-bezier(.34,1.4,.4,1)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ---------------------------------------------------------- empty state */
export function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <ShoppingBag size={40} strokeWidth={1.25} style={{ color: 'rgba(214,67,47,.35)' }} />
      <p className="mt-5 text-sm font-medium" style={{ color: BLUSH }}>
        Your trolley is empty
      </p>
      <a
        href="#bazaar"
        onClick={onClose}
        className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] transition-colors"
        style={{ color: 'rgba(255,138,116,.85)' }}
      >
        Browse the bazaar →
      </a>
    </div>
  );
}

/* -------------------------------------------------------------- drawer */
export function CartDrawer() {
  const { items, subtotal, isDrawerOpen, closeDrawer, removeFromCart, setQty, openCheckout } = useCart();
  const [mounted, setMounted] = useState(false);
  const [panelIn, setPanelIn] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDrawerOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => setPanelIn(true));
      return () => cancelAnimationFrame(id);
    }
    setPanelIn(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [isDrawerOpen]);

  // Escape to close + a focus trap so keyboard users can't tab out behind the overlay.
  useEffect(() => {
    if (!isDrawerOpen) return;
    panelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex justify-end"
      onClick={closeDrawer}
      style={{
        background: panelIn ? 'rgba(0,0,0,.86)' : 'rgba(0,0,0,0)',
        backdropFilter: panelIn ? 'blur(10px)' : 'blur(0px)',
        transition: 'background .3s ease, backdrop-filter .3s ease',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your Trolley"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col outline-none sm:w-[420px]"
        style={{
          background: '#0a0808',
          borderLeft: `1px solid ${RED}`,
          transform: panelIn ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .32s cubic-bezier(.2,.7,.2,1)',
          boxShadow: panelIn ? '-20px 0 60px rgba(0,0,0,.5)' : 'none',
        }}
      >
        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: 'rgba(214,67,47,.3)' }}>
          <p className="text-[0.65rem] uppercase tracking-[0.24em]" style={{ color: BLUSH }}>
            Your Trolley {items.length > 0 && `(${items.reduce((s, i) => s + i.qty, 0)})`}
          </p>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
            style={{ background: 'rgba(0,0,0,.55)', color: RED, border: `1px solid ${RED}` }}
          >
            <X size={14} />
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyCartState onClose={closeDrawer} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <div
                  key={lineKey(item.code, item.size)}
                  className="flex gap-3 border-b py-4 first:pt-0"
                  style={{ borderColor: 'rgba(214,67,47,.15)' }}
                >
                  <div
                    className="h-[80px] w-[64px] shrink-0 overflow-hidden rounded-2xl"
                    style={{ background: 'rgba(255,255,255,.04)' }}
                  >
                    <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: BLUSH }}>{item.name}</p>
                      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: 'rgba(255,138,116,.85)' }}>
                        {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full px-1 py-1" style={{ border: '1px solid rgba(214,67,47,.3)' }}>
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => setQty(item.code, item.size, item.qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                          style={{ color: BLUSH }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = RED; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BLUSH; }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[1.2rem] text-center text-xs font-medium" style={{ color: BLUSH }}>
                          {item.qty}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => setQty(item.code, item.size, item.qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                          style={{ color: BLUSH }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = RED; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BLUSH; }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-semibold" style={{ color: RED }}>
                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-label="Remove item"
                    onClick={() => removeFromCart(item.code, item.size)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full transition-colors"
                    style={{ background: 'rgba(0,0,0,.4)', color: 'rgba(255,138,116,.85)', border: '1px solid rgba(214,67,47,.3)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = RED)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,138,116,.85)')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t px-6 py-5" style={{ borderColor: 'rgba(214,67,47,.3)' }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.14em]" style={{ color: 'rgba(255,138,116,.85)' }}>Subtotal</span>
                <span className="text-lg font-semibold" style={{ color: BLUSH }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <button
                onClick={openCheckout}
                className="crinkle-surface w-full rounded-full px-7 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white transition-transform hover:scale-[1.02]"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
