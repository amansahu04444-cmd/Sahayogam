import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ChatProvider } from './context/ChatContext'
import './index.css'

// Firebase Debug (only in development)
if (import.meta.env.DEV) {
  const { debugFirebaseConfig } = await import('./config/firebaseDebug')
  debugFirebaseConfig()
}

// ERROR BOUNDARY - CATCH ALL APP CRASHES
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 APP CRASH BOUNDARY:', error)
    console.error('Error Info:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#050506',
          color: '#fff',
          fontFamily: 'monospace',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#ef4444' }}>⚠️ Application Error</h1>
          <p style={{ fontSize: '16px', marginBottom: '20px', maxWidth: '600px' }}>
            The application encountered an error and cannot continue. Please refresh the page or contact support.
          </p>
          <details style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px',
            textAlign: 'left',
            maxWidth: '100%',
            overflowX: 'auto'
          }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#fbbf24' }}>
              Error Details (click to expand)
            </summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '12px', color: '#ef4444' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px',
              padding: '12px 24px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>,
)
