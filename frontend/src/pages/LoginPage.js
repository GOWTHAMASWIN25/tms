import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      addToast(`Welcome back, ${data.user?.username || 'User'}!`, 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    addToast(`Filled demo credentials for: ${demoEmail}`, 'info');
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card glass-card">
        {/* Glow & Brand Header */}
        <div className="login-header">
          <div className="login-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to your TMS portal account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner"></span> Authenticating...
              </>
            ) : (
              'Sign In to Dashboard →'
            )}
          </button>
        </form>

        {/* Demo Fast Fill Pill */}
        <div className="demo-credentials-card">
          <div className="demo-header">
            <span>⚡ Quick Demo Login Credentials</span>
          </div>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-btn"
              onClick={() => fillDemo('admin@example.com', 'Passw0rd!')}
            >
              SuperAdmin
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => fillDemo('staff@example.com', 'Passw0rd!')}
            >
              Staff
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => fillDemo('student@example.com', 'Passw0rd!')}
            >
              Student
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p className="text-muted">
            Need an account or password reset? <br />
            <Link to="/">Contact Campus IT Administration</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
