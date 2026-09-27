import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const membershipPlans = [
  {
    id: 'silver',
    name: 'Silver Plan',
    tagline: 'Essential Care for Individuals',
    price: 1000,
    period: 'year',
    popular: false,
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: '🥈',
    features: [
      { text: '10% off on all medicines', included: true },
      { text: '5% off on lab tests', included: true },
      { text: 'Free delivery on orders above ₹299', included: true },
      { text: 'Priority customer support', included: true },
      { text: 'Health checkup reminder alerts', included: true },
      { text: 'Annual health assessment (basic)', included: false },
      { text: 'Family member discounts', included: false },
      { text: 'Teleconsultation with pharmacist', included: false },
    ],
    savings: 'Save up to ₹3,000/year',
    cta: 'Get Started',
  },
  {
    id: 'gold',
    name: 'Gold Plan',
    tagline: 'Complete Care for Families',
    price: 2500,
    period: 'year',
    popular: true,
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: '🥇',
    features: [
      { text: '15% off on all medicines', included: true },
      { text: '15% off on lab tests', included: true },
      { text: 'Free delivery on ALL orders', included: true },
      { text: '24/7 priority customer support', included: true },
      { text: 'Health checkup reminder alerts', included: true },
      { text: 'Annual health assessment (comprehensive)', included: true },
      { text: 'Add up to 3 family members', included: true },
      { text: '2 free teleconsultations/year', included: true },
      { text: 'Medicine refill auto-reminders', included: true },
      { text: 'Exclusive member offers', included: true },
    ],
    savings: 'Save up to ₹12,000/year',
    cta: 'Most Popular - Join Now',
  },
  {
    id: 'platinum',
    name: 'Platinum Plan',
    tagline: 'Premium Wellness Experience',
    price: 5000,
    period: 'year',
    popular: false,
    color: '#0d9488',
    bgColor: '#ccfbf1',
    icon: '💎',
    features: [
      { text: '20% off on all medicines', included: true },
      { text: '25% off on lab tests', included: true },
      { text: 'Free express delivery (2hr)', included: true },
      { text: 'Dedicated care manager', included: true },
      { text: 'Health checkup reminder alerts', included: true },
      { text: 'Annual full-body health checkup', included: true },
      { text: 'Add up to 5 family members', included: true },
      { text: 'Unlimited teleconsultations', included: true },
      { text: 'Medicine refill auto-reminders', included: true },
      { text: 'Exclusive member offers', included: true },
      { text: 'Home nursing care discount (20%)', included: true },
      { text: 'Wellness workshops access', included: true },
      { text: 'Personalized health reports', included: true },
    ],
    savings: 'Save up to ₹30,000/year',
    cta: 'Get Premium Care',
  }
];

export function Membership() {
  const [selectedPlan, setSelectedPlan] = useState('gold');
  const { showToast } = useToast();

  const handleSelect = (planId) => {
    setSelectedPlan(planId);
    showToast(`${membershipPlans.find(p => p.id === planId).name} selected`);
  };

  return (
    <div className="container" style={{ padding: '40px 16px' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 48px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
          Membership Plans
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 18px)', margin: 0 }}>
          Choose a plan that fits your health needs. Save on medicines, lab tests, and enjoy exclusive benefits.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {membershipPlans.map((plan, index) => (
          <article
            key={plan.id}
            className="card"
            style={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              position: 'relative',
              border: selectedPlan === plan.id ? `2px solid ${plan.color}` : '1px solid var(--border)',
              background: selectedPlan === plan.id ? `${plan.bgColor}20` : 'var(--surface)',
              boxShadow: selectedPlan === plan.id ? `0 0 0 4px ${plan.color}20, var(--shadow-md)` : 'var(--shadow)',
              transition: 'all 200ms ease',
            }}
            onClick={() => handleSelect(plan.id)}
          >
            {plan.popular && (
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: 'white', padding: '4px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(251,191,36,0.3)' }}>
                ⭐ Most Popular
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: plan.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>
                {plan.icon}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: plan.color }}>{plan.name}</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '15px' }}>{plan.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, color: plan.color }}>₹{plan.price.toLocaleString()}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>/{plan.period}</span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: plan.color, fontWeight: 500, textAlign: 'center', marginBottom: '24px' }}>{plan.savings}</p>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: feature.included ? 'var(--text)' : 'var(--text-muted)', opacity: feature.included ? 1 : 0.5 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={feature.included ? plan.color : 'var(--border)'} strokeWidth="2.5" style={{ flexShrink: 0 }} aria-hidden="true">
                    {feature.included ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
                  </svg>
                  <span style={{ textDecoration: feature.included ? 'none' : 'line-through' }}>{feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              className="btn"
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 600,
                background: selectedPlan === plan.id ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` : (plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` : 'var(--surface)'),
                color: selectedPlan === plan.id || plan.popular ? 'white' : 'var(--text)',
                border: selectedPlan === plan.id || plan.popular ? 'none' : '1px solid var(--border)',
                boxShadow: selectedPlan === plan.id || plan.popular ? `0 4px 16px ${plan.color}40` : 'none',
              }}
              onClick={e => { e.stopPropagation(); handleSelect(plan.id); }}
            >
              {plan.cta}
            </button>
          </article>
        ))}
      </div>

      <div style={{ maxWidth: '1100px', margin: '48px auto 0', padding: '0 16px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px', textAlign: 'center', fontSize: '22px' }}>Why Join Our Membership?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {[
              { icon: '💰', title: 'Massive Savings', desc: 'Up to 25% off on medicines and lab tests. Save thousands every year on healthcare.' },
              { icon: '🏠', title: 'Free Delivery', desc: 'No delivery charges ever. Gold gets free standard, Platinum gets 2-hour express delivery free.' },
              { icon: '👨‍👩‍👧‍👦', title: 'Family Coverage', desc: 'Add family members to your plan. Gold covers 3, Platinum covers 5 additional members.' },
              { icon: '📞', title: 'Priority Support', desc: 'Dedicated care manager for Platinum. 24/7 priority support for Gold and above.' },
              { icon: '🩺', title: 'Health Monitoring', desc: 'Annual health checkups, refill reminders, and personalized wellness reports included.' },
              { icon: '🎁', title: 'Exclusive Perks', desc: 'Member-only offers, wellness workshops, nursing care discounts, and more.' },
            ].map((benefit, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', padding: '20px', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{benefit.icon}</div>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{benefit.title}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{benefit.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', padding: '32px', background: 'linear-gradient(135deg, var(--primary-light), #ecfdf5)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ margin: '0 0 12px', color: 'var(--primary)' }}>Have Questions?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Our team is here to help you choose the right plan for your family.</p>
          <a href="tel:+919142225559" className="btn btn-primary btn-lg">📞 Call Us: +91 9142225559</a>
        </div>
      </div>
    </div>
  );
}