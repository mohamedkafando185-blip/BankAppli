import React, { useState } from 'react';
import { register } from '../services/api';

function Register({ onBack }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', motDePasse: '',
    telephone: '', cin: '', adresse: ''
  });
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    border: '1.5px solid #e5e7eb', borderRadius: 8,
    fontSize: 14, color: '#1a3a5c', outline: 'none',
    fontFamily: 'inherit', background: '#fff',
  };

  const labelStyle = {
    display: 'block', color: '#374151', fontSize: 13,
    fontWeight: 600, marginBottom: 5,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.motDePasse !== confirmPwd) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form);
      setMessage('Compte créé avec succès ! Redirection...');
      setTimeout(() => onBack(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte. Email peut-être déjà utilisé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8,
              padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: '#6b7280', fontSize: 13, fontFamily: 'inherit',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #c9a84c, #f0d080)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a5c" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <path d="M5 8H19L20 16H4L5 8Z"/><line x1="3" y1="16" x2="21" y2="16"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            </div>
            <span style={{ color: '#1a3a5c', fontSize: 18, fontWeight: 700 }}>BankAppli</span>
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          padding: '40px',
        }}>
          <h2 style={{ color: '#1a3a5c', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Créer votre compte
          </h2>
          <p style={{ color: '#8892a4', fontSize: 14, marginBottom: 32 }}>
            Rejoignez BankAppli et gérez vos finances simplement.
          </p>

          {message && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 8, padding: '12px 16px', marginBottom: 24,
              color: '#16a34a', fontSize: 13,
            }}>
              ✓ {message}
            </div>
          )}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: 8, padding: '12px 16px', marginBottom: 24,
              color: '#dc2626', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input style={inputStyle} placeholder="Jean" required value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input style={inputStyle} placeholder="Dupont" required value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Adresse e-mail *</label>
              <input type="email" style={inputStyle} placeholder="jean.dupont@email.com" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#c9a84c'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Mot de passe *</label>
                <input type="password" style={inputStyle} placeholder="Min. 6 caractères" required value={form.motDePasse}
                  onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>Confirmer le mot de passe *</label>
                <input type="password" style={inputStyle} placeholder="Répétez le mot de passe" required value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Téléphone</label>
                <input style={inputStyle} placeholder="+212 6XX XXX XXX" value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>CIN</label>
                <input style={inputStyle} placeholder="AB123456" value={form.cin}
                  onChange={e => setForm({ ...form, cin: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#c9a84c'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Adresse</label>
              <input style={inputStyle} placeholder="Rue, ville, pays" value={form.adresse}
                onChange={e => setForm({ ...form, adresse: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#c9a84c'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#d4a843' : 'linear-gradient(135deg, #c9a84c, #e8c06a)',
                color: '#1a3a5c', border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;