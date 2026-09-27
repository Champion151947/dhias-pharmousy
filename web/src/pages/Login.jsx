import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { login, signup, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Redirect to={from} replace />;
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.phone, form.password);
      }
      showToast(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      navigate(from, { replace: true });
    } catch (error) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1 className="login-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="login-subtitle">
          {mode === 'login' 
            ? 'Sign in to access your orders and save your cart' 
            : 'Join Dhiya\'s Pharmousy for fast medicine delivery'}
        </p>

        <GoogleLoginButton onSuccess={handleGoogleLogin} />

        <div className="divider">or continue with email</div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  placeholder="9876543210"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete={mode === 'login' ? 'email' : 'email'}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <span className="spinner" aria-hidden="true"></span> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' }); }}
            style={{ padding: 0, fontSize: '14px' }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function Redirect({ to, replace }) {
  navigate(to, { replace });
  return null;
}