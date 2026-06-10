import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2.5rem',
          backgroundColor: '#0c101b',
          color: '#f43f5e',
          fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
          whiteSpace: 'pre-wrap',
          minHeight: '100vh',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{ borderBottom: '1px solid rgba(244,63,94,0.2)', paddingBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>🚨 React Runtime Crash</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>OmniPulse encountered an unhandled execution exception.</p>
          </div>
          
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Error Message:</h4>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', color: '#fda4af', fontWeight: '600' }}>
              {this.state.error?.toString()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <h4 style={{ color: '#fff', margin: 0, fontSize: '0.95rem' }}>Stack Trace:</h4>
            <pre style={{
              backgroundColor: '#020617',
              padding: '1.25rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color, #1e293b)',
              color: '#cbd5e1',
              overflow: 'auto',
              fontSize: '0.8rem',
              lineHeight: '1.5',
              maxHeight: '400px'
            }}>
              {this.state.error?.stack}
              {"\n\nComponent Stack:\n"}
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#f43f5e',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e11d48'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f43f5e'}
            >
              Clear Storage & Reset Cache
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1.2rem',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
