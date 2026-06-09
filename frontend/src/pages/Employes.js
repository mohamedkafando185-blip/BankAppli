import React, { useState, useEffect } from 'react';
import { getEmployes, createEmploye, updateEmploye, deleteEmploye } from '../services/api';
import {
  Box, Card, CardContent, Button, Typography, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Alert, Snackbar, Grid, MenuItem, InputAdornment, Avatar
} from '@mui/material';
import { Add, Delete, Edit, Search, Close } from '@mui/icons-material';

function Employes() {
  const [employes, setEmployes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEmp, setCurrentEmp] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', motDePasse: '', telephone: '',
    cin: '', adresse: '', matricule: '', poste: '', departement: '',
    agence: '', role: 'EMPLOYE', typeContrat: 'CDI', salaire: '', statut: 'ACTIF'
  });

  useEffect(() => { chargerEmployes(); }, []);

  useEffect(() => {
    setFiltered(employes.filter(e =>
      `${e.nom || ''} ${e.prenom || ''} ${e.email || ''} ${e.poste || ''}`.toLowerCase()
        .includes(search.toLowerCase())
    ));
  }, [search, employes]);

  const chargerEmployes = async () => {
    try {
      const res = await getEmployes();
      setEmployes(res.data);
    } catch (e) {
      console.error('Erreur chargement employés', e);
    }
  };

  const openEditDialog = (emp) => {
    setCurrentEmp(emp);
    setForm({
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email: emp.email || '',
      motDePasse: '', // le mot de passe n'est pas pré-rempli pour des raisons de sécurité
      telephone: emp.telephone || '',
      cin: emp.cin || '',
      adresse: emp.adresse || '',
      matricule: emp.matricule || '',
      poste: emp.poste || '',
      departement: emp.departement || '',
      agence: emp.agence || '',
      role: emp.role || 'EMPLOYE',
      typeContrat: emp.typeContrat || 'CDI',
      salaire: emp.salaire || '',
      statut: emp.statut || 'ACTIF'
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    // Validation minimale
    if (!form.nom || !form.prenom || !form.email) {
      setSnackbar({ open: true, message: 'Nom, prénom et email sont obligatoires', severity: 'warning' });
      return;
    }
    // Pour la création, le mot de passe est obligatoire
    if (!editMode && !form.motDePasse) {
      setSnackbar({ open: true, message: 'Le mot de passe est obligatoire pour la création', severity: 'warning' });
      return;
    }

    try {
      if (editMode && currentEmp) {
        // Mise à jour : on n'envoie le mot de passe que s'il a été changé
        const updateData = { ...form };
        if (!updateData.motDePasse) delete updateData.motDePasse;
        if (updateData.salaire) updateData.salaire = Number(updateData.salaire);
        await updateEmploye(currentEmp.id, updateData);
        setSnackbar({ open: true, message: 'Employé modifié avec succès', severity: 'success' });
      } else {
        // Création
        await createEmploye({
          ...form,
          salaire: form.salaire ? Number(form.salaire) : null
        });
        setSnackbar({ open: true, message: 'Employé créé avec succès', severity: 'success' });
      }
      setOpenDialog(false);
      setEditMode(false);
      setCurrentEmp(null);
      setForm({
        nom: '', prenom: '', email: '', motDePasse: '', telephone: '',
        cin: '', adresse: '', matricule: '', poste: '', departement: '',
        agence: '', role: 'EMPLOYE', typeContrat: 'CDI', salaire: '', statut: 'ACTIF'
      });
      chargerEmployes();
    } catch (e) {
      const msg = e.response?.data?.error || 'Erreur lors de l\'opération';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement cet employé ?')) {
      try {
        await deleteEmploye(id);
        chargerEmployes();
        setSnackbar({ open: true, message: 'Employé supprimé', severity: 'info' });
      } catch (e) {
        const msg = e.response?.data?.error || 'Erreur lors de la suppression';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    }
  };

  const getRoleColor = (role) => {
    const colors = { ADMIN: 'error', MANAGER: 'warning', AUDITEUR: 'info', EMPLOYE: 'default' };
    return colors[role] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e' }}>Gestion des Employés</Typography>
          <Typography sx={{ color: '#666', mt: 0.5 }}>{employes.length} employé(s)</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditMode(false); setOpenDialog(true); }}
          sx={{ background: 'linear-gradient(135deg, #1a237e, #1565c0)', borderRadius: 2, px: 3 }}>
          Nouvel Employé
        </Button>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <TextField fullWidth placeholder="Rechercher par nom, email, poste..."
            value={search} onChange={e => setSearch(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} />
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Employé</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Poste</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Rôle</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Contrat</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1a237e' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(emp => (
                <TableRow key={emp.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#1565c0', width: 38, height: 38, fontSize: 14 }}>
                        {(emp.prenom?.[0] || '').toUpperCase()}{(emp.nom?.[0] || '').toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{emp.prenom} {emp.nom}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#666' }}>{emp.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{emp.poste || '—'}</TableCell>
                  <TableCell>
                    <Chip label={emp.role} size="small" color={getRoleColor(emp.role)} />
                  </TableCell>
                  <TableCell>{emp.typeContrat || '—'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEditDialog(emp)} color="primary" size="small" title="Modifier">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(emp.id)} color="error" size="small" title="Supprimer">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#999' }}>
                    Aucun employé trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setEditMode(false); setCurrentEmp(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editMode ? 'Modifier l\'employé' : 'Nouvel Employé'}</Typography>
          <IconButton onClick={() => { setOpenDialog(false); setEditMode(false); setCurrentEmp(null); }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Nom *" value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Prénom *" value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email *" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label={editMode ? "Mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
                type="password" value={form.motDePasse}
                onChange={e => setForm({ ...form, motDePasse: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Matricule" value={form.matricule}
                onChange={e => setForm({ ...form, matricule: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Poste" value={form.poste}
                onChange={e => setForm({ ...form, poste: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Département" value={form.departement}
                onChange={e => setForm({ ...form, departement: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Agence" value={form.agence}
                onChange={e => setForm({ ...form, agence: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Rôle" value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="EMPLOYE">Employé</MenuItem>
                <MenuItem value="AUDITEUR">Auditeur</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Type de contrat" value={form.typeContrat}
                onChange={e => setForm({ ...form, typeContrat: e.target.value })}>
                <MenuItem value="CDI">CDI</MenuItem>
                <MenuItem value="CDD">CDD</MenuItem>
                <MenuItem value="STAGE">Stage</MenuItem>
                <MenuItem value="INTERIM">Intérim</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Statut" value={form.statut || 'ACTIF'}
                onChange={e => setForm({ ...form, statut: e.target.value })}>
                <MenuItem value="ACTIF">Actif</MenuItem>
                <MenuItem value="INACTIF">Inactif</MenuItem>
                <MenuItem value="SUSPENDU">Suspendu</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Salaire (MAD)" type="number" value={form.salaire}
                onChange={e => setForm({ ...form, salaire: e.target.value })}
                inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Téléphone" value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenDialog(false); setEditMode(false); setCurrentEmp(null); }} color="inherit">Annuler</Button>
          <Button onClick={handleSubmit} variant="contained"
            sx={{ background: 'linear-gradient(135deg, #1a237e, #1565c0)' }}>
            {editMode ? 'Mettre à jour' : 'Créer l\'employé'}
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

export default Employes;