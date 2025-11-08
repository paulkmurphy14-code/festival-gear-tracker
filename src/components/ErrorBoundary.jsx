import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#2d2d2d',
            borderRadius: '8px',
            padding: '24px',
            border: '2px solid #ff6b6b'
          }}>
            <h1 style={{
              color: '#ff6b6b',
              fontSize: '24px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Oops! Something went wrong
            </h1>

            <p style={{
              color: '#888',
              fontSize: '14px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              The application encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#1a1a1a',
                padding: '16px',
                borderRadius: '6px',
                marginBottom: '24px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#ff6b6b',
                overflowX: 'auto'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#ffa500',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Return to Home
            </button>

            <p style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              If this problem persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
