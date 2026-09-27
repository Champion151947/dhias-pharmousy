import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { CartDrawer } from './components/CartDrawer';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { LabTests } from './pages/LabTests';
import { Membership } from './pages/Membership';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { GoogleReviews } from './pages/GoogleReviews';
import { Login } from './pages/Login';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { NotFound } from './pages/NotFound';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/lab-tests" element={<LabTests />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/reviews" element={<GoogleReviews />} />
      <Route path="/login" element={<Login />} />
      <Route path="/checkout" element={
        <PrivateRoute><Checkout /></PrivateRoute>
      } />
      <Route path="/orders" element={
        <PrivateRoute><Orders /></PrivateRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <a href="#main" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main" style={{ flex: 1 }}>
        <AppRoutes />
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0', marginTop: 'auto', background: 'var(--surface)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0 }}>© 2025 Dhiya's Pharmousy. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="tel:+919142225559" style={{ color: 'var(--text-muted)' }}>📞 +91 9142225559</a>
            <a href="mailto:care@dhiaspharmousy.in" style={{ color: 'var(--text-muted)' }}>✉️ care@dhiaspharmousy.in</a>
          </div>
        </div>
      </footer>
      <CartDrawer />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}