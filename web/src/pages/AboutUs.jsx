import { Link } from 'react-router-dom';

const team = [
  { name: 'Dr. Dhiya', role: 'Founder & Chief Pharmacist', qualification: 'Pharm.D, MBA Healthcare', experience: '15+ years', image: null },
  { name: 'Dr. Rajesh Menon', role: 'Clinical Pharmacist', qualification: 'M.Pharm (Pharmacology)', experience: '12+ years', image: null },
  { name: 'Dr. Priya Nair', role: 'Clinical Pharmacist', qualification: 'Pharm.D', experience: '8+ years', image: null },
  { name: 'Mr. Arun Kumar', role: 'Operations Head', qualification: 'MBA Operations', experience: '10+ years', image: null },
];

const milestones = [
  { year: '2015', title: 'Founded', desc: 'Started as a small community pharmacy in Thisuur with a vision to make quality healthcare accessible.' },
  { year: '2017', title: 'Expanded Services', desc: 'Added prescription delivery, lab test booking, and chronic care management services.' },
  { year: '2019', title: 'Digital Launch', desc: 'Launched online platform for medicine ordering and home delivery across Ollur region.' },
  { year: '2021', title: 'NABL Lab Partnership', desc: 'Partnered with NABL-accredited labs for reliable diagnostic services with home collection.' },
  { year: '2023', title: 'Membership Program', desc: 'Introduced Silver, Gold, and Platinum membership plans for affordable healthcare.' },
  { year: '2025', title: '10,000+ Families Served', desc: 'Trusted by over 10,000 families across Thisuur, Ollur, and surrounding areas.' },
];

const values = [
  { icon: '🤝', title: 'Trust & Integrity', desc: 'We believe in transparent pricing, genuine medicines, and honest advice. Your health is our top priority.' },
  { icon: '🏠', title: 'Community First', desc: 'Rooted in Thisuur-Ollur, we understand local health needs and serve with cultural sensitivity and care.' },
  { icon: '🔬', title: 'Quality Assured', desc: 'Every medicine sourced from licensed distributors. Every lab test from NABL-accredited partners.' },
  { icon: '⚡', title: 'Convenience', desc: 'Home delivery, digital prescriptions, online lab booking, and teleconsultation - healthcare at your fingertips.' },
  { icon: '💚', title: 'Compassionate Care', desc: 'Our pharmacists take time to counsel, explain medications, and support your wellness journey.' },
  { icon: '🌱', title: 'Continuous Innovation', desc: 'We constantly improve our services, adopt new technologies, and expand offerings for better care.' },
];

export function AboutUs() {
  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <section style={{ textAlign: 'center', padding: '48px 0', background: 'linear-gradient(180deg, var(--primary-light) 0%, transparent 100%)', borderRadius: 'var(--radius-lg)', marginBottom: '48px' }}>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, var(--primary), #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          About Dhiya's Pharmousy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: '700px', margin: '0 auto' }}>
          Your trusted neighborhood pharmacy since 2015. Combining traditional care with modern convenience for Thisuur, Ollur, and beyond.
        </p>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, margin: '0 0 20px', lineHeight: 1.3 }}>
              Our Story
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '16px', margin: 0 }}>
                Founded in 2015 by <strong>Dr. Dhiya</strong>, Dhiya's Pharmousy began with a simple mission: to bring trusted, affordable healthcare to every household in Thisuur and Ollur. What started as a modest community pharmacy has grown into a comprehensive healthcare partner serving over 10,000 families.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '16px', margin: 0 }}>
                We understand that healthcare isn't just about dispensing medicines—it's about building relationships, understanding your health journey, and being there when you need us most. From the elderly patient managing multiple prescriptions to the young mother needing pediatric care, we serve with the same dedication.
              </p>
              <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '16px', margin: 0 }}>
                Today, we offer medicines, lab diagnostics, chronic care management, and wellness memberships—all with the convenience of home delivery and the assurance of pharmacist-guided care.
              </p>
            </div>
            <Link to="/membership" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '24px' }}>Explore Membership Plans</Link>
          </div>
          <div style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary-light), #ecfdf5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>🏥</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '24px', color: 'var(--primary)' }}>Your Health, Our Promise</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>10,000+ families trust us with their health</p>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                <div><strong style={{ fontSize: '28px', color: 'var(--primary)' }}>10K+</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Families Served</span></div>
                <div><strong style={{ fontSize: '28px', color: 'var(--primary)' }}>50K+</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Orders Delivered</span></div>
                <div><strong style={{ fontSize: '28px', color: 'var(--primary)' }}>98%</strong><br/><span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Customer Satisfaction</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, margin: '0 0 8px' }}>Our Journey</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>Key milestones that shaped our commitment to your health</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
          {milestones.map((milestone, index) => (
            <div key={milestone.year} style={{ display: 'flex', gap: '24px', padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
              <div style={{ flexShrink: 0, width: '80px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', position: 'relative' }}>
                  {milestone.year}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--surface)' }} />
                  {index < milestones.length - 1 && <div style={{ position: 'absolute', top: 'calc(50% + 6px)', left: '50%', transform: 'translateX(-50%)', width: '2px', height: 'calc(100% - 12px)', background: 'var(--border)' }} />}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>{milestone.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>{milestone.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, margin: '0 0 8px' }}>Our Core Values</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>The principles that guide everything we do</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {values.map((value, i) => (
            <div key={i} className="card" style={{ padding: '32px', textAlign: 'center', transition: 'transform 300ms ease, box-shadow 300ms ease' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>{value.icon}</div>
              <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 600 }}>{value.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, margin: '0 0 8px' }}>Meet Our Team</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>Experienced pharmacists and healthcare professionals dedicated to your wellness</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {team.map((member, i) => (
            <div key={i} className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 16px' }}>
                {i === 0 && '👩‍⚕️'}
                {i === 1 && '👨‍⚕️'}
                {i === 2 && '👩‍⚕️'}
                {i === 3 && '👨‍💼'}
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600 }}>{member.name}</h4>
              <p style={{ margin: '0 0 4px', color: 'var(--primary)', fontWeight: 500, fontSize: '14px' }}>{member.role}</p>
              <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: '13px' }}>{member.qualification}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>{member.experience} experience</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, margin: '0 0 8px' }}>Our Services</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '24px' }}>
          {[
            { icon: '💊', title: 'Medicines & Prescriptions', desc: 'Genuine medicines with home delivery. Upload prescriptions for RX medicines.' },
            { icon: '🩸', title: 'Lab Tests & Diagnostics', desc: '10+ tests with home sample collection. NABL-accredited lab partners.' },
            { icon: '📋', title: 'Chronic Care Management', desc: 'Refill reminders, adherence tracking, and pharmacist follow-ups for chronic conditions.' },
            { icon: '💎', title: 'Membership Plans', desc: 'Silver, Gold, Platinum plans with up to 25% savings on healthcare.' },
            { icon: '📱', title: 'Teleconsultation', desc: 'Speak with our pharmacists for medication counseling and health queries.' },
            { icon: '🚚', title: 'Free Home Delivery', desc: 'Fast delivery across Thisuur, Ollur, and nearby areas. COD available.' },
          ].map((service, i) => (
            <div key={i} className="card" style={{ padding: '24px', display: 'flex', gap: '16px', transition: 'transform 300ms ease' }}>
              <div style={{ fontSize: '32px', flexShrink: 0 }}>{service.icon}</div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>{service.title}</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '48px 24px', background: 'linear-gradient(135deg, var(--primary), #0d9488)', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ color: 'white', margin: '0 0 16px', fontSize: 'clamp(28px, 3vw, 36px)' }}>Visit Us In Person</h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '24px', fontSize: '18px' }}>
          Main Bazaar Road, Thisuur, Ollur, Tamil Nadu 682310
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/contact" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>Get Directions</Link>
        </div>
      </section>
    </div>
  );
}