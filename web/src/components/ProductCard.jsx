import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      showToast(`${product.name} added to cart`);
      setQuantity(1);
    } catch (error) {
      showToast(error.message || 'Failed to add to cart', 'error');
    } finally {
      setAdding(false);
    }
  };

  const increment = () => setQuantity(q => Math.min(q + 1, product.stock || 99));
  const decrement = () => setQuantity(q => Math.max(q - 1, 1));

  const discount = product.mrp && product.price < product.mrp
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <article className="card product-card">
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 17" />
          </svg>
        )}
        {discount > 0 && (
          <span className="discount-badge">-{discount}%</span>
        )}
        {product.rx_required && (
          <span className="rx-badge">RX</span>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.brand_name && <p className="product-brand">{product.brand_name}</p>}
        <div className="product-meta">
          <span className="product-price">₹{product.price.toFixed(2)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="product-mrp">₹{product.mrp.toFixed(2)}</span>
          )}
          {discount > 0 && <span className="badge badge-success">{discount}% OFF</span>}
        </div>
        {product.rx_required && <span className="product-rx">RX Required</span>}
        <div className="product-actions">
          <div className="qty-selector" role="group" aria-label="Quantity">
            <button className="qty-btn" onClick={decrement} aria-label="Decrease quantity" disabled={quantity <= 1}>−</button>
            <span className="qty-value" aria-live="polite">{quantity}</span>
            <button className="qty-btn" onClick={increment} aria-label="Increase quantity" disabled={quantity >= (product.stock || 99)}>+</button>
          </div>
          <button
            className="btn btn-primary add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={adding || (product.stock !== undefined && product.stock <= 0)}
            aria-label={`Add ${product.name} to cart`}
          >
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
        {(product.stock !== undefined && product.stock <= 0) && (
          <p style={{ marginTop: '8px', color: 'var(--error)', fontSize: '14px' }}>Out of Stock</p>
        )}
      </div>
    </article>
  );
}