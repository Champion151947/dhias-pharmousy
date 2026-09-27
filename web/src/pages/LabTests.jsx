import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const labTests = [
  {
    id: 1,
    name: 'Complete Blood Count (CBC)',
    category: 'Blood Test',
    description: 'Comprehensive blood test to evaluate overall health and detect disorders like anemia, infection, and leukemia.',
    price: 450,
    mrp: 600,
    duration: '2-4 hours',
    preparation: 'No fasting required',
    popular: true,
    icon: '🩸'
  },
  {
    id: 2,
    name: 'Lipid Profile (Cholesterol Test)',
    category: 'Blood Test',
    description: 'Measures cholesterol levels including HDL, LDL, triglycerides, and total cholesterol for heart health assessment.',
    price: 650,
    mrp: 850,
    duration: '4-6 hours',
    preparation: '9-12 hours fasting required',
    popular: true,
    icon: '🫀'
  },
  {
    id: 3,
    name: 'Thyroid Function Test (T3, T4, TSH)',
    category: 'Blood Test',
    description: 'Evaluates thyroid gland function to diagnose hypothyroidism, hyperthyroidism, and monitor treatment.',
    price: 550,
    mrp: 750,
    duration: '4-6 hours',
    preparation: 'No special preparation',
    popular: true,
    icon: '🦋'
  },
  {
    id: 4,
    name: 'Blood Glucose (Fasting & PP)',
    category: 'Diabetes',
    description: 'Measures fasting and post-prandial blood sugar levels for diabetes screening and monitoring.',
    price: 180,
    mrp: 250,
    duration: '2-3 hours',
    preparation: '10-12 hours fasting for fasting sample',
    popular: true,
    icon: '🍬'
  },
  {
    id: 5,
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Diabetes',
    description: 'Shows average blood sugar levels over the past 2-3 months. Essential for diabetes management.',
    price: 400,
    mrp: 550,
    duration: '4-6 hours',
    preparation: 'No fasting required',
    popular: false,
    icon: '📊'
  },
  {
    id: 6,
    name: 'Liver Function Test (LFT)',
    category: 'Blood Test',
    description: 'Comprehensive panel to assess liver health including enzymes, proteins, and bilirubin levels.',
    price: 650,
    mrp: 850,
    duration: '4-6 hours',
    preparation: 'No fasting required',
    popular: false,
    icon: '🫁'
  },
  {
    id: 7,
    name: 'Kidney Function Test (KFT/RFT)',
    category: 'Blood Test',
    description: 'Evaluates kidney function through urea, creatinine, electrolytes, and other markers.',
    price: 600,
    mrp: 800,
    duration: '4-6 hours',
    preparation: 'No fasting required',
    popular: false,
    icon: '🫘'
  },
  {
    id: 8,
    name: 'Vitamin D (25-OH) Test',
    category: 'Vitamins',
    description: 'Measures Vitamin D levels to detect deficiency linked to bone health, immunity, and fatigue.',
    price: 950,
    mrp: 1300,
    duration: '24 hours',
    preparation: 'No fasting required',
    popular: true,
    icon: '☀️'
  },
  {
    id: 9,
    name: 'Vitamin B12 Test',
    category: 'Vitamins',
    description: 'Checks B12 levels essential for nerve function, red blood cells, and DNA synthesis.',
    price: 750,
    mrp: 1000,
    duration: '24 hours',
    preparation: 'No fasting required',
    popular: false,
    icon: '💊'
  },
  {
    id: 10,
    name: 'Blood Pressure Monitoring (24hr Ambulatory)',
    category: 'Cardiac',
    description: 'Continuous 24-hour BP monitoring to diagnose white-coat hypertension and assess treatment.',
    price: 1200,
    mrp: 1600,
    duration: '24 hours + report',
    preparation: 'Wear comfortable clothing',
    popular: false,
    icon: '💓'
  }
];

const categories = ['All', 'Blood Test', 'Diabetes', 'Vitamins', 'Cardiac'];

export function LabTests() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();
  const { showToast } = useToast();

  const filteredTests = labTests.filter(test => {
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    const matchesSearch = test.name.toLowerCase().includes(search.toLowerCase()) ||
                          test.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (test) => {
    try {
      await addItem(`lab-${test.id}`, 1);
      showToast(`${test.name} added to cart`);
    } catch (error) {
      showToast('Failed to add test', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, margin: '0 0 8px' }}>Lab Tests & Diagnostics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 18px)', margin: 0 }}>
          Book trusted lab tests with home sample collection. Accurate results, delivered digitally.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search tests..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredTests.map(test => (
          <article key={test.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                {test.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'uppercase' }}>{test.category}</span>
                  {test.popular && <span className="badge badge-warning" style={{ fontSize: '11px' }}>Popular</span>}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>{test.name}</h3>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>{test.description}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {test.duration}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                {test.preparation}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>₹{test.price}</span>
                {test.mrp > test.price && (
                  <span style={{ marginLeft: '8px', fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{test.mrp}</span>
                )}
                {test.mrp > test.price && (
                  <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '11px' }}>
                    {Math.round(((test.mrp - test.price) / test.mrp) * 100)}% OFF
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleAddToCart(test)}
                style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
              >
                Add to Cart
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredTests.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 16px' }} aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3 style={{ margin: '0 0 8px' }}>No tests found</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Try adjusting your filters or search terms</p>
        </div>
      )}

      <div style={{ marginTop: '48px', padding: '32px', background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--primary)' }}>Why Choose Our Lab Services?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <div><strong>Home Collection</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Trained phlebotomists visit your home</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
              <div><strong>NABL Accredited</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Quality certified lab partners</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <div><strong>Digital Reports</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Get results on WhatsApp & email</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <div><strong>Fast Turnaround</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Most reports within 24 hours</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}