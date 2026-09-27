import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'var(--error)', marginBottom: '16px' }}>Something went wrong</h1>
          <pre style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', padding: '20px', background: 'var(--bg)', borderRadius: '8px', overflow: 'auto', color: 'var(--text)', fontSize: '14px' }}>
            {this.state.error && this.state.error.toString()}
            {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '24px' }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}