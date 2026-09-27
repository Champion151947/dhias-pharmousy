import { useState, useEffect, useMemo } from 'react';
import { productsApi } from '../api/client';
import { ProductCard } from '../components/ProductCard';

export function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: '', search: '', sort: 'newest', rx: false });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productsApi.list({ limit: 100 }),
          productsApi.categories(),
        ]);
        if (mounted) {
          setProducts(productsData.products || []);
          setCategories(categoriesData.categories || []);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filters.category && p.category_slug !== filters.category) return false;
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !p.brand_name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.rx && !p.rx_required) return false;
      return true;
    }).sort((a, b) => {
      switch (filters.sort) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-asc': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [products, filters]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '32px 16px' }}>
        <h1 style={{ marginBottom: '24px' }}>Medicines</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card product-card" style={{ minHeight: '380px' }}>
              <div className="product-image" style={{ background: 'var(--bg)' }} />
              <div className="product-info" style={{ padding: '16px' }}>
                <div style={{ height: '20px', background: 'var(--border)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '14px', background: 'var(--border)', borderRadius: '4px', width: '60%', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ height: '24px', width: '80px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '14px', width: '50px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px' }}>Medicines & Healthcare</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Find your medicines and healthcare products</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
        <aside style={{ position: 'sticky', top: '88px', height: 'fit-content' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Filters</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search medicines..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Sort By</label>
              <select
                className="form-select"
                value={filters.sort}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={filters.rx}
                onChange={e => setFilters(f => ({ ...f, rx: e.target.checked }))}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span>Prescription Only (RX)</span>
            </label>
          </div>
        </aside>

        <main>
          <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Showing {filteredProducts.length} of {products.length} products
          </div>
          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }} aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3 style={{ margin: '0 0 8px' }}>No products found</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Try adjusting your filters or search terms</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}