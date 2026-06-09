import React, { useState, useEffect, useCallback } from 'react';
import {
  getMesOperations, getOperations, getMesComptes, getComptes,
  effectuerVirement, effectuerVersement, effectuerRetrait,
  demanderOtpTransaction, getStatutCodeTransaction
} from '../services/api';

const PRIMARY = '#1a3a5c';
const GOLD    = '#c9a84c';

/* Normalise le statut quelle que soit la forme renvoyée par le backend */
const normalizeStatut = (s) => {
  if (!s) return 'ACTIF';
  const str = String(s).toUpperCase();
  if (str.includes('CLOTURE')) return 'CLOTURE';
  if (str.includes('SUSPENDU')) return 'SUSPENDU';
  if (str.includes('INACTIF')) return 'INACTIF';
  return 'ACTIF';
};

const isActif = (c) => normalizeStatut(c?.statut) === 'ACTIF';

const formatRib = (rib) => {
  if (!rib || rib.length !== 24) return rib || '—';
  return `${rib.slice(0,5)} ${rib.slice(5,8)} ${rib.slice(8,11)} ${rib.slice(11,22)} ${rib.slice(22,24)}`;
};

/* Détecte le type d'une opération à partir de ses champs spécifiques */
const detectType = (op) => {
  if (!op) return 'virement';
  if (op.typeOperation) {
    const t = op.typeOperation.toUpperCase();
    if (t === 'VERSEMENT') return 'versement';
    if (t === 'RETRAIT')   return 'retrait';
    return 'virement';
  }
  if (op.modeRetrait   !== undefined && op.modeRetrait   !== null) return 'retrait';
  if (op.sourceVersement !== undefined && op.sourceVersement !== null) return 'versement';
  // Utiliser les champs dénormalisés — si pas de source mais une dest = versement
  if (!op.compteSourceNumero && op.compteDestNumero) return 'versement';
  if (op.compteSource === null || op.compteSource === undefined) return 'versement';
  return 'virement';
};

const TYPE_CFG = {
  versement: { label:'Versement', color:'#10b981', bg:'#ecfdf5', sign:'+' },
  retrait:   { label:'Retrait',   color:'#ef4444', bg:'#fef2f2', sign:'-' },
  virement:  { label:'Virement',  color:'#3b82f6', bg:'#eff6ff', sign:'-' },
};

function Badge({ children, color, bg }) {
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20,
      fontSize:11, fontWeight:700, letterSpacing:0.4, background:bg, color }}>
      {children}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999,
      background: toast.type==='success' ? PRIMARY : '#dc2626',
      color:'#fff', padding:'14px 20px', borderRadius:10, fontSize:14,
      fontWeight:500, display:'flex', alignItems:'center', gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,0.18)', maxWidth:440 }}>
      {toast.type==='success' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={GOLD} strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      <span>{toast.msg}</span>
    </div>
  );
}

/* ─── Carte de compte cliquable ─────────────────────────────────── */
function CompteCard({ compte, selected, onSelect, accent }) {
  const epargne = compte.tauxInteret !== undefined && compte.tauxInteret !== null;
  return (
    <div onClick={() => onSelect(compte.numeroCompte)}
      style={{ border: selected ? `2px solid ${accent}` : '1.5px solid #dde1e9',
        borderRadius:10, padding:'14px', cursor:'pointer',
        background: selected ? accent + '10' : '#fafbfd',
        marginBottom:8, transition:'all 0.15s' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:11, fontFamily:'monospace', color:'#4a6080', marginBottom:3 }}>
            {compte.numeroCompte}
          </div>
          <div style={{ fontSize:10, color:'#9ca3af', marginBottom:5 }}>
            RIB : {formatRib(compte.rib)}
          </div>
          <Badge color={epargne ? '#10b981' : '#3b82f6'}
                 bg={epargne ? '#ecfdf5' : '#eff6ff'}>
            {epargne ? 'Épargne' : 'Courant'}
          </Badge>
          {compte.decouvertAutorise > 0 && (
            <span style={{ marginLeft:8, fontSize:10, color:'#6b7280' }}>
              Découvert : {compte.decouvertAutorise.toLocaleString('fr-MA')} MAD
            </span>
          )}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:16, fontWeight:700, color: compte.solde < 0 ? '#ef4444' : PRIMARY }}>
            {(compte.solde || 0).toLocaleString('fr-MA', { minimumFractionDigits:2 })}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af' }}>MAD</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
function Operations({ isClient }) {
  const [operations, setOperations]         = useState([]);
  const [comptes, setComptes]               = useState([]);
  const [openDialog, setOpenDialog]         = useState(null);
  const [compteSourceId, setCompteSourceId] = useState('');
  const [compteDestId, setCompteDestId]     = useState('');
  const [montant, setMontant]               = useState('');
  const [motif, setMotif]                   = useState('');
  const [codeTransaction, setCodeTransaction] = useState('');
  const [codeOtp, setCodeOtp]               = useState('');
  const [otpEnvoye, setOtpEnvoye]           = useState(false);
  const [otpLoading, setOtpLoading]         = useState(false);
  const [otpDevCode, setOtpDevCode]         = useState('');   // code visible en mode dev
  const [aCodeTransaction, setACodeTransaction] = useState(null);
  const [toast, setToast]                   = useState(null);
  const [loading, setLoading]               = useState(false);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const chargerComptes = useCallback(async () => {
    try {
      const res = isClient ? await getMesComptes() : await getComptes();
      const norm = (res.data || []).map(c => ({
        ...c, statut: normalizeStatut(c.statut)
      }));
      setComptes(norm);
      return norm;
    } catch (e) { console.error('comptes:', e); return []; }
  }, [isClient]);

  const chargerOperations = useCallback(async () => {
    try {
      const res = isClient ? await getMesOperations() : await getOperations();
      setOperations(res.data || []);
    } catch (e) { console.error('operations:', e); }
  }, [isClient]);

  useEffect(() => {
    chargerComptes();
    chargerOperations();
    if (isClient) {
      getStatutCodeTransaction()
        .then(r => setACodeTransaction(r.data.aUnCodeTransaction))
        .catch(() => setACodeTransaction(false));
    }
  }, [chargerComptes, chargerOperations, isClient]);

  /* ── Envoi OTP ─────────────────────────────────────────────────── */
  const handleDemanderOtp = async () => {
    // Bloquer si le code transaction n'est pas saisi
    if (!codeTransaction || codeTransaction.length < 6) {
      showToast('Saisissez d\'abord votre code de transaction (6 chiffres) avant de demander le code OTP.', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await demanderOtpTransaction(codeTransaction);
      const data = res.data || {};
      setOtpEnvoye(true);

      // Si le backend renvoie le code (mode dev sans SMTP), l'auto-remplir
      if (data.code) {
        setCodeOtp(data.code);
        setOtpDevCode(data.code);
        showToast(`Mode développement — Code OTP : ${data.code} (auto-rempli)`, 'success');
      } else {
        showToast(data.message || 'Code OTP envoyé par email. Valable 2 minutes.');
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Erreur envoi OTP.';
      showToast(msg, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Ouverture dialog ──────────────────────────────────────────── */
  const openOp = async (type) => {
    setCompteSourceId(''); setCompteDestId('');
    setMontant(''); setMotif('');
    setCodeTransaction(''); setCodeOtp('');
    setOtpEnvoye(false); setOtpDevCode('');
    await chargerComptes();
    setOpenDialog(type);
  };

  /* ── Soumission opération ──────────────────────────────────────── */
  const handleSubmit = async () => {
    const m = parseFloat(montant);
    if (!montant || isNaN(m) || m <= 0) {
      showToast('Montant invalide : doit être supérieur à 0.', 'error'); return;
    }
    // Validations client uniquement
    if (isClient) {
      if (aCodeTransaction === false) {
        showToast('Définissez d\'abord un code de transaction (Mon Profil → Sécurité).', 'error'); return;
      }
      if ((openDialog === 'retrait' || openDialog === 'virement') && !codeTransaction) {
        showToast('Code de transaction obligatoire.', 'error'); return;
      }
      if ((openDialog === 'retrait' || openDialog === 'virement') && !codeOtp) {
        showToast('Code OTP obligatoire. Cliquez sur "Envoyer OTP".', 'error'); return;
      }
    }
    // Validations compte
    if (openDialog === 'versement' && !compteDestId) {
      showToast('Sélectionnez un compte à créditer.', 'error'); return;
    }
    if (openDialog === 'retrait' && !compteSourceId) {
      showToast('Sélectionnez un compte à débiter.', 'error'); return;
    }
    if (openDialog === 'virement') {
      if (!compteSourceId) { showToast('Sélectionnez un compte source.', 'error'); return; }
      if (!compteDestId)   { showToast('Saisissez le RIB ou numéro de compte destination.', 'error'); return; }
    }

    setLoading(true);
    try {
      if (openDialog === 'virement') {
        await effectuerVirement({ compteSourceId, compteDestId, montant: m, motif, codeTransaction, codeOtp });
      } else if (openDialog === 'versement') {
        await effectuerVersement({ compteDestId, montant: m, source: 'ESPECE' });
      } else if (openDialog === 'retrait') {
        await effectuerRetrait({ compteSourceId, montant: m, modeRetrait: 'GUICHET', codeTransaction, codeOtp });
      }
      setOpenDialog(null);
      showToast('Opération effectuée avec succès !');
      chargerComptes();
      chargerOperations();
    } catch (e) {
      const msg = e.response?.data?.message
               || e.response?.data?.error
               || "Erreur lors de l'opération.";
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const comptesActifs = comptes.filter(isActif);

  const inputStyle = {
    width:'100%', boxSizing:'border-box', padding:'11px 14px',
    border:'1.5px solid #dde1e9', borderRadius:8, fontSize:14,
    color:PRIMARY, outline:'none', fontFamily:'inherit',
    background:'#fff', marginBottom:12,
  };
  const labelStyle = {
    display:'block', fontSize:11, fontWeight:700, color:'#7b8fa6',
    textTransform:'uppercase', letterSpacing:0.9, marginBottom:6,
  };

  /* ══ RENDU ══════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:"'Segoe UI', -apple-system, sans-serif" }}>
      <Toast toast={toast} />

      {/* Alerte code transaction non configuré */}
      {isClient && aCodeTransaction === false && (
        <div style={{ background:'#fff8e1', border:'1px solid #fcd34d',
          borderRadius:10, padding:'14px 18px', marginBottom:20,
          color:'#92400e', fontSize:14 }}>
          ⚠ <strong>Code de transaction non configuré.</strong>{' '}
          Rendez-vous dans <strong>Mon Profil → Sécurité</strong> pour en créer un.
        </div>
      )}

      {/* ── Boutons d'action ──────────────────────────────────────── */}
      <div style={{ display:'grid',
        gridTemplateColumns: isClient ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
        gap:14, marginBottom:28 }}>

        {!isClient && (
          <OpBtn label="Versement" sub="Déposer des fonds"
            color="#10b981" lightBg="#f0fdf4" onClick={() => openOp('versement')}
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 19 19 12"/></svg>} />
        )}
        <OpBtn label="Retrait" sub="Retirer des fonds"
          color="#ef4444" lightBg="#fff5f5" onClick={() => openOp('retrait')}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 5 5 12"/></svg>} />
        <OpBtn label="Virement" sub="Transférer des fonds"
          color="#3b82f6" lightBg="#eff6ff" onClick={() => openOp('virement')}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>} />
      </div>

      {/* ── Tableau historique ────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14,
        border:'1px solid #e4e8ef', overflow:'hidden' }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #f0f2f7' }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:PRIMARY }}>
            {isClient ? 'Mes opérations' : 'Historique des opérations'}
          </h3>
          <p style={{ margin:'3px 0 0', color:'#9ca3af', fontSize:13 }}>
            {operations.length} opération(s)
          </p>
        </div>

        {operations.length === 0 ? (
          <div style={{ padding:'60px', textAlign:'center', color:'#9ca3af', fontSize:14 }}>
            Aucune opération enregistrée.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f6f8fb' }}>
                  {(isClient
                    ? ['Type','Montant','Solde après','Compte concerné','Date & Heure','Statut']
                    : ['Type','Montant','Solde avant','Solde après','Cpt Source','Cpt Dest',
                       'Motif','Effectué par','Date & Heure','Statut']
                  ).map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'left',
                      fontSize:11, fontWeight:700, color:'#7b8fa6',
                      textTransform:'uppercase', letterSpacing:0.8,
                      borderBottom:'1px solid #e4e8ef', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operations.map((op, i) => {
                  const type  = detectType(op);
                  const cfg   = TYPE_CFG[type];
                  const montantOp = op.montant || 0;
                  // Utiliser les champs dénormalisés en priorité (pas de problème LAZY)
                  const srcNum  = op.compteSourceNumero || op.compteSource?.numeroCompte || '—';
                  const destNum = op.compteDestNumero   || op.compteDestination?.numeroCompte || '—';
                  
                  // RENFORCEMENT DE L'AUTEUR
                  let auteur = op.initiateur;
                  if (!auteur || auteur.includes('@')) {
                    if (op.employeValideur) {
                      auteur = `${op.employeValideur.prenom || ''} ${op.employeValideur.nom || ''}`.trim();
                    } else {
                      auteur = op.compteSource?.client?.email || (op.compteDestNumero ? 'Client' : '—');
                    }
                  }
                  
                  const rowBg = i % 2 === 0 ? '#fff' : '#fafbfd';

                  if (isClient) {
                    // Vue client simplifiée
                    const cpteAffiche = type === 'versement' ? destNum : srcNum;
                    return (
                      <tr key={op.idOperation || i}
                        style={{ borderBottom:'1px solid #f0f2f7', background:rowBg }}>
                        <td style={{ padding:'12px 16px' }}>
                          <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
                        </td>
                        <td style={{ padding:'12px 16px', fontWeight:700,
                          color:cfg.color, whiteSpace:'nowrap' }}>
                          {cfg.sign} {montantOp.toLocaleString('fr-MA',{minimumFractionDigits:2})} MAD
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13,
                          fontWeight:600, color:PRIMARY, whiteSpace:'nowrap' }}>
                          {op.soldeApres != null
                            ? op.soldeApres.toLocaleString('fr-MA',{minimumFractionDigits:2}) + ' MAD'
                            : '—'}
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:12,
                          fontFamily:'monospace', color:'#5a7190' }}>
                          {cpteAffiche}
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:12,
                          color:'#7b8fa6', whiteSpace:'nowrap' }}>
                          {op.dateOperation
                            ? new Date(op.dateOperation).toLocaleString('fr-FR')
                            : '—'}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <Badge color="#10b981" bg="#ecfdf5">
                            {op.statut || 'VALIDÉE'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  }

                  // Vue employé / admin
                  return (
                    <tr key={op.idOperation || i}
                      style={{ borderBottom:'1px solid #f0f2f7', background:rowBg }}>
                      <td style={{ padding:'12px 16px' }}>
                        <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
                      </td>
                      <td style={{ padding:'12px 16px', fontWeight:700,
                        color:cfg.color, whiteSpace:'nowrap' }}>
                        {cfg.sign} {montantOp.toLocaleString('fr-MA',{minimumFractionDigits:2})} MAD
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:13,
                        color:'#6b7280', whiteSpace:'nowrap' }}>
                        {op.soldeAvant != null
                          ? op.soldeAvant.toLocaleString('fr-MA',{minimumFractionDigits:2}) + ' MAD'
                          : '—'}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:13,
                        fontWeight:600, color:PRIMARY, whiteSpace:'nowrap' }}>
                        {op.soldeApres != null
                          ? op.soldeApres.toLocaleString('fr-MA',{minimumFractionDigits:2}) + ' MAD'
                          : '—'}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:12, fontFamily:'monospace', color:'#5a7190' }}>
                          {srcNum}
                        </div>
                        {op.compteSource?.client && (
                          <div style={{ fontSize:11, color:'#9ca3af' }}>
                            {op.compteSource.client.prenom} {op.compteSource.client.nom}
                          </div>
                        )}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontSize:12, fontFamily:'monospace', color:'#5a7190' }}>
                          {destNum}
                        </div>
                        {op.compteDestination?.client && (
                          <div style={{ fontSize:11, color:'#9ca3af' }}>
                            {op.compteDestination.client.prenom} {op.compteDestination.client.nom}
                          </div>
                        )}
                      </td>
                      <td style={{ padding:'12px 16px', color:'#7b8fa6', fontSize:13 }}>
                        {op.motif || '—'}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:12,
                        color: op.employeValideur ? PRIMARY : '#9ca3af',
                        fontWeight: op.employeValideur ? 600 : 400 }}>
                        {auteur}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:12,
                        color:'#7b8fa6', whiteSpace:'nowrap' }}>
                        {op.dateOperation
                          ? new Date(op.dateOperation).toLocaleString('fr-FR')
                          : '—'}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <Badge color="#10b981" bg="#ecfdf5">
                          {op.statut || 'VALIDÉE'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ MODAL OPÉRATION ════════════════════════════════════════ */}
      {openDialog && (
        <div style={{ position:'fixed', inset:0,
          background:'rgba(15,30,50,0.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%',
            maxWidth:520, maxHeight:'92vh', overflowY:'auto',
            boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>

            {/* Header */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #f0f2f7',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:PRIMARY }}>
                {openDialog === 'versement' ? '💰 Versement'
                  : openDialog === 'retrait' ? '💸 Retrait' : '🔄 Virement'}
              </h3>
              <button onClick={() => !loading && setOpenDialog(null)}
                style={{ background:'#f0f2f7', border:'none', borderRadius:8,
                  width:32, height:32, cursor:'pointer', fontSize:18, color:'#7b8fa6' }}>
                ×
              </button>
            </div>

            <div style={{ padding:24 }}>

              {/* ── Versement : compte destination ── */}
              {openDialog === 'versement' && (
                <>
                  <label style={labelStyle}>Compte à créditer</label>
                  {comptesActifs.length === 0
                    ? <p style={{ color:'#ef4444', fontSize:13 }}>Aucun compte actif.</p>
                    : comptesActifs.map(c => (
                        <CompteCard key={c.numeroCompte} compte={c}
                          selected={compteDestId === c.numeroCompte}
                          onSelect={setCompteDestId} accent="#10b981" />
                      ))
                  }
                </>
              )}

              {/* ── Retrait : compte source ── */}
              {openDialog === 'retrait' && (
                <>
                  <label style={labelStyle}>Compte à débiter</label>
                  {comptesActifs.length === 0
                    ? <p style={{ color:'#ef4444', fontSize:13 }}>Aucun compte actif.</p>
                    : comptesActifs.map(c => (
                        <CompteCard key={c.numeroCompte} compte={c}
                          selected={compteSourceId === c.numeroCompte}
                          onSelect={setCompteSourceId} accent="#ef4444" />
                      ))
                  }
                </>
              )}

              {/* ── Virement : source + destination ── */}
              {openDialog === 'virement' && (
                <>
                  <label style={labelStyle}>Votre compte source</label>
                  {comptesActifs.length === 0
                    ? <p style={{ color:'#ef4444', fontSize:13 }}>Aucun compte actif.</p>
                    : comptesActifs.map(c => (
                        <CompteCard key={c.numeroCompte} compte={c}
                          selected={compteSourceId === c.numeroCompte}
                          onSelect={setCompteSourceId} accent="#3b82f6" />
                      ))
                  }
                  <div style={{ marginTop:14 }}>
                    <label style={labelStyle}>RIB ou numéro de compte destination</label>
                    <input style={inputStyle}
                      placeholder="Ex : 21000123456789012345678 97  (RIB 24 chiffres ou numéro direct)"
                      value={compteDestId}
                      onChange={e => setCompteDestId(e.target.value.replace(/\s+/g, ''))}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e  => e.target.style.borderColor = '#dde1e9'}
                    />
                    <p style={{ fontSize:11, color:'#9ca3af', marginTop:-8 }}>
                      Vous pouvez coller le RIB avec ou sans espaces.
                    </p>
                  </div>
                </>
              )}

              {/* Montant */}
              <label style={labelStyle}>Montant (MAD)</label>
              <div style={{ position:'relative', marginBottom:12 }}>
                <input type="number" min="0.01" step="0.01"
                  style={{ ...inputStyle, paddingRight:52, marginBottom:0 }}
                  placeholder="0.00" value={montant}
                  onChange={e => setMontant(e.target.value)}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e  => e.target.style.borderColor = '#dde1e9'}
                />
                <span style={{ position:'absolute', right:14, top:'50%',
                  transform:'translateY(-50%)', color:'#9ca3af',
                  fontSize:12, fontWeight:600 }}>MAD</span>
              </div>

              {/* Motif (virement) */}
              {openDialog === 'virement' && (
                <>
                  <label style={labelStyle}>Motif (optionnel)</label>
                  <input style={inputStyle}
                    placeholder="Ex : Loyer, Remboursement..."
                    value={motif} onChange={e => setMotif(e.target.value)} />
                </>
              )}

              {/* ── Section sécurité (client, retrait ou virement) ── */}
              {isClient && (openDialog === 'retrait' || openDialog === 'virement') && (
                <div style={{ background:'#f6f8fb', borderRadius:10,
                  padding:'16px', marginTop:8,
                  border:'1px solid #e4e8ef' }}>
                  <div style={{ fontSize:13, fontWeight:700,
                    color:PRIMARY, marginBottom:14 }}>
                    🔒 Validation sécurisée
                  </div>

                  <label style={labelStyle}>Code de transaction (6 chiffres)</label>
                  <input type="password" maxLength={6}
                    style={inputStyle}
                    placeholder="••••••"
                    value={codeTransaction}
                    onChange={e => setCodeTransaction(e.target.value.replace(/\D/g, ''))}
                  />

                  <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                    <div style={{ flex:1 }}>
                      <label style={labelStyle}>Code OTP (email)</label>
                      <input type="text" maxLength={6}
                        style={{ ...inputStyle, marginBottom:0,
                          fontFamily:'monospace', letterSpacing:4,
                          fontSize:16, fontWeight:700 }}
                        placeholder="123456"
                        value={codeOtp}
                        onChange={e => setCodeOtp(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <button onClick={handleDemanderOtp}
                      disabled={otpLoading || codeTransaction.length < 6}
                      title={codeTransaction.length < 6 ? 'Saisissez d\'abord le code de transaction' : ''}
                      style={{ background: otpEnvoye
                        ? '#ecfdf5'
                        : codeTransaction.length < 6
                          ? '#e5e7eb'
                          : `linear-gradient(135deg, ${GOLD}, #e8c06a)`,
                        border:'none', borderRadius:8, padding:'11px 14px',
                        cursor: (otpLoading || codeTransaction.length < 6) ? 'not-allowed' : 'pointer',
                        fontSize:12, fontWeight:700,
                        color: otpEnvoye ? '#10b981' : codeTransaction.length < 6 ? '#9ca3af' : PRIMARY,
                        fontFamily:'inherit', whiteSpace:'nowrap',
                        marginBottom:12 }}>
                      {otpLoading ? 'Envoi...' : otpEnvoye ? '✓ Renvoyé' : 'Envoyer OTP'}
                    </button>
                  </div>

                  {/* Affichage code en mode dev */}
                  {otpDevCode && (
                    <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe',
                      borderRadius:8, padding:'10px 14px', marginTop:4,
                      fontSize:13, color:'#1e40af' }}>
                      <strong>Mode développement</strong> — Code OTP :{' '}
                      <span style={{ fontFamily:'monospace', fontSize:18,
                        fontWeight:800, letterSpacing:4 }}>{otpDevCode}</span>
                      <br/>
                      <span style={{ fontSize:11, color:'#6b7280' }}>
                        (Auto-rempli. En production ce code sera envoyé uniquement par email.)
                      </span>
                    </div>
                  )}

                  {otpEnvoye && !otpDevCode && (
                    <p style={{ fontSize:12, color:'#6b7280', marginTop:4, marginBottom:0 }}>
                      Code envoyé sur votre email. Valable <strong>2 minutes</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f0f2f7',
              display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setOpenDialog(null)} disabled={loading}
                style={{ background:'#f0f2f7', border:'none', borderRadius:8,
                  padding:'11px 20px', cursor:'pointer',
                  fontSize:14, color:'#374151', fontFamily:'inherit' }}>
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={loading}
                style={{ background: loading
                  ? '#e5e7eb'
                  : (openDialog === 'versement' ? '#10b981'
                      : openDialog === 'retrait' ? '#ef4444' : '#3b82f6'),
                  border:'none', borderRadius:8, padding:'11px 24px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize:14, fontWeight:700, color:'#fff', fontFamily:'inherit' }}>
                {loading ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bouton carte d'action ─────────────────────────────────────── */
function OpBtn({ label, sub, color, lightBg, icon, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'#fff',
        border: hov ? `1px solid ${color}` : '1px solid #e4e8ef',
        borderRadius:14, padding:'24px 20px', cursor:'pointer',
        textAlign:'left', fontFamily:'inherit',
        display:'flex', flexDirection:'column', gap:12,
        boxShadow: hov ? `0 4px 16px ${color}20` : 'none',
        transition:'all 0.2s' }}>
      <div style={{ width:44, height:44, borderRadius:10,
        background:lightBg, display:'flex', alignItems:'center',
        justifyContent:'center', color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:'#1a3a5c', marginBottom:2 }}>
          {label}
        </div>
        <div style={{ fontSize:12, color:'#9ca3af' }}>{sub}</div>
      </div>
    </button>
  );
}

export default Operations;