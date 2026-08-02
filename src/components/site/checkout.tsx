'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useCart } from './cart';

const BLUSH = '#D6432F';
const RED = '#D4222A';

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
};

const EMPTY_FORM: FormState = { name: '', email: '', phone: '', address: '', city: '', pincode: '' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;
const PINCODE_RE = /^[0-9]{6}$/;

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = 'Required';
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email';
  if (!PHONE_RE.test(form.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (!form.address.trim()) errors.address = 'Required';
  if (!form.city.trim()) errors.city = 'Required';
  if (!PINCODE_RE.test(form.pincode.trim())) errors.pincode = 'Enter a valid pincode';
  return errors;
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(214,67,47,.3)',
  color: BLUSH,
};

function Field({
  label, name, value, error, onChange, type = 'text',
}: {
  label: string;
  name: keyof FormState;
  value: string;
  error?: string;
  onChange: (name: keyof FormState, value: string) => void;
  type?: string;
}) {
  const inputId = `checkout-${name}`;
  const errorId = `${inputId}-error`;
  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: 'rgba(255,138,116,.85)' }}>
        {label}
      </span>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
        style={inputStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = RED)}
        onBlur={(e) => (e.currentTarget.style.borderColor = error ? RED : 'rgba(214,67,47,.3)')}
      />
      {error && <span id={errorId} role="alert" className="mt-1 block text-[0.6rem]" style={{ color: RED }}>{error}</span>}
    </label>
  );
}

export function CheckoutView() {
  const { items, subtotal, isCheckoutOpen, closeCheckout, isOrderComplete, lastOrderNumber, completeOrder, resetOrder } = useCart();
  const [mounted, setMounted] = useState(false);
  const [panelIn, setPanelIn] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCheckoutOpen) {
      setMounted(true);
      const id = requestAnimationFrame(() => setPanelIn(true));
      return () => cancelAnimationFrame(id);
    }
    setPanelIn(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [isCheckoutOpen]);

  const close = () => {
    setPanelIn(false);
    setTimeout(() => {
      closeCheckout();
      resetOrder();
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitting(false);
    }, 260);
  };

  // Escape to close + a focus trap so keyboard users can't tab out behind the overlay.
  useEffect(() => {
    if (!isCheckoutOpen) return;
    panelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutOpen]);

  const onChange = (name: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isOrderComplete) return; // idempotency guard against rapid clicks
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    completeOrder();
  };

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-8"
      onClick={close}
      style={{
        background: `rgba(0,0,0,${panelIn ? 0.86 : 0})`,
        backdropFilter: panelIn ? 'blur(10px)' : 'blur(0px)',
        transition: 'background .3s ease, backdrop-filter .3s ease',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={isOrderComplete ? 'Order confirmation' : 'Checkout'}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-4xl gap-0 overflow-hidden rounded-3xl outline-none sm:grid-cols-2"
        style={{
          background: '#0a0808',
          border: `1px solid ${RED}`,
          maxHeight: '90vh',
          boxShadow: panelIn ? '0 0 0 1px rgba(212,34,42,.25), 0 30px 90px rgba(212,34,42,.25)' : 'none',
          opacity: panelIn ? 1 : 0,
          transform: panelIn ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(24px)',
          transition: 'opacity .32s cubic-bezier(.2,.7,.2,1), transform .32s cubic-bezier(.2,.7,.2,1), box-shadow .32s ease',
        }}
      >
        <button
          onClick={close}
          aria-label="Close checkout"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors"
          style={{ background: 'rgba(0,0,0,.55)', color: RED, border: `1px solid ${RED}` }}
        >
          ✕
        </button>

        {isOrderComplete ? (
          <div
            className="col-span-2 flex flex-col items-center justify-center px-8 py-16 text-center"
            style={{ animation: 'at-up .4s ease both' }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: RED, color: '#fff' }}
            >
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h3 className="mt-6 text-2xl font-semibold" style={{ color: RED }}>Order placed</h3>
            <p className="mt-2 text-xs uppercase tracking-[0.2em]" style={{ color: 'rgba(255,138,116,.85)' }}>
              {lastOrderNumber}
            </p>
            <p className="mt-4 max-w-xs text-sm font-light" style={{ color: 'rgba(255,138,116,.85)' }}>
              Thank you. We&apos;ll be in touch with shipping details shortly.
            </p>
            <button
              onClick={close}
              className="mt-8 rounded-full px-7 py-3 text-[0.65rem] uppercase tracking-[0.18em] transition-transform hover:scale-[1.02]"
              style={{ border: `1px solid ${RED}`, color: RED }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col overflow-y-auto p-6 sm:p-8" style={{ borderRight: '1px solid rgba(214,67,47,.2)' }}>
              <p className="text-[0.6rem] uppercase tracking-[0.3em]" style={{ color: 'rgba(212,34,42,.75)' }}>Order Summary</p>
              <div className="mt-5 flex-1 space-y-4">
                {items.map((item) => (
                  <div key={`${item.code}__${item.size}`} className="flex gap-3">
                    <div className="h-[64px] w-[52px] shrink-0 overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,.04)' }}>
                      <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-xs font-medium" style={{ color: BLUSH }}>{item.name}</p>
                      <p className="text-[0.6rem] uppercase tracking-[0.12em]" style={{ color: 'rgba(255,138,116,.85)' }}>
                        {item.size} · Qty {item.qty}
                      </p>
                    </div>
                    <p className="self-center text-xs font-semibold" style={{ color: RED }}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(214,67,47,.3)' }}>
                <span className="text-xs uppercase tracking-[0.14em]" style={{ color: 'rgba(255,138,116,.85)' }}>Total</span>
                <span className="text-lg font-semibold" style={{ color: BLUSH }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col overflow-y-auto p-6 sm:p-8">
              <p className="text-[0.6rem] uppercase tracking-[0.3em]" style={{ color: 'rgba(212,34,42,.75)' }}>Delivery Details</p>
              <div className="mt-5 space-y-4">
                <Field label="Full Name" name="name" value={form.name} error={errors.name} onChange={onChange} />
                <Field label="Email" name="email" value={form.email} error={errors.email} onChange={onChange} type="email" />
                <Field label="Phone" name="phone" value={form.phone} error={errors.phone} onChange={onChange} type="tel" />
                <Field label="Address" name="address" value={form.address} error={errors.address} onChange={onChange} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" name="city" value={form.city} error={errors.city} onChange={onChange} />
                  <Field label="Pincode" name="pincode" value={form.pincode} error={errors.pincode} onChange={onChange} />
                </div>
              </div>
              <button
                type="submit"
                disabled={items.length === 0 || submitting}
                className="crinkle-surface mt-8 w-full rounded-full px-7 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Place Order
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
