import React, { Component, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React Component Tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#080d1a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#0e172e',
            border: '1px solid #f43f5e',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f43f5e', marginBottom: '0.75rem' }}>
              Application Render Warning
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              An unexpected initialization error occurred. Please refresh the page or clear browser cache.
            </p>
            <pre style={{
              backgroundColor: '#050914',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              color: '#fb7185',
              overflowX: 'auto',
              textAlign: 'left',
              marginBottom: '1.5rem',
              border: '1px solid #1e2d54'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
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

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
