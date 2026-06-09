import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const getToken = () => localStorage.getItem('token');

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const authHeader = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// ── AUTH ──────────────────────────────────────────────────────────────────
export const login = (email, motDePasse) =>
  axios.post(`${API_URL}/auth/login`, { email, motDePasse });

export const register = (userData) =>
  axios.post(`${API_URL}/auth/register`, userData);

// ── CLIENTS ───────────────────────────────────────────────────────────────
export const getClients = () => axios.get(`${API_URL}/clients`, authHeader());
export const getClientMe = () => axios.get(`${API_URL}/clients/me`, authHeader());
export const createClient = (client) => axios.post(`${API_URL}/clients`, client, authHeader());
export const updateClient = (id, client) => axios.put(`${API_URL}/clients/${id}`, client, authHeader());
export const deleteClient = (id) => axios.delete(`${API_URL}/clients/${id}`, authHeader());
export const bloquerClient = (id) => axios.put(`${API_URL}/clients/${id}/bloquer`, {}, authHeader());
export const debloquerClient = (id) => axios.put(`${API_URL}/clients/${id}/debloquer`, {}, authHeader());

// Nouvelle fonction pour changer le mot de passe avec vérification de l'ancien
export const changerMotDePasse = (id, ancienMotDePasse, nouveauMotDePasse) =>
  axios.put(`${API_URL}/clients/${id}/password`, { ancienMotDePasse, nouveauMotDePasse }, authHeader());

// ── EMPLOYES ──────────────────────────────────────────────────────────────
export const getEmployes = () => axios.get(`${API_URL}/employes`, authHeader());
export const createEmploye = (employe) => axios.post(`${API_URL}/employes`, employe, authHeader());
export const updateEmploye = (id, employe) => axios.put(`${API_URL}/employes/${id}`, employe, authHeader());
export const deleteEmploye = (id) => axios.delete(`${API_URL}/employes/${id}`, authHeader());

// ── COMPTES ───────────────────────────────────────────────────────────────
export const getComptes = () => axios.get(`${API_URL}/comptes`, authHeader());
export const getMesComptes = () => axios.get(`${API_URL}/comptes/me`, authHeader());
export const getComptesByClient = (clientId) => axios.get(`${API_URL}/comptes/client/${clientId}`, authHeader());
export const ouvrirCompteCourant = (clientId, data) => axios.post(`${API_URL}/comptes/courant/${clientId}`, data, authHeader());
export const ouvrirCompteEpargne = (clientId, data) => axios.post(`${API_URL}/comptes/epargne/${clientId}`, data, authHeader());
export const cloturerCompte = (numeroCompte) => axios.put(`${API_URL}/comptes/${encodeURIComponent(numeroCompte)}/cloturer`, {}, authHeader());

// ── OPERATIONS ────────────────────────────────────────────────────────────
export const getOperations = () => axios.get(`${API_URL}/operations`, authHeader());
export const getMesOperations = () => axios.get(`${API_URL}/operations/me`, authHeader());

export const demanderOtpTransaction = (codeTransaction) =>
  axios.post(`${API_URL}/operations/otp/demander`, { codeTransaction }, authHeader());

export const effectuerVirement = (data) =>
  axios.post(`${API_URL}/operations/virement`, {
    compteSourceId: data.compteSourceId,
    compteDestId: data.compteDestId,
    montant: String(data.montant),
    motif: data.motif || '',
    codeTransaction: data.codeTransaction || '',
    codeOtp: data.codeOtp || '',
  }, authHeader());

export const effectuerVersement = (data) =>
  axios.post(`${API_URL}/operations/versement`, {
    compteDestId: data.compteDestId,
    montant: String(data.montant),
    source: data.source || 'ESPECE',
  }, authHeader());

export const effectuerRetrait = (data) =>
  axios.post(`${API_URL}/operations/retrait`, {
    compteSourceId: data.compteSourceId,
    montant: String(data.montant),
    modeRetrait: data.modeRetrait || 'GUICHET',
    codeTransaction: data.codeTransaction || '',
    codeOtp: data.codeOtp || '',
  }, authHeader());

// ── SECURITE ──────────────────────────────────────────────────────────────
export const definirCodeTransaction = (code) =>
  axios.post(`${API_URL}/securite/code-transaction`, { code }, authHeader());

export const getStatutCodeTransaction = () =>
  axios.get(`${API_URL}/securite/code-transaction/statut`, authHeader());

// ── AUDIT ─────────────────────────────────────────────────────────────────
export const getAuditLogs = () => axios.get(`${API_URL}/audit`, authHeader());