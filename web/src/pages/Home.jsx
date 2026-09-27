import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/client';
import { ProductCard } from '../components/ProductCard';

const features = [
  { icon: '🚚', title: 'Fast Home Delivery', desc: 'Medicines & lab reports delivered to your doorstep in Thisuur & Ollur' },
  { icon: '💊', title: 'Genuine Medicines', desc: '100% authentic products sourced from licensed distributors only' },
  { icon: '💰', title: 'Pay on Delivery', desc: 'Cash on delivery - no online payment needed, pay when you receive' },
  { icon: '👨‍⚕️', title: 'Expert Pharmacist Support', desc: 'Licensed pharmacists available for consultation & dosage guidance' },
  { icon: '🩸', title: 'Lab Tests at Home', desc: '10+ tests with home sample collection from NABL-accredited labs' },
  { icon: '💎', title: 'Membership Savings', desc: 'Up to 25% off on medicines & tests with Silver, Gold, Platinum plans' },
];

const stats = [
  { value: '10,000+', label: 'Families Served' },
  { value: '50,000+', label: 'Orders Delivered' },
  { value: '500+', label: 'Medicines Available' },
  { value: '4.8★', label: 'Google Rating' },
];

export function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    productsApi.list({ limit: 8, sort: 'newest' })
      .then(data => { setProducts(data.products || []); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Your Trusted Neighborhood Pharmacy</h1>
            <p>Quality medicines, lab tests with home collection, and expert pharmacist care — delivered to your doorstep in Thisuur & Ollur.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">Browse Medicines</Link>
              <Link to="/lab-tests" className="btn btn-secondary btn-lg">Book Lab Tests</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Dhiya's Pharmousy?</h2>
            <p>Everything you need for your family's health, delivered with care</p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <Link key={i} to={i < 2 ? (i === 0 ? '/products' : '/lab-tests') : (i === 4 ? '/lab-tests' : '/membership')} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="products-section">
        <div className="container">
          <div className="section-header-with-link">
            <div>
              <h2>Featured Medicines</h2>
              <p>Popular medicines handpicked for you</p>
            </div>
            <Link to="/products" className="btn btn-ghost">View All Medicines</Link>
          </div>

          {loading ? (
            <div className="products-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-card skeleton">
                  <div className="product-image skeleton" />
                  <div className="product-info">
                    <div className="skeleton-text" />
                    <div className="skeleton-text short" />
                    <div className="skeleton-price" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card error-card">
              <p className="error-message">Failed to load products. Please try again later.</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="card empty-card">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Services</h2>
            <p>Complete healthcare for your family</p>
          </div>
          <div className="services-grid">
            {[
              { icon: '🩸', title: 'Lab Tests & Diagnostics', desc: '10+ tests including CBC, Lipid Profile, Thyroid, Diabetes, Vitamins. Home sample collection available.', link: '/lab-tests', cta: 'Book Test' },
              { icon: '💎', title: 'Membership Plans', desc: 'Silver (₹1,000), Gold (₹2,500), Platinum (₹5,000) - Save up to 25% on medicines & tests.', link: '/membership', cta: 'View Plans' },
              { icon: '📋', title: 'Chronic Care Management', desc: 'Auto-refill reminders, adherence tracking, pharmacist follow-ups for diabetes, BP, thyroid.', link: '/contact', cta: 'Learn More' },
              { icon: '📱', title: 'Teleconsultation', desc: 'Speak with our pharmacists for medication counseling, dosage guidance, and health queries.', link: '/contact', cta: 'Book Call' },
              { icon: '🏥', title: 'About Our Pharmacy', desc: 'Serving Thisuur & Ollur since 2015. Meet our team, read our story, and visit us in person.', link: '/about', cta: 'Read Story' },
              { icon: '⭐', title: 'Customer Reviews', desc: 'Read 147+ genuine Google reviews from families in your neighborhood.', link: '/reviews', cta: 'Read Reviews' },
            ].map((service, i) => (
              <Link key={i} to={service.link} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <span className="btn btn-primary btn-sm">{service.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Experience Better Healthcare?</h2>
          <p>Join thousands of families who trust Dhiya's Pharmousy for their medicines, lab tests, and wellness needs.</p>
          <div className="cta-actions">
            <Link to="/products" className="btn btn-primary btn-lg">Order Medicines Now</Link>
            <Link to="/membership" className="btn btn-outline btn-lg">Explore Membership</Link>
          </div>
          <p className="contact-info">📍 Main Bazaar Road, Thisuur, Ollur, TN 682310</p>
        </div>
      </section>
    </>
  );
}