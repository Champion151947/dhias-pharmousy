import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '96px', fontWeight: 700, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>404</h1>
      <h2 style={{ margin: '16px 0 8px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
    </div>
  );
}