import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ordersApi } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  placed: 'badge-warning',
  confirmed: 'badge-info',
  packed: 'badge-info',
  out_for_delivery: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-error',
};

export function Orders() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.list();
      setOrders(data.orders || []);
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;
    
    setCancelling(orderId);
    try {
      await ordersApi.cancel(orderId, reason);
      showToast('Order cancelled');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="container orders-page">
        <h1 style={{ marginBottom: '24px' }}>My Orders</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card order-card">
              <div className="order-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--border)', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '16px', width: '120px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
              <div className="order-items">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="order-item">
                    <div className="order-item-image" style={{ background: 'var(--bg)' }} />
                    <div className="order-item-info">
                      <div style={{ height: '16px', width: '60%', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ height: '12px', width: '40%', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container orders-page" style={{ textAlign: 'center', padding: '60px 16px' }}>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', padding: '40px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }} aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
          <h2 style={{ margin: '0 0 8px' }}>Sign in to View Orders</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please sign in to see your order history.</p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container orders-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1>My Orders</h1>
        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }} aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h2 style={{ margin: '0 0 8px' }}>No Orders Yet</h2>
          <p style={{ margin: '0 0 24px', color: 'var(--text-muted)' }}>Your order history will appear here</p>
          <Link to="/products" className="btn btn-primary">Browse Medicines</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <article key={order.id} className="card order-card">
              <div className="order-header">
                <div>
                  <p className="order-no">Order #{order.order_no}</p>
                  <p className="order-date">{formatDate(order.placed_at)}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[order.status] || 'badge-info'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              <div className="order-items">
                {order.items.slice(0, 3).map(item => (
                  <div key={item.id} className="order-item">
                    <div className="order-item-image">
                      {item.image_url ? <img src={item.image_url} alt={item.name} /> : (
                        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 17" />
                        </svg>
                      )}
                    </div>
                    <div className="order-item-info">
                      <p className="order-item-name">{item.name}</p>
                      <p className="order-item-qty">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', alignSelf: 'center' }}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="order-footer">
                <div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Payment: Cash on Delivery</p>
                  {order.prescription_id && (
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--primary)' }}>Includes prescription items</p>
                  )}
                </div>
                <div className="order-status">
                  <span className="order-total">₹{order.total.toFixed(2)}</span>
                  {['placed', 'confirmed', 'packed'].includes(order.status) && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelling === order.id}
                    >
                      {cancelling === order.id ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}