import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems, setDrawerOpen } = useCart();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Medicines' },
    { path: '/lab-tests', label: 'Lab Tests' },
    { path: '/membership', label: 'Membership' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact Us' },
    { path: '/reviews', label: 'Reviews' },
  ];

  const closeNav = () => setNavOpen(false);

  return (
    <header className="header" role="banner">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Dhiya's Pharmousy - Home" onClick={closeNav}>
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 20v-4h14v4" />
            <path d="M10 4v16" />
            <path d="M14 4v16" />
            <circle cx="8" cy="20" r="2" />
            <circle cx="16" cy="20" r="2" />
          </svg>
          <span>Dhiya's Pharmousy</span>
        </Link>

        <button
          className="mobile-nav-toggle"
          onClick={() => setNavOpen(!navOpen)}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
        >
          {navOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        <nav className={`nav ${navOpen ? 'open' : ''}`} role="navigation" aria-label="Main navigation">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={closeNav}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`} onClick={closeNav}>My Orders</Link>
          )}
        </nav>

        <div className="nav" style={{ gap: '4px', display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <button className="cart-btn" onClick={() => setDrawerOpen(true)} aria-label={`Cart, ${totalItems} items`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {totalItems > 0 && <span className="cart-count" aria-label={`${totalItems} items in cart`}>{totalItems}</span>}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>{user?.name}</span>
                <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 12px', fontSize: '14px' }}>Logout</button>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '14px' }}>Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}