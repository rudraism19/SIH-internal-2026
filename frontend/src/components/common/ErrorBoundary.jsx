import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          minHeight: '360px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: 16,
          }}>
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark, #0B1F33)', marginBottom: 8 }}>
            Component Encountered an Issue
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748B)', maxWidth: 540, marginBottom: 16 }}>
            An unexpected error occurred while rendering this module. You can reload this view or check the details below.
          </p>
          {this.state.error && (
            <pre style={{ textAlign: 'left', background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '12px', maxWidth: '800px', width: '90%', overflow: 'auto', marginBottom: 16, border: '1px solid #fca5a5' }}>
              {this.state.error.stack || this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              backgroundColor: 'var(--navy, #0B1F33)',
              color: '#ffffff',
              borderRadius: 8,
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
