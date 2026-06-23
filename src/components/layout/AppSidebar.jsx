/**
 * AppSidebar — shown on desktop (900px+), hidden on mobile.
 * Collapsible via a toggle button.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { storage, msgStorage } from '../../storage';

const NAV = [
  { path: '/home',          icon: '🏠', label: 'Home' },
  { path: '/search',        icon: '🔍', label: 'Search' },
  { path: '/create',        icon: '⚡', label: 'New Slash' },
  { path: '/my-slashes',   icon: '📋', label: 'My Slashes' },
  { path: '/wallet',        icon: '💳', label: 'Wallet' },
  { path: '/messages',      icon: '📩', label: 'Messages' },
  { path: '/leaderboard',   icon: '🏆', label: 'Leaderboard' },
  { path: '/notifications', icon: '🔔', label: 'Alerts' },
  { path: '/profile',       icon: '👤', label: 'Profile' },
];

export function AppSidebar() {
  const loc = useLocation();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const user = storage.load('session', null);
  const name = user?.name || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  const w = collapsed ? 64 : 220;

  // Sync collapsed state to CSS variable so app-main margin updates
  const sidebarW = collapsed ? 64 : 220;
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--sidebar-w', sidebarW + 'px');
  }

  return (
    <aside
      className={`app-sidebar${collapsed ? ' collapsed' : ''}`}
      style={{
        width: sidebarW, flexShrink: 0, background: '#fff',
        borderRight: '1.5px solid #e2e8f0',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 40, transition: 'width .25s', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '18px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
          {initials || '👤'}
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>SlashIt Member</div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {NAV.map(item => {
          const active = loc.pathname === item.path || (item.path !== '/home' && loc.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              title={collapsed ? item.label : ''}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 10, padding: collapsed ? '11px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 10, marginBottom: 2, border: 'none',
                background: active ? '#eff6ff' : 'transparent',
                color: active ? '#2563eb' : '#475569',
                fontWeight: active ? 700 : 500, fontSize: 13,
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              {active && !collapsed && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          margin: '10px 8px 16px', padding: '10px', borderRadius: 10,
          background: '#f1f5f9', border: 'none', cursor: 'pointer',
          color: '#64748b', fontSize: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '▶' : '◀'}
      </button>
    </aside>
  );
}
