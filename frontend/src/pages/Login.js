import React, { useState } from 'react';
import { login } from '../services/api';

function Login({ onLogin, onRegister }) {
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form.email, form.motDePasse);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('email', res.data.email);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f2744 0%, #1a3a5c 100%)',
      display: 'flex',
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 60px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 80 }}>
          <div style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #c9a84c, #f0d080)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a3a5c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
              <path d="M5 8H19L20 16H4L5 8Z"/><line x1="3" y1="16" x2="21" y2="16"/>
              <line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>BankAppli</span>
        </div>

        <div>
          <h1 style={{ color: '#fff', fontSize: 44, fontWeight: 300, lineHeight: 1.2, marginBottom: 20, letterSpacing: -1 }}>
            Votre banque,<br/><span style={{ fontWeight: 700, color: '#c9a84c' }}>à portée de main.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
            Gérez vos comptes, suivez vos opérations et prenez le contrôle de vos finances en toute sécurité.
          </p>
        </div>

        <div style={{ marginTop: 80, display: 'flex', gap: 32 }}>
          {[['256-bit', 'Chiffrement'], ['ISO 27001', 'Certifié'], ['24/7', 'Disponible']].map(([val, label]) => (
            <div key={label}>
              <div style={{ color: '#c9a84c', fontSize: 18, fontWeight: 700 }}>{val}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', bottom: -120, left: -120,
          width: 400, height: 400, borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.08)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 250, height: 250, borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.12)',
          pointerEvents: 'none',
        }}/>
      </div>

      {/* Right login panel */}
      <div style={{
        width: 460,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 50px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#1a3a5c', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Connexion</h2>
          <p style={{ color: '#8892a4', fontSize: 14 }}>Bienvenue. Veuillez vous identifier.</p>
        </div>

        {error && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fecaca',
            borderRadius: 8, padding: '12px 16px', marginBottom: 24,
            color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Adresse e-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              placeholder="exemple@mail.com"
              style={{
                width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                border: '1.5px solid #e5e7eb', borderRadius: 8,
                fontSize: 14, color: '#1a3a5c', outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#c9a84c'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.motDePasse}
                onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 44px 12px 16px', boxSizing: 'border-box',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  fontSize: 14, color: '#1a3a5c', outline: 'none',
                  transition: 'border-color 0.2s', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#c9a84c'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: '#9ca3af',
                }}
              >
                {showPassword
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#d4a843' : 'linear-gradient(135deg, #c9a84c, #e8c06a)',
              color: '#1a3a5c', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3, transition: 'opacity 0.2s', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 28, borderTop: '1px solid #f3f4f6' }}>
          <span style={{ color: '#8892a4', fontSize: 13 }}>Pas encore client ? </span>
          <button
            onClick={onRegister}
            style={{
              background: 'none', border: 'none', color: '#c9a84c',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
            }}
          >
            Créer un compte
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: 11, marginTop: 40 }}>
          © 2026 BankAppli — Connexion sécurisée SSL/TLS
        </p>
      </div>
    </div>
  );
}

export default Login;