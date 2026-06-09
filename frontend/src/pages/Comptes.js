import React, { useState, useEffect } from 'react';
import {
  getComptes, getClients, ouvrirCompteCourant, ouvrirCompteEpargne,
  cloturerCompte, getMesComptes
} from '../services/api';

const PRIMARY = '#1a3a5c';
const GOLD = '#c9a84c';
const GOLD_LIGHT = '#e8c06a';

function Badge({ children, color, bg }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4, background: bg, color,
    }}>{children}</span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: toast.type === 'success' ? PRIMARY : toast.type === 'info' ? '#1e40af' : '#dc2626',
      color: '#fff', padding: '14px 20px', borderRadius: 10,
      fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}>
      {toast.type === 'success' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      {toast.msg}
    </div>
  );
}

// Détection robuste du type de compte
const isEpargne = (c) => c && (c.tauxInteret !== undefined && c.tauxInteret !== null);

// CORRECTION BUG #1 : isActif doit reconnaître ACTIF, null, undefined, et 'ACTIF'
const isActif = (c) => {
  if (!c) return false;
  // Si pas de statut ou statut ACTIF (insensible à la casse)
  if (!c.statut) return true;
  const statut = String(c.statut).toUpperCase().replace('STATUTCOMPTE.', '');
  return statut === 'ACTIF';
};

function Comptes({ isClient }) {
  const [comptes, setComptes] = useState([]);
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [typeCompte, setTypeCompte] = useState('courant');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({ clientId: '', decouvertAutorise: 1000, tauxInteret: 3.5, plafond: 50000 });

  useEffect(() => { chargerComptes(); if (!isClient) chargerClients(); }, [isClient]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(comptes.filter(c => {
      const nom = `${c.client?.nom || ''} ${c.client?.prenom || ''} ${c.numeroCompte || ''}`.toLowerCase();
      return nom.includes(q);
    }));
  }, [search, comptes]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const chargerComptes = async () => {
    try {
      const res = isClient ? await getMesComptes() : await getComptes();
      const data = (res.data || []).map(c => ({
        ...c,
        statut: c.statut ? String(c.statut).replace('StatutCompte.', '') : 'ACTIF',
      }));
      console.log('[Comptes] comptes chargés:', data.map(c => ({ num: c.numeroCompte, statut: c.statut, solde: c.solde })));
      setComptes(data);
    } catch (e) { console.error('Erreur comptes', e); }
  };

  const chargerClients = async () => {
    try { const res = await getClients(); setClients(res.data || []); }
    catch (e) { console.error('Erreur clients', e); }
  };

  const handleSubmit = async () => {
    if (!form.clientId) { showToast('Sélectionnez un client.', 'error'); return; }
    setLoading(true);
    try {
      if (typeCompte === 'courant') await ouvrirCompteCourant(form.clientId, { decouvertAutorise: Number(form.decouvertAutorise) });
      else await ouvrirCompteEpargne(form.clientId, { tauxInteret: Number(form.tauxInteret), plafond: Number(form.plafond) });
      setOpenDialog(false);
      setForm({ clientId: '', decouvertAutorise: 1000, tauxInteret: 3.5, plafond: 50000 });
      await chargerComptes();
      showToast('Compte ouvert avec succès.');
    } catch (e) { showToast(e.response?.data?.error || "Erreur lors de l'ouverture.", 'error'); }
    finally { setLoading(false); }
  };

  const handleCloturer = async (num) => {
    if (!window.confirm('Clôturer définitivement ce compte ?')) return;
    try { await cloturerCompte(num); await chargerComptes(); showToast('Compte clôturé.', 'info'); }
    catch (e) { showToast(e.response?.data?.error || 'Erreur lors de la clôture.', 'error'); }
  };

  const copyNum = (num) => {
    navigator.clipboard.writeText(num).then(() => { setCopied(num); setTimeout(() => setCopied(''), 2000); });
  };

  const totalSolde = comptes.filter(isActif).reduce((a, c) => a + (c.solde || 0), 0);

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    border: '1.5px solid #dde1e9', borderRadius: 8, fontSize: 14,
    color: PRIMARY, outline: 'none', fontFamily: 'inherit', background: '#fff',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#7b8fa6',
    textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6,
  };

  // ===== VUE CLIENT =====
  if (isClient) {
    return (
      <div style={{ maxWidth: 900, fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
        <Toast toast={toast} />

        <div style={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #254e7a 100%)`,
          borderRadius: 16, padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(201,168,76,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(201,168,76,0.05)', pointerEvents: 'none' }} />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', margin: '0 0 10px' }}>Solde total — comptes actifs</p>
          <div style={{ color: '#fff', fontSize: 38, fontWeight: 300, letterSpacing: -1, marginBottom: 22 }}>
            <span style={{ fontWeight: 700 }}>{totalSolde.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</span>
            <span style={{ fontSize: 18, color: GOLD, marginLeft: 10 }}>MAD</span>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {[['Actifs', comptes.filter(isActif).length], ['Total', comptes.length], ['Épargne', comptes.filter(c => isEpargne(c)).length]].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {comptes.map(compte => {
            const ep = isEpargne(compte);
            const isCopied = copied === compte.numeroCompte;
            const actif = isActif(compte);
            return (
              <div key={compte.numeroCompte} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e4e8ef', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: ep ? '#ecfdf5' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ep
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>{ep ? 'Compte Épargne' : 'Compte Courant'}</div>
                      <Badge color={actif ? '#10b981' : '#ef4444'} bg={actif ? '#ecfdf5' : '#fef2f2'}>{actif ? 'ACTIF' : (compte.statut || 'INACTIF')}</Badge>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f6f8fb', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#5a7190', letterSpacing: 0.5 }}>{compte.numeroCompte}</span>
                  <button onClick={() => copyNum(compte.numeroCompte)} style={{
                    background: isCopied ? '#ecfdf5' : '#fff', border: isCopied ? '1px solid #86efac' : '1px solid #dde1e9',
                    borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                    color: isCopied ? '#10b981' : '#7b8fa6', fontSize: 11, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                  }}>
                    {isCopied
                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Copié</>
                      : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier</>
                    }
                  </button>
                </div>

                <div style={{ marginBottom: ep ? 12 : 0 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Solde disponible</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: (compte.solde || 0) >= 0 ? PRIMARY : '#ef4444' }}>
                    {(compte.solde || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                    <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 6 }}>MAD</span>
                  </div>
                </div>

                {ep && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>Taux</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{compte.tauxInteret}%</div>
                    </div>
                    {compte.plafond && (
                      <div style={{ flex: 1, background: '#f6f8fb', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>Plafond</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>{compte.plafond.toLocaleString('fr-MA')} MAD</div>
                      </div>
                    )}
                  </div>
                )}
                {!ep && compte.decouvertAutorise > 0 && (
                  <div style={{ marginTop: 12, background: '#eff6ff', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Découvert autorisé</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{compte.decouvertAutorise.toLocaleString('fr-MA')} MAD</div>
                  </div>
                )}
              </div>
            );
          })}
          {comptes.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: 14 }}>
              Aucun compte enregistré. Contactez votre conseiller.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== VUE ADMIN/EMPLOYE =====
  return (
    <div style={{ fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
      <Toast toast={toast} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          ['Total comptes', comptes.length, PRIMARY],
          ['Comptes actifs', comptes.filter(isActif).length, '#10b981'],
          ['Solde total', comptes.filter(isActif).reduce((a, c) => a + (c.solde || 0), 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD', GOLD],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e8ef', padding: '20px 22px' }}>
            <div style={{ fontSize: 11, color: '#7b8fa6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e4e8ef', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Rechercher par client ou numéro..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 38 }} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = '#dde1e9'} />
          </div>
          <button onClick={() => setOpenDialog(true)} style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, border: 'none', borderRadius: 8,
            padding: '11px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
            color: PRIMARY, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ouvrir un compte
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f6f8fb' }}>
                {['Numéro de compte', 'Client', 'Type', 'Solde', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7b8fa6', textTransform: 'uppercase', letterSpacing: 0.9, borderBottom: '1px solid #e4e8ef' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((compte, i) => {
                const ep = isEpargne(compte);
                const actif = isActif(compte);
                const isCopied = copied === compte.numeroCompte;
                const nomClient = compte.client
                  ? `${compte.client.prenom || ''} ${compte.client.nom || ''}`.trim() || compte.client.email || '—'
                  : '—';
                return (
                  <tr key={compte.numeroCompte} style={{ borderBottom: '1px solid #f0f2f7', background: i % 2 === 0 ? '#fff' : '#fafbfd' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#4a6080' }}>{compte.numeroCompte}</span>
                        <button onClick={() => copyNum(compte.numeroCompte)} title="Copier" style={{
                          background: isCopied ? '#ecfdf5' : '#f0f2f7', border: 'none', borderRadius: 5,
                          padding: '3px 8px', cursor: 'pointer', color: isCopied ? '#10b981' : '#7b8fa6', fontSize: 10, fontFamily: 'inherit',
                        }}>
                          {isCopied ? '✓' : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: PRIMARY }}>{nomClient}</div>
                      {compte.client?.email && <div style={{ fontSize: 12, color: '#9ca3af' }}>{compte.client.email}</div>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge color={ep ? '#10b981' : '#3b82f6'} bg={ep ? '#ecfdf5' : '#eff6ff'}>{ep ? 'Épargne' : 'Courant'}</Badge>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: (compte.solde || 0) >= 0 ? PRIMARY : '#ef4444' }}>
                        {(compte.solde || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Badge color={actif ? '#10b981' : '#6b7280'} bg={actif ? '#ecfdf5' : '#f3f4f6'}>{actif ? 'ACTIF' : (compte.statut || '—')}</Badge>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {actif && (
                        <button onClick={() => handleCloturer(compte.numeroCompte)} style={{
                          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 12px',
                          cursor: 'pointer', color: '#dc2626', fontSize: 12, fontFamily: 'inherit',
                        }}>Clôturer</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Aucun compte trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,50,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #f0f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: PRIMARY }}>Ouvrir un compte</h3>
                <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>Associer un nouveau compte à un client</p>
              </div>
              <button onClick={() => setOpenDialog(false)} style={{ background: '#f0f2f7', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7b8fa6' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Client *</label>
                <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} style={{ ...inputStyle }}>
                  <option value="">— Sélectionner un client —</option>
                  {clients.filter(c => !c.estBloque).map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Type de compte</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['courant', 'Courant', '#3b82f6', '#eff6ff'], ['epargne', 'Épargne', '#10b981', '#ecfdf5']].map(([val, label, color, bg]) => (
                    <div key={val} onClick={() => setTypeCompte(val)} style={{
                      border: typeCompte === val ? `2px solid ${color}` : '1.5px solid #dde1e9',
                      borderRadius: 10, padding: '14px', cursor: 'pointer',
                      background: typeCompte === val ? bg : '#fff', textAlign: 'center', transition: 'all 0.15s',
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: typeCompte === val ? color : '#374151' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {typeCompte === 'courant' ? (
                <div>
                  <label style={labelStyle}>Découvert autorisé (MAD)</label>
                  <input type="number" style={inputStyle} value={form.decouvertAutorise} onChange={e => setForm({ ...form, decouvertAutorise: e.target.value })} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = '#dde1e9'} />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Taux d'intérêt (%)</label>
                    <input type="number" style={inputStyle} value={form.tauxInteret} onChange={e => setForm({ ...form, tauxInteret: e.target.value })} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = '#dde1e9'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Plafond (MAD)</label>
                    <input type="number" style={inputStyle} value={form.plafond} onChange={e => setForm({ ...form, plafond: e.target.value })} onFocus={e => e.target.style.borderColor = GOLD} onBlur={e => e.target.style.borderColor = '#dde1e9'} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f2f7', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpenDialog(false)} style={{ background: '#f0f2f7', border: 'none', borderRadius: 8, padding: '11px 20px', cursor: 'pointer', fontSize: 14, color: '#374151', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={handleSubmit} disabled={loading} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, border: 'none', borderRadius: 8, padding: '11px 20px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, color: PRIMARY, fontFamily: 'inherit' }}>
                {loading ? 'Ouverture...' : 'Ouvrir le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Comptes;