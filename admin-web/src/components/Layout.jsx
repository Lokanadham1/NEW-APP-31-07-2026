import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/orders', label: 'Orders' },
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/notifications', label: 'Notifications' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <img src="/logo.png" alt="Roti & More" style={styles.logo} />
          <div>
            <div style={styles.brandName}>Roti & More</div>
            <div style={styles.brandSub}>Admin</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : null),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.adminMobile}>{user?.mobile}</div>
          <button className="btn btn-outline btn-sm" onClick={logout} style={{ width: '100%' }}>
            Log out
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: '#fff',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 6 },
  logo: { width: 36, height: 36, borderRadius: 8 },
  brandName: { fontWeight: 800, fontSize: 15 },
  brandSub: { fontSize: 11.5, color: 'var(--slate)' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navLink: {
    textDecoration: 'none',
    color: 'var(--ink)',
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
  },
  navLinkActive: { background: 'var(--primary-light)', color: 'var(--primary-dark)' },
  footer: { borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 },
  adminMobile: { fontSize: 12, color: 'var(--slate)', marginBottom: 10, paddingLeft: 2 },
  main: { flex: 1, padding: '28px 32px', maxWidth: 1100 },
};
