import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ordersApi, addressesApi, prescriptionsApi } from '../api/client';

export function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, loading: cartLoading } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState('');
  const [notes, setNotes] = useState('');

  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: 'Thisuur',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
  });

  // Schedule H/H1 medicines cannot be sold without a valid prescription. The
  // server refuses the order regardless, so the UI collects the prescription up
  // front and reports its review state rather than failing at the last step.
  const rxItems = items.filter((item) => item.rx_required);
  const needsPrescription = rxItems.length > 0;
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  const approvedPrescription =
    prescriptions.find((p) => p.id === selectedPrescription && p.status === 'approved') || null;
  const pendingPrescription =
    prescriptions.find((p) => p.id === selectedPrescription && p.status === 'pending') || null;

  const fetchAddresses = async () => {
    try {
      const data = await addressesApi.list();
      const addr = data.addresses || [];
      setAddresses(addr);
      const def = addr.find(a => a.is_default) || addr[0];
      if (def) setSelectedAddressId(def.id);
    } catch (err) {
      console.error('Failed to load addresses', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    if (!needsPrescription || !user) return;
    (async () => {
      try {
        const data = await prescriptionsApi.list();
        const mine = data.prescriptions || [];
        setPrescriptions(mine);
        const usable = mine.find((p) => p.status === 'approved') || mine[0];
        if (usable) setSelectedPrescription(usable.id);
      } catch (err) {
        console.error('Failed to load prescriptions', err);
      }
    })();
  }, [needsPrescription, user]);

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const data = await prescriptionsApi.upload(file, { doctor_name: doctorName || undefined });
      setPrescriptions((prev) => [data.prescription, ...prev]);
      setSelectedPrescription(data.prescription.id);
      showToast('Prescription uploaded. Our pharmacist will review it shortly.');
    } catch (err) {
      showToast(err.message || 'Could not upload the prescription', 'error');
    } finally {
      setUploading(false);
    }
  };

  const deliveryFee = subtotal >= 499 ? 0 : 39;
  const total = subtotal + deliveryFee;

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await addressesApi.create(newAddress);
      setAddresses(prev => [...prev, data.address]);
      setSelectedAddressId(data.address.id);
      setShowAddressForm(false);
      setNewAddress({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', landmark: '', city: 'Thisuur', district: '', state: 'Tamil Nadu', pincode: '' });
      showToast('Address saved');
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { showToast('Please select a delivery address', 'error'); return; }
    if (items.length === 0) { showToast('Your cart is empty', 'error'); return; }
    if (needsPrescription && !approvedPrescription) {
      showToast(
        pendingPrescription
          ? 'Your prescription is still being reviewed. We will notify you once it is approved.'
          : 'Please upload a prescription for the medicines marked Rx.',
        'error',
      );
      return;
    }

    setPlacingOrder(true);
    try {
      await ordersApi.create({
        address: selectedAddressId,
        delivery_slot: deliverySlot || null,
        payment_method: 'cod',
        notes: notes || null,
        ...(approvedPrescription ? { prescription_id: approvedPrescription.id } : {}),
      });
      showToast('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      if (err.code === 'PRESCRIPTION_PENDING') {
        showToast('Your prescription is still being reviewed by our pharmacist.', 'error');
      } else if (err.code === 'PRESCRIPTION_REJECTED') {
        showToast('That prescription was not accepted. Please upload a clearer photo.', 'error');
      } else if (err.code === 'PRESCRIPTION_REQUIRED') {
        showToast('Please upload a prescription for the medicines marked Rx.', 'error');
      } else {
        showToast(err.message || 'Failed to place order', 'error');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading checkout...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 12px' }}>Sign in to Checkout</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please sign in or create an account to place your order.</p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            <span>Continue with Google</span>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 12px' }}>Your Cart is Empty</h2>
          <Link to="/products" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '16px' }}>Browse Medicines</Link>
        </div>
      </div>
    );
  }

  const slots = ['09:00 AM - 01:00 PM', '01:00 PM - 05:00 PM', '05:00 PM - 09:00 PM'];

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 style={{ marginBottom: '24px' }}>Checkout</h1>
        <div className="checkout-grid">
          <div>
            <section className="checkout-section" style={{ marginBottom: '24px' }}>
              <h2 className="checkout-section-title">Delivery Address</h2>
              
              {addresses.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  {addresses.map(addr => (
                    <label key={addr.id} className={`address-option ${selectedAddressId === addr.id ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={e => setSelectedAddressId(Number(e.target.value))}
                      />
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 500 }}>{addr.full_name}</p>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-muted)' }}>
                          {addr.phone}
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}{addr.landmark ? `, ${addr.landmark}` : ''}
                          <br />
                          {addr.city}, {addr.district ? `${addr.district}, ` : ''}{addr.state} - {addr.pincode}
                        </p>
                        {addr.is_default && <span className="badge badge-info" style={{ marginTop: '8px', fontSize: '11px' }}>Default</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button type="button" className="btn btn-secondary" onClick={() => setShowAddressForm(true)} style={{ width: '100%' }}>
                + Add New Address
              </button>

              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="card" style={{ marginTop: '16px', padding: '20px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="label">Label</label>
                      <select id="label" className="form-select" value={newAddress.label} onChange={e => setNewAddress(prev => ({ ...prev, label: e.target.value }))}>
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="full_name">Full Name *</label>
                    <input type="text" id="full_name" className="form-input" required value={newAddress.full_name} onChange={e => setNewAddress(prev => ({ ...prev, full_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone *</label>
                    <input type="tel" id="phone" className="form-input" required value={newAddress.phone} onChange={e => setNewAddress(prev => ({ ...prev, phone: e.target.value }))} inputMode="numeric" pattern="[0-9]{10}" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="line1">Address Line 1 *</label>
                    <input type="text" id="line1" className="form-input" required value={newAddress.line1} onChange={e => setNewAddress(prev => ({ ...prev, line1: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="line2">Address Line 2</label>
                    <input type="text" id="line2" className="form-input" value={newAddress.line2} onChange={e => setNewAddress(prev => ({ ...prev, line2: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="landmark">Landmark</label>
                    <input type="text" id="landmark" className="form-input" value={newAddress.landmark} onChange={e => setNewAddress(prev => ({ ...prev, landmark: e.target.value }))} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="city">City *</label>
                      <input type="text" id="city" className="form-input" required value={newAddress.city} onChange={e => setNewAddress(prev => ({ ...prev, city: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="state">State *</label>
                      <input type="text" id="state" className="form-input" required value={newAddress.state} onChange={e => setNewAddress(prev => ({ ...prev, state: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="district">District</label>
                      <input type="text" id="district" className="form-input" value={newAddress.district} onChange={e => setNewAddress(prev => ({ ...prev, district: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pincode">PIN Code *</label>
                      <input type="text" id="pincode" className="form-input" required value={newAddress.pincode} onChange={e => setNewAddress(prev => ({ ...prev, pincode: e.target.value }))} pattern="[0-9]{6}" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                      {saving ? <span className="spinner" /> : 'Save Address'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddressForm(false)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              )}
            </section>

            {needsPrescription && (
              <section className="checkout-section" style={{ marginBottom: '24px' }}>
                <h2 className="checkout-section-title">Prescription Required</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  {rxItems.map((item) => item.name).join(', ')} can only be dispensed against a
                  valid prescription. Upload a clear photo or PDF and our pharmacist will review it.
                </p>

                {prescriptions.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    {prescriptions.map((p) => (
                      <label
                        key={p.id}
                        className={`address-option ${selectedPrescription === p.id ? 'selected' : ''}`}
                        style={{ display: 'block', marginBottom: '8px' }}
                      >
                        <input
                          type="radio"
                          name="prescription"
                          checked={selectedPrescription === p.id}
                          onChange={(e) => setSelectedPrescription(Number(e.target.value))}
                        />
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '14px' }}>{p.file_name}</p>
                          <span
                            className="badge"
                            style={{
                              background:
                                p.status === 'approved'
                                  ? 'var(--success)'
                                  : p.status === 'rejected'
                                    ? 'var(--danger)'
                                    : 'var(--warning, #f59e0b)',
                              color: '#fff',
                              fontSize: '11px',
                            }}
                          >
                            {p.status === 'pending' ? 'Awaiting review' : p.status}
                          </span>
                          {p.review_note && (
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {p.review_note}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="doctor">Prescribing doctor (optional)</label>
                  <input
                    type="text"
                    id="doctor"
                    className="form-input"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. ..."
                  />
                </div>

                <label className="btn btn-secondary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                  {uploading ? <span className="spinner" /> : 'Upload Prescription'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handlePrescriptionUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {approvedPrescription ? (
                  <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--success)' }}>
                    ✓ Prescription approved — you can place this order.
                  </p>
                ) : pendingPrescription ? (
                  <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Your prescription is with our pharmacist. Checkout unlocks once it is approved.
                  </p>
                ) : null}
              </section>
            )}

            <section className="checkout-section" style={{ marginBottom: '24px' }}>
              <h2 className="checkout-section-title">Delivery Slot</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {slots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    className={`btn ${deliverySlot === slot ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDeliverySlot(deliverySlot === slot ? '' : slot)}
                    style={{ flex: '1 1 calc(33.333% - 8px)', minWidth: '140px' }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section-title">Order Notes (Optional)</h2>
              <textarea
                className="form-input"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special instructions for delivery or pharmacist..."
              />
            </section>
          </div>

          <aside>
            <div className="card order-summary">
              <h2 className="checkout-section-title">Order Summary</h2>
              <div style={{ marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} className="summary-row" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 0' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', background: 'var(--bg)', overflow: 'hidden', flexShrink: 0 }}>
                      {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span></div>
              <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              
              <p style={{ margin: '16px 0 0', fontSize: '13px', color: 'var(--success)', textAlign: 'center' }}>
                ✓ Pay on Delivery (Cash Only)
              </p>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder ||
                  !selectedAddressId ||
                  (needsPrescription && !approvedPrescription)
                }
              >
                {placingOrder ? <span className="spinner" /> : `Place Order - ₹${total.toFixed(2)}`}
              </button>

              <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                Your order will be confirmed via call before delivery
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}