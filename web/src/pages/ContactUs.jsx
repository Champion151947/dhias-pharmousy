import { useState } from 'react';
import { useToast } from '../context/ToastContext';

const contactInfo = [
  { icon: '📱', title: 'WhatsApp', value: 'Chat with us', subtitle: 'Send prescriptions & queries', link: 'https://wa.me/919142225559', color: '#25D366' },
  { icon: '✉️', title: 'Email', value: 'care@dhiaspharmousy.in', subtitle: 'For complaints & feedback', link: 'mailto:care@dhiaspharmousy.in', color: '#EA4335' },
  { icon: '🏠', title: 'Visit Us', value: 'Main Bazaar Road', subtitle: 'Thisuur, Ollur, TN 682310', link: null, color: '#7c3aed' },
];

const faqs = [
  {
    question: 'What are your store hours?',
    answer: 'We are open Monday to Saturday: 8:00 AM - 10:00 PM, Sunday: 9:00 AM - 8:00 PM. Home delivery is available during these hours.'
  },
  {
    question: 'Do you accept prescription uploads?',
    answer: 'Yes! You can upload prescriptions via WhatsApp or through our website. Our pharmacist will verify and prepare your order.'
  },
  {
    question: 'Is there a minimum order for free delivery?',
    answer: 'Free delivery on orders above ₹499. For orders below ₹499, a delivery fee of ₹39 applies. Gold & Platinum members get free delivery on all orders.'
  },
  {
    question: 'Can I return medicines?',
    answer: 'As per drug regulations, medicines cannot be returned once dispensed. However, if you receive damaged or wrong items, contact us within 2 hours for immediate replacement.'
  },
  {
    question: 'Do you offer lab test home collection?',
    answer: 'Yes! We partner with NABL-accredited labs for home sample collection across Thisuur and Ollur. Book via website or call us.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Cash on Delivery (COD) only. Pay when you receive your order. No online payment required.'
  },
];

export function ContactUs() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    showToast('Message sent! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setSubmitting(false);
  };

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, margin: '0 0 16px', background: 'linear-gradient(135deg, var(--primary), #0d9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Contact Us
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: '600px', margin: '0 auto' }}>
          We'd love to hear from you. Reach out for orders, queries, or just to say hello!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {contactInfo.map((info, i) => (
          <a key={i} href={info.link || '#'} className="card" style={{ padding: '28px', display: 'flex', gap: '20px', textDecoration: 'none', color: 'inherit', transition: 'transform 200ms ease, box-shadow 200ms ease', borderLeft: `4px solid ${info.color}` }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: `${info.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
              {info.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>{info.title}</h3>
              <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 500, color: info.color }}>{info.value}</p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>{info.subtitle}</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="card" style={{ padding: '28px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name *</label>
                <input type="text" id="name" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone *</label>
                <input type="tel" id="phone" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" inputMode="numeric" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email *</label>
              <input type="email" id="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="subject">Subject *</label>
              <select id="subject" className="form-select" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                <option value="">Select a topic</option>
                <option value="order">Order Inquiry</option>
                <option value="prescription">Prescription Query</option>
                <option value="lab">Lab Test Booking</option>
                <option value="membership">Membership Plans</option>
                <option value="delivery">Delivery Issue</option>
                <option value="complaint">Complaint/Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="message">Message *</label>
              <textarea id="message" className="form-input" rows={5} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Tell us how we can help..." />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Send Message'}
            </button>
          </form>
        </section>
      </div>

      <section style={{ marginTop: '48px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>Find Us</h2>
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', minHeight: '300px' }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.123!2d76.234!3d10.567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b080f1234567890%3A0xabcdef1234567890!2sMain%20Bazaar%20Road%2C%20Thisuur%2C%20Ollur%2C%20Tamil%20Nadu%20682310!5e0!3m2!1sen!2sin!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Dhiya's Pharmousy Location"
          />
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '16px', fontSize: '14px' }}>
          Main Bazaar Road, Thisuur, Ollur, Tamil Nadu 682310 · Landmark: Near Thisuur Bus Stand
        </p>
      </section>
    </div>
  );
}