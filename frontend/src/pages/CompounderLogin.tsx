import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { compoundersApi } from '../services/api';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const CompounderLogin: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (sessionStorage.getItem('compounderToken')) {
      navigate('/compounder/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password / कृपया ईमेल आणि पासवर्ड दोन्ही टाका.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = await compoundersApi.login({ email, password });
      if (data.success) {
        sessionStorage.setItem('compounderToken', data.token);
        sessionStorage.setItem('compounderUser', JSON.stringify(data.compounder));
        navigate('/compounder/dashboard');
      } else {
        setErrorMessage(data.message || 'Login failed.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Login failed. Please verify credentials. / लॉगिन अयशस्वी. कृपया तपशील तपासा.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Decorative Blobs */}
      <div className="floating-blob blob-blue" style={{ width: '400px', height: '400px' }}></div>
      <div className="floating-blob blob-cyan" style={{ width: '350px', height: '350px', bottom: '15%', right: '5%' }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '40px 32px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid var(--border-glass-blue)',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'var(--gradient-primary)',
            color: 'white',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            marginBottom: '16px'
          }}>
            <Lock size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>
            Compounder Portal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px', margin: 0 }}>
            Sign in to manage patients, bookings, and generate bills
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              EMAIL ADDRESS / ईमेल
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                placeholder="compounder@aarogyasetu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'white',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'var(--transition-fast)'
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              PASSWORD / पासवर्ड
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 14px',
                  background: 'white',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'var(--transition-fast)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: '48px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spin-animation" size={18} /> Signing In...
              </>
            ) : (
              'Sign In / लॉग इन करा'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Back to Home / मुख्यपृष्ठ
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CompounderLogin;
