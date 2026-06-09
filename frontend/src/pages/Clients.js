import React, { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient, bloquerClient, debloquerClient } from '../services/api';
import {
  Box, Card, CardContent, Button, Typography, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, Avatar, Alert, Snackbar, InputAdornment, Grid
} from '@mui/material';
import { Add, Delete, Block, Search, Person, Email, Phone, LocationOn, Badge, Close, LockOpen, Edit } from '@mui/icons-material';

function Clients() {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', motDePasse: '',
    telephone: '', cin: '', adresse: ''
  });

  useEffect(() => { chargerClients(); }, []);

  useEffect(() => {
    setFiltered(clients.filter(c =>
      `${c.nom} ${c.prenom} ${c.email} ${c.cin || ''}`.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, clients]);

  const chargerClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data);
    } catch (e) {
      console.error('Erreur chargement clients', e);
    }
  };

  const openEditDialog = (client) => {
    setCurrentClient(client);
    setForm({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      motDePasse: '', // laisser vide pour ne pas changer
      telephone: client.telephone || '',
      cin: client.cin || '',
      adresse: client.adresse || ''
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      setSnackbar({ open: true, message: 'Nom, prénom et email sont obligatoires', severity: 'warning' });
      return;
    }
    try {
      if (editMode && currentClient) {
        const updateData = { ...form };
        if (!updateData.motDePasse) delete updateData.motDePasse;
        await updateClient(currentClient.id, updateData);
        setSnackbar({ open: true, message: 'Client modifié avec succès', severity: 'success' });
      } else {
        if (!form.motDePasse) {
          setSnackbar({ open: true, message: 'Mot de passe obligatoire pour la création', severity: 'warning' });
          return;
        }
        await createClient(form);
        setSnackbar({ open: true, message: 'Client créé avec succès', severity: 'success' });
      }
      setOpenDialog(false);
      setEditMode(false);
      setCurrentClient(null);
      setForm({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', cin: '', adresse: '' });
      chargerClients();
    } catch (e) {
      const msg = e.response?.data?.error || 'Erreur lors de l\'opération';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement ce client ?')) {
      try {
        await deleteClient(id);
        chargerClients();
        setSnackbar({ open: true, message: 'Client supprimé', severity: 'info' });
      } catch (e) {
        const msg = e.response?.data?.error || 'Erreur lors de la suppression';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    }
  };

  const handleToggleBloquer = async (client) => {
    try {
      if (client.estBloque) {
        await debloquerClient(client.id);
        setSnackbar({ open: true, message: 'Client débloqué', severity: 'success' });
      } else {
        await bloquerClient(client.id);
        setSnackbar({ open: true, message: 'Client bloqué', severity: 'warning' });
      }
      chargerClients();
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur', severity: 'error' });
    }
  };

  const getInitials = (nom, prenom) =>
    `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e' }}>Gestion des Clients</Typography>
          <Typography sx={{ color: '#666', mt: 0.5 }}>{clients.length} client(s) enregistré(s)</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditMode(false); setOpenDialog(true); }}
          sx={{ background: 'linear-gradient(135deg, #1a237e, #1565c0)', borderRadius: 2, px: 3 }}>
          Nouveau Client
        </Button>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField fullWidth placeholder="Rechercher par nom, prénom, email ou CIN..."
            value={search} onChange={e => setSearch(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>CIN</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(client => (
                <TableRow key={client.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: client.estBloque ? '#d32f2f' : '#1565c0', width: 38, height: 38, fontSize: 14 }}>
                        {getInitials(client.nom, client.prenom)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{client.prenom} {client.nom}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#666' }}>{client.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{client.telephone || '—'}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#666' }}>{client.adresse || '—'}</Typography>
                  </TableCell>
                  <TableCell>{client.cin || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={client.estBloque ? 'Bloqué' : (client.statut || 'ACTIF')}
                      size="small"
                      color={client.estBloque ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEditDialog(client)} color="primary" size="small" title="Modifier">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleToggleBloquer(client)}
                      color={client.estBloque ? 'success' : 'warning'}
                      size="small"
                      title={client.estBloque ? 'Débloquer' : 'Bloquer'}>
                      {client.estBloque ? <LockOpen fontSize="small" /> : <Block fontSize="small" />}
                    </IconButton>
                    <IconButton onClick={() => handleDelete(client.id)} color="error" size="small" title="Supprimer">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#999' }}>
                    Aucun client trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditMode(false); setCurrentClient(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editMode ? 'Modifier le client' : 'Nouveau Client'}</Typography>
          <IconButton onClick={() => { setOpenDialog(false); setEditMode(false); setCurrentClient(null); }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Prénom *" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={editMode ? "Mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"} type="password"
                value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="CIN" value={form.cin} onChange={e => setForm({ ...form, cin: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Badge fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Adresse" value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn fontSize="small" /></InputAdornment> }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenDialog(false); setEditMode(false); setCurrentClient(null); }} color="inherit">Annuler</Button>
          <Button onClick={handleSubmit} variant="contained"
            sx={{ background: 'linear-gradient(135deg, #1a237e, #1565c0)' }}>
            {editMode ? 'Mettre à jour' : 'Créer le client'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Clients;