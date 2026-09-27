import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    if (drawerOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  const deliveryFee = subtotal >= 499 ? 0 : 39;
  const total = subtotal + deliveryFee;

  const proceedToCheckout = () => {
    setDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <div className="cart-overlay visible" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      <aside className="cart-drawer open" role="dialog" aria-label="Shopping cart" aria-modal="true">
        <div className="cart-header">
          <h2 className="cart-title">Shopping Cart ({totalItems})</h2>
          <button className="btn btn-ghost" onClick={() => setDrawerOpen(false)} aria-label="Close cart">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }} aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>Your cart is empty</p>
              <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Browse Medicines</Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : (
                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 17" />
                    </svg>
                  )}
                </div>
                <div className="cart-item-info">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <p className="cart-item-price">₹{item.price.toFixed(2)} each</p>
                  <div className="cart-item-qty">
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                      disabled={item.quantity <= 1}
                    >−</button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 500 }}>{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                    >+</button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => removeItem(item.id)}
                      style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '12px' }}
                      aria-label={`Remove ${item.name} from cart`}
                    >Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-summary">
            <div className="cart-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="cart-row">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`} {subtotal < 499 && <span className="badge badge-info" style={{ fontSize: '10px', marginLeft: '8px' }}>Add ₹{(499 - subtotal).toFixed(2)} for free delivery</span>}</span>
            </div>
            <div className="cart-row total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={proceedToCheckout} disabled={items.length === 0}>
            Proceed to Checkout
          </button>
          <p style={{ textAlign: 'center', margin: '12px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Pay on delivery (COD only)
          </p>
        </div>
      </aside>
    </>
  );
}