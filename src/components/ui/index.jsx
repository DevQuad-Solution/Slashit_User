/**
 * Shared UI Primitives
 * These are the design system building blocks used throughout the user app.
 * Keep these pure presentation components — no API calls, no navigation.
 */

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  onClick,
  style = {},
  full,
  disabled,
}) {
  const variantStyles = {
    primary:   { background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,.3)' },
    secondary: { background: '#f1f5f9', color: '#334155', border: '1.5px solid #e2e8f0' },
    ghost:     { background: 'transparent', color: '#64748b' },
    danger:    { background: '#dc2626', color: '#fff' },
    outline:   { background: 'transparent', color: '#2563eb', border: '2px solid #2563eb' },
    success:   { background: '#16a34a', color: '#fff' },
  };
  const sizeStyles = {
    sm: { fontSize: 12, padding: '7px 14px',  borderRadius: 8  },
    md: { fontSize: 14, padding: '11px 20px', borderRadius: 12 },
  };
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 700,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        width: full ? '100%' : undefined,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {loading && (
        <span
          className="spin"
          style={{
            width: 13, height: 13,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {label}
        </label>
      )}
      <input {...props} style={{ borderColor: error ? '#dc2626' : undefined }} />
      {error && (
        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{error}</span>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, bg = '#dbeafe', color = '#1d4ed8', style = {} }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: bg, color, ...style }}>
      {label}
    </span>
  );
}

// ── Fill Bar (progress indicator) ────────────────────────────────────────────
export function FillBar({ filled, total, color = '#2563eb' }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return (
    <div style={{ height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width .3s',
        }}
      />
    </div>
  );
}

// ── Modal (bottom sheet) ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="sheet" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet-inner" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#64748b' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = '#2563eb' }) {
  return (
    <div
      className="spin"
      style={{
        width: size, height: size,
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block',
      }}
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      {title    && <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{title}</div>}
      {subtitle && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

// ── Page-level loading skeleton ───────────────────────────────────────────────
export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <Spinner size={32} />
    </div>
  );
}

// ── Inline error display ──────────────────────────────────────────────────────
export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
      {message}
    </div>
  );
}
