import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Clients from './pages/Clients';
import Comptes from './pages/Comptes';
import Operations from './pages/Operations';
import Employes from './pages/Employes';
import Profil from './pages/Profil';

const SIDEBAR_W = 260;

const NAV_ICONS = {
  clients: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  comptes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  operations: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  employes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  profil: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const ROLE_LABELS = {
  ROLE_ADMIN: 'Administrateur', ROLE_EMPLOYE: 'Employé',
  ROLE_MANAGER: 'Manager', ROLE_AUDITEUR: 'Auditeur', ROLE_CLIENT: 'Client',
};

const ROLE_COLORS = {
  ROLE_ADMIN: '#ef4444', ROLE_MANAGER: '#f97316',
  ROLE_AUDITEUR: '#3b82f6', ROLE_EMPLOYE: '#6366f1', ROLE_CLIENT: '#10b981',
};

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('comptes');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    if (token && email && role) {
      setUser({ token, email, role });
      setPage(role === 'ROLE_CLIENT' ? 'comptes' : 'clients');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage(userData.role === 'ROLE_CLIENT' ? 'comptes' : 'clients');
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setPage('comptes');
    setShowRegister(false);
  };

  if (!user) {
    if (showRegister) return <Register onBack={() => setShowRegister(false)} />;
    return <Login onLogin={handleLogin} onRegister={() => setShowRegister(true)} />;
  }

  const isClient = user.role === 'ROLE_CLIENT';
  const isAdmin = user.role === 'ROLE_ADMIN';

  const menuItems = [
    ...(!isClient ? [{ id: 'clients', label: 'Clients' }] : []),
    { id: 'comptes', label: isClient ? 'Mes comptes' : 'Comptes' },
    { id: 'operations', label: isClient ? 'Mes opérations' : 'Opérations' },
    ...(isAdmin ? [{ id: 'employes', label: 'Employés' }] : []),
    { id: 'profil', label: 'Mon profil' },
  ];

  const pageTitle = {
    clients: 'Gestion des clients',
    comptes: isClient ? 'Mes comptes' : 'Gestion des comptes',
    operations: isClient ? 'Mes opérations' : 'Opérations bancaires',
    employes: 'Gestion des employés',
    profil: 'Mon profil',
  }[page] || 'BankAppli';

  const initials = user.email?.[0]?.toUpperCase() || 'U';
  const roleColor = ROLE_COLORS[user.role] || '#10b981';
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#f4f6fa',
      fontFamily: "'Segoe UI', -apple-system, sans-serif",
    }}>
      {/* SIDEBAR */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: '#1a3a5c',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #c9a84c, #f0d080)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a5c" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <path d="M5 8H19L20 16H4L5 8Z"/><line x1="3" y1="16" x2="21" y2="16"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>BankAppli</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Banque en ligne</div>
            </div>
          </div>
        </div>

        {/* User card */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 10,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: roleColor + '22',
              border: `2px solid ${roleColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: roleColor, fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              <div style={{
                marginTop: 3, display: 'inline-block',
                background: roleColor + '22', color: roleColor,
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 4, letterSpacing: 0.5,
              }}>
                {roleLabel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: '8px 12px 8px', textTransform: 'uppercase' }}>
            Navigation
          </div>
          {menuItems.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
                  color: active ? '#c9a84c' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', textAlign: 'left', fontSize: 14, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
              >
                <span style={{ opacity: active ? 1 : 0.7 }}>{NAV_ICONS[item.id]}</span>
                <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#c9a84c' }} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 12px 24px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: 'transparent', border: '1px solid transparent',
              color: 'rgba(239,68,68,0.6)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: SIDEBAR_W, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e8eaed',
          padding: '0 32px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div>
            <h1 style={{ color: '#1a3a5c', fontSize: 18, fontWeight: 700, margin: 0 }}>{pageTitle}</h1>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: roleColor + '15', border: `1.5px solid ${roleColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: roleColor, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }} onClick={() => setPage('profil')}>
              {initials}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {page === 'clients' && !isClient && <Clients />}
          {page === 'comptes' && <Comptes isClient={isClient} />}
          {page === 'operations' && <Operations isClient={isClient} userEmail={user.email} />}
          {page === 'employes' && isAdmin && <Employes />}
          {page === 'profil' && <Profil user={user} onLogout={handleLogout} />}
        </div>
      </div>
    </div>
  );
}

export default App;