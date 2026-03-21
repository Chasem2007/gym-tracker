'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/app');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        setError('');
        alert('Account created! Please log in.');
        setShowSignup(false);
        setUsername('');
        setPassword('');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          min-height: 100vh;
        }
        .login-container {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
          border: 1px solid rgba(71, 85, 105, 0.3);
          border-radius: 16px;
          padding: 48px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }
        .login-title {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          text-align: center;
        }
        .login-subtitle {
          color: #94a3b8;
          text-align: center;
          margin-bottom: 32px;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 8px;
          background: rgba(51, 65, 85, 0.5);
          color: #fff;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(51, 65, 85, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .login-button {
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .toggle-form {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #94a3b8;
        }
        .toggle-form a {
          color: #3b82f6;
          cursor: pointer;
          text-decoration: none;
        }
        .toggle-form a:hover {
          text-decoration: underline;
        }
        .demo-creds {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-top: 32px;
          font-size: 12px;
          color: #93c5fd;
          line-height: 1.6;
        }
        .demo-creds strong {
          color: #bfdbfe;
        }
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
      `}</style>

      <div className="login-wrapper">
        <div className="login-container">
          <h1 className="login-title">💪 GymTracker</h1>
          <p className="login-subtitle">
            {showSignup ? 'Create Your Account' : 'Welcome Back'}
          </p>

          {error && <div className="error">{error}</div>}

          <form onSubmit={showSignup ? handleSignup : handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? 'Loading...' : (showSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="toggle-form">
            {showSignup ? (
              <>
                Already have an account?{' '}
                <a onClick={() => { setShowSignup(false); setError(''); }}>Sign In</a>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <a onClick={() => { setShowSignup(true); setError(''); }}>Sign Up</a>
              </>
            )}
          </div>

          {!showSignup && (
            <div className="demo-creds">
              <strong>Demo Account:</strong><br/>
              Username: chase<br/>
              Password: Smilingsquash479$
            </div>
          )}
        </div>
      </div>
    </>
  );
}
