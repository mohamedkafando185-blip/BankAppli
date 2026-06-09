import React, { useState, useEffect } from 'react';
import { getClientMe, updateClient, getMesComptes, definirCodeTransaction, getStatutCodeTransaction, changerMotDePasse } from '../services/api';

const PRIMARY = '#1a3a5c';
const GOLD = '#c9a84c';

const formatRib = (rib) => {
  if (!rib || rib.length !== 24) return rib || '—';
  return `${rib.slice(0,5)} ${rib.slice(5,8)} ${rib.slice(8,11)} ${rib.slice(11,22)} ${rib.slice(22,24)}`;
};

function Field({ label, value, onChange, type='text', placeholder, readOnly }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>{label}</label>
      <input type={type} value={value||''} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
        style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', border: readOnly?'1.5px solid #f3f4f6':'1.5px solid #dde1e9', borderRadius:8, fontSize:14, color: readOnly?'#9ca3af':PRIMARY, background: readOnly?'#f9fafb':'#fff', outline:'none', fontFamily:'inherit' }}
        onFocus={e=>{ if(!readOnly) e.target.style.borderColor=GOLD; }}
        onBlur={e=>{ if(!readOnly) e.target.style.borderColor='#dde1e9'; }}
      />
    </div>
  );
}

function Card({ title, subtitle, children, action }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e4e8ef', marginBottom:20, overflow:'hidden' }}>
      <div style={{ padding:'18px 24px', borderBottom:'1px solid #f0f2f7', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h3 style={{ color:PRIMARY, fontSize:15, fontWeight:700, margin:0 }}>{title}</h3>
          {subtitle && <p style={{ color:'#9ca3af', fontSize:12, margin:'3px 0 0' }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ padding:'22px 24px' }}>{children}</div>
    </div>
  );
}

function Profil({ user, onLogout }) {
  const isClient = user.role === 'ROLE_CLIENT';
  const [clientData, setClientData] = useState(null);
  const [comptes, setComptes] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [pwdForm, setPwdForm] = useState({ ancien:'', nouveau:'', confirm:'' });
  const [showPwd, setShowPwd] = useState({ ancien:false, nouveau:false, confirm:false });
  const [codeForm, setCodeForm] = useState({ code:'', confirm:'' });
  const [aCodeTransaction, setACodeTransaction] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [codeSaving, setCodeSaving] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (isClient) {
      getClientMe().then(r => {
        setClientData(r.data);
        setForm({ nom:r.data.nom, prenom:r.data.prenom, telephone:r.data.telephone, adresse:r.data.adresse, cin:r.data.cin });
      }).catch(()=>{});
      getMesComptes().then(r => setComptes(r.data||[])).catch(()=>{});
      getStatutCodeTransaction().then(r => setACodeTransaction(r.data.aUnCodeTransaction)).catch(()=>{});
    }
  }, [isClient]);

  const showToast = (msg, type='success') => { setToast({msg, type}); setTimeout(()=>setToast(null), 3500); };

  const handleSaveInfo = async () => {
    if (!form.nom||!form.prenom) { showToast('Nom et prénom obligatoires.','error'); return; }
    setSaving(true);
    try {
      await updateClient(clientData.id, form);
      setClientData(prev=>({...prev,...form}));
      setEditMode(false);
      showToast('Informations mises à jour.');
    } catch(e) { showToast(e.response?.data?.message||'Erreur lors de la mise à jour.','error'); }
    finally { setSaving(false); }
  };

  const handleChangePwd = async () => {
    if (!pwdForm.ancien||!pwdForm.nouveau||!pwdForm.confirm) { showToast('Tous les champs sont obligatoires.','error'); return; }
    if (pwdForm.nouveau !== pwdForm.confirm) { showToast('Les nouveaux mots de passe ne correspondent pas.','error'); return; }
    if (pwdForm.nouveau.length < 6) { showToast('Le mot de passe doit contenir au moins 6 caractères.','error'); return; }
    setPwdSaving(true);
    try {
      // Utilisation de l'endpoint dédié /password
      await changerMotDePasse(clientData.id, pwdForm.ancien, pwdForm.nouveau);
      setPwdForm({ ancien:'', nouveau:'', confirm:'' });
      showToast('Mot de passe modifié avec succès.');
    } catch(e) { showToast(e.response?.data?.message||'Mot de passe actuel incorrect.','error'); }
    finally { setPwdSaving(false); }
  };

  const handleDefinirCode = async () => {
    if (!codeForm.code||!codeForm.confirm) { showToast('Les deux champs sont obligatoires.','error'); return; }
    if (!/^\d{6}$/.test(codeForm.code)) { showToast('Le code doit contenir exactement 6 chiffres.','error'); return; }
    if (codeForm.code !== codeForm.confirm) { showToast('Les codes ne correspondent pas.','error'); return; }
    setCodeSaving(true);
    try {
      await definirCodeTransaction(codeForm.code);
      setCodeForm({ code:'', confirm:'' });
      setACodeTransaction(true);
      showToast('Code de transaction défini avec succès.');
    } catch(e) { showToast(e.response?.data?.message||'Erreur lors de la définition du code.','error'); }
    finally { setCodeSaving(false); }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(()=>{ setCopied(label); setTimeout(()=>setCopied(''), 2000); });
  };

  const roleInfo = {
    ROLE_ADMIN:    { label:'Administrateur', color:'#ef4444', bg:'#fef2f2' },
    ROLE_MANAGER:  { label:'Manager',        color:'#f97316', bg:'#fff7ed' },
    ROLE_AUDITEUR: { label:'Auditeur',       color:'#3b82f6', bg:'#eff6ff' },
    ROLE_EMPLOYE:  { label:'Employé',        color:'#6366f1', bg:'#f5f3ff' },
    ROLE_CLIENT:   { label:'Client',         color:'#10b981', bg:'#ecfdf5' },
  }[user.role] || { label:user.role, color:'#6b7280', bg:'#f9fafb' };

  const PwdInput = ({ field, label }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type={showPwd[field]?'text':'password'} value={pwdForm[field]} onChange={e=>setPwdForm({...pwdForm,[field]:e.target.value})} placeholder="••••••••"
          style={{ width:'100%', boxSizing:'border-box', padding:'11px 42px 11px 14px', border:'1.5px solid #dde1e9', borderRadius:8, fontSize:14, color:PRIMARY, background:'#fff', outline:'none', fontFamily:'inherit' }}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='#dde1e9'} />
        <button type="button" onClick={()=>setShowPwd(p=>({...p,[field]:!p[field]}))}
          style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0 }}>
          {showPwd[field]
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
    </div>
  );

  const btnGold = (onClick, text, loading, disabled) => (
    <button onClick={onClick} disabled={loading||disabled}
      style={{ background: (loading||disabled)?'#e5e7eb':`linear-gradient(135deg,${GOLD},#e8c06a)`, border:'none', borderRadius:8, padding:'11px 22px', cursor:(loading||disabled)?'not-allowed':'pointer', fontSize:14, fontWeight:700, color:PRIMARY, fontFamily:'inherit' }}>
      {loading?'Traitement...':text}
    </button>
  );

  return (
    <div style={{ maxWidth:780, margin:'0 auto', fontFamily:"'Segoe UI', -apple-system, sans-serif", position:'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:24, right:24, zIndex:9999, background: toast.type==='success'?PRIMARY:'#dc2626', color:'#fff', padding:'14px 20px', borderRadius:10, fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', maxWidth:380 }}>
          {toast.type==='success' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
          {toast.msg}
        </div>
      )}

      {/* Avatar header */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e4e8ef', padding:'24px 28px', marginBottom:20, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:roleInfo.bg, border:`2px solid ${roleInfo.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:roleInfo.color, flexShrink:0 }}>
          {user.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:PRIMARY }}>
              {isClient && clientData ? `${clientData.prenom} ${clientData.nom}` : user.email}
            </h2>
            <span style={{ background:roleInfo.bg, color:roleInfo.color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{roleInfo.label.toUpperCase()}</span>
          </div>
          <p style={{ margin:'4px 0 0', color:'#6b7280', fontSize:14 }}>{user.email}</p>
          {isClient && clientData?.numeroClient && (
            <p style={{ margin:'2px 0 0', color:'#9ca3af', fontSize:12 }}>N° client : <span style={{ fontFamily:'monospace', color:'#6b7280' }}>{clientData.numeroClient}</span></p>
          )}
        </div>
      </div>

      {/* Mes comptes (client) */}
      {isClient && comptes.length > 0 && (
        <Card title="Mes comptes" subtitle="RIB et soldes de vos comptes">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {comptes.map(c => {
              const ep = c.tauxInteret != null;
              const ribFormate = formatRib(c.rib);
              const copiedNum = copied === `num-${c.numeroCompte}`;
              const copiedRib = copied === `rib-${c.rib}`;
              return (
                <div key={c.numeroCompte} style={{ background:'#f6f8fb', borderRadius:10, border:'1px solid #e4e8ef', padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:38, height:38, borderRadius:8, background: ep?'#ecfdf5':'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {ep
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        }
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:PRIMARY }}>{ep?'Compte Épargne':'Compte Courant'}</div>
                        <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>
                          Statut : <span style={{ color: c.statut==='ACTIF'?'#10b981':'#ef4444', fontWeight:600 }}>{c.statut}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:18, fontWeight:700, color:PRIMARY }}>{(c.solde||0).toLocaleString('fr-MA',{minimumFractionDigits:2})}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>MAD</div>
                    </div>
                  </div>

                  {/* Numéro compte */}
                  <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderRadius:8, padding:'8px 12px', border:'1px solid #e4e8ef' }}>
                    <div>
                      <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:2 }}>Numéro de compte</div>
                      <div style={{ fontSize:12, fontFamily:'monospace', color:'#4a6080' }}>{c.numeroCompte}</div>
                    </div>
                    <button onClick={()=>copyToClipboard(c.numeroCompte,`num-${c.numeroCompte}`)}
                      style={{ background:copiedNum?'#ecfdf5':'#f0f2f7', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', color:copiedNum?'#10b981':'#6b7280', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                      {copiedNum?'✓ Copié':'Copier'}
                    </button>
                  </div>

                  {/* RIB 24 chiffres */}
                  {c.rib && (
                    <div style={{ marginTop:8, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderRadius:8, padding:'8px 12px', border:'1px solid #e4e8ef' }}>
                      <div>
                        <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, letterSpacing:0.8, textTransform:'uppercase', marginBottom:2 }}>RIB (24 chiffres)</div>
                        <div style={{ fontSize:13, fontFamily:'monospace', color:PRIMARY, fontWeight:600, letterSpacing:1 }}>{ribFormate}</div>
                      </div>
                      <button onClick={()=>copyToClipboard(c.rib,`rib-${c.rib}`)}
                        style={{ background:copiedRib?'#ecfdf5':'#f0f2f7', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', color:copiedRib?'#10b981':'#6b7280', fontSize:11, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                        {copiedRib?'✓ Copié':'Copier'}
                      </button>
                    </div>
                  )}
                  {ep && (
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <div style={{ flex:1, background:'#f0fdf4', borderRadius:8, padding:'8px 12px' }}>
                        <div style={{ fontSize:10, color:'#6b7280', fontWeight:600, letterSpacing:0.8, textTransform:'uppercase' }}>Taux</div>
                        <div style={{ fontSize:15, fontWeight:700, color:'#10b981' }}>{c.tauxInteret}%</div>
                      </div>
                      {c.plafond && (
                        <div style={{ flex:1, background:'#f6f8fb', borderRadius:8, padding:'8px 12px' }}>
                          <div style={{ fontSize:10, color:'#6b7280', fontWeight:600, letterSpacing:0.8, textTransform:'uppercase' }}>Plafond</div>
                          <div style={{ fontSize:14, fontWeight:700, color:PRIMARY }}>{c.plafond.toLocaleString('fr-MA')} MAD</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Informations personnelles */}
      {isClient && (
        <Card title="Informations personnelles" subtitle="Vos données de contact"
          action={!editMode
            ? <button onClick={()=>setEditMode(true)} style={{ background:'#f0f2f7', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151', fontFamily:'inherit' }}>✏ Modifier</button>
            : <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>{ setEditMode(false); setForm({nom:clientData.nom,prenom:clientData.prenom,telephone:clientData.telephone,adresse:clientData.adresse,cin:clientData.cin}); }} style={{ background:'#f0f2f7', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:13, color:'#6b7280', fontFamily:'inherit' }}>Annuler</button>
                {btnGold(handleSaveInfo, 'Enregistrer', saving)}
              </div>
          }
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
            <Field label="Prénom" value={editMode?form.prenom:clientData?.prenom} readOnly={!editMode} onChange={e=>setForm({...form,prenom:e.target.value})} />
            <Field label="Nom" value={editMode?form.nom:clientData?.nom} readOnly={!editMode} onChange={e=>setForm({...form,nom:e.target.value})} />
            <Field label="Email" value={clientData?.email} readOnly />
            <Field label="Téléphone" value={editMode?form.telephone:clientData?.telephone} readOnly={!editMode} placeholder="+212 6XX XXX XXX" onChange={e=>setForm({...form,telephone:e.target.value})} />
            <Field label="CIN" value={editMode?form.cin:clientData?.cin} readOnly={!editMode} placeholder="AB123456" onChange={e=>setForm({...form,cin:e.target.value})} />
            <Field label="Statut" value={clientData?.statut} readOnly />
          </div>
          <Field label="Adresse" value={editMode?form.adresse:clientData?.adresse} readOnly={!editMode} placeholder="Rue, ville, pays" onChange={e=>setForm({...form,adresse:e.target.value})} />
        </Card>
      )}

      {!isClient && (
        <Card title="Informations du compte" subtitle="Vos informations de connexion">
          <Field label="Email" value={user.email} readOnly />
          <Field label="Rôle" value={roleInfo.label} readOnly />
        </Card>
      )}

      {/* Code de transaction (client uniquement) */}
      {isClient && (
        <Card title="Code de transaction"
          subtitle={aCodeTransaction ? "✓ Code configuré — vous pouvez effectuer des opérations" : "⚠ Aucun code défini — obligatoire pour les retraits et virements"}>
          <div style={{ maxWidth:420 }}>
            {aCodeTransaction && (
              <div style={{ background:'#ecfdf5', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'#166534', fontSize:13 }}>
                Votre code de transaction est actif. Vous pouvez le modifier ci-dessous.
              </div>
            )}
            <p style={{ color:'#6b7280', fontSize:13, marginBottom:16 }}>
              Ce code à <strong>6 chiffres</strong> est différent de votre mot de passe. Il est requis avant chaque opération (retrait, virement) pour sécuriser vos transactions.
            </p>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>
                {aCodeTransaction ? 'Nouveau code (6 chiffres)' : 'Code (6 chiffres)'}
              </label>
              <input type="password" maxLength={6} value={codeForm.code} onChange={e=>setCodeForm({...codeForm,code:e.target.value.replace(/\D/g,'')})} placeholder="••••••"
                style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', border:'1.5px solid #dde1e9', borderRadius:8, fontSize:18, letterSpacing:6, color:PRIMARY, background:'#fff', outline:'none', fontFamily:'monospace' }}
                onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='#dde1e9'} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.8, marginBottom:5 }}>Confirmer le code</label>
              <input type="password" maxLength={6} value={codeForm.confirm} onChange={e=>setCodeForm({...codeForm,confirm:e.target.value.replace(/\D/g,'')})} placeholder="••••••"
                style={{ width:'100%', boxSizing:'border-box', padding:'11px 14px', border:'1.5px solid #dde1e9', borderRadius:8, fontSize:18, letterSpacing:6, color:PRIMARY, background:'#fff', outline:'none', fontFamily:'monospace' }}
                onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor='#dde1e9'} />
            </div>
            {btnGold(handleDefinirCode, aCodeTransaction?'Modifier le code':'Définir le code', codeSaving)}
          </div>
        </Card>
      )}

      {/* Changement mot de passe */}
      <Card title="Sécurité — Mot de passe" subtitle="Modifiez votre mot de passe de connexion">
        <div style={{ maxWidth:420 }}>
          <PwdInput field="ancien" label="Mot de passe actuel" />
          <PwdInput field="nouveau" label="Nouveau mot de passe" />
          <PwdInput field="confirm" label="Confirmer le nouveau mot de passe" />
          {pwdForm.nouveau && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#6b7280', marginBottom:4 }}>
                Force : <span style={{ fontWeight:700, color: pwdForm.nouveau.length>=12?'#10b981':pwdForm.nouveau.length>=8?'#f59e0b':'#ef4444' }}>
                  {pwdForm.nouveau.length>=12?'Fort':pwdForm.nouveau.length>=8?'Moyen':'Faible'}
                </span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[1,2,3].map(i=>(
                  <div key={i} style={{ flex:1, height:4, borderRadius:2, background: (i===1&&pwdForm.nouveau.length>=6)||(i===2&&pwdForm.nouveau.length>=8)||(i===3&&pwdForm.nouveau.length>=12) ? (pwdForm.nouveau.length>=12?'#10b981':pwdForm.nouveau.length>=8?'#f59e0b':'#ef4444') : '#e5e7eb' }} />
                ))}
              </div>
            </div>
          )}
          {btnGold(handleChangePwd, 'Changer le mot de passe', pwdSaving)}
        </div>
      </Card>

      {/* Déconnexion */}
      <Card title="Déconnexion">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <p style={{ color:'#6b7280', fontSize:14, margin:0 }}>Terminer votre session sur cet appareil.</p>
          <button onClick={onLogout} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 20px', cursor:'pointer', color:'#dc2626', fontSize:14, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Se déconnecter
          </button>
        </div>
      </Card>
    </div>
  );
}

export default Profil;