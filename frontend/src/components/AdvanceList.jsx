import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Grid,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, SwapHoriz as SwapIcon, Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import AdvanceForm from './AdvanceForm';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdvanceList = () => {
  const { checkAuth } = useAuth();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const { companies = [], brokers = [], fetchCompanies, fetchBrokers } = useData();

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/advances`, {
        params: {
          type: filterType !== 'all' ? filterType : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined
        }
      });
      setAdvances(Array.isArray(response.data.data) ? response.data.data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch advances');
      console.error(err);
      setAdvances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, [filterType, filterStatus]);

  const handleToggleAdvance = async (id) => {
    if (window.confirm('Are you sure you want to toggle the advance status?')) {
      try {
        await axios.put(`${backendUrl}/api/advances/${id}/toggle`);
        fetchAdvances();
        checkAuth();
      } catch (err) {
        setError('Failed to toggle advance status');
        console.error(err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'returned':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'given':
        return 'error';
      case 'received':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleTitleClick = (advance) => {
    setSelectedAdvance(advance);
    setEditData({
      ...advance,
      counterpartyId: typeof advance.counterpartyId === 'object' && advance.counterpartyId !== null
        ? advance.counterpartyId._id
        : advance.counterpartyId
    });
    setEditMode(false);
    setModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${backendUrl}/api/advances/${selectedAdvance._id}/update`, editData);
      setModalOpen(false);
      setEditMode(false);
      fetchAdvances();
      checkAuth();
    } catch (err) {
      setError('Failed to update advance');
      console.error(err);
    }
  };

  // Get the list to show in dropdown
  const counterpartyList = editData.counterpartyType === 'company' ? (Array.isArray(companies) ? companies : []) : (Array.isArray(brokers) ? brokers : []);

  useEffect(() => {
    if (modalOpen && editMode) {
      fetchCompanies && fetchCompanies();
      fetchBrokers && fetchBrokers();
    }
  }, [modalOpen, editMode, fetchCompanies, fetchBrokers]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h5">Advances</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenForm(true)}
            size="small"
            fullWidth={false}
          >
            New
          </Button>
          <IconButton onClick={fetchAdvances} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="given">Given</MenuItem>
            <MenuItem value="received">Received</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="returned">Returned</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Desktop View - Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>From/To</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {advances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No advances found
                      </TableCell>
                    </TableRow>
                  ) : (
                    advances.map((advance) => (
                      <TableRow
                        key={advance._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <Button variant="text" onClick={() => handleTitleClick(advance)}>
                            {advance.title}
                          </Button>
                        </TableCell>
                        <TableCell>₹{advance.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={advance.type}
                            color={getTypeColor(advance.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={advance.status}
                            color={getStatusColor(advance.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {advance.type === 'given'
                            ? `To: ${advance.counterpartyId?.name || 'Unknown'}`
                            : `From: ${advance.counterpartyId?.name || 'Unknown'}`}
                        </TableCell>
                        <TableCell>
                          {new Date(advance.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={advance.type === 'given' ? 'Mark as Received' : 'Mark as Given'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleAdvance(advance._id)}
                              color={advance.type === 'given' ? 'success' : 'error'}
                            >
                              <SwapIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile View - Cards */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {advances.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">No advances found</Typography>
              </Paper>
            ) : (
              advances.map((advance) => (
                <Paper
                  key={advance._id}
                  sx={{
                    p: 2,
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleTitleClick(advance)}>
                      {advance.title}
                    </Typography>
                    <Tooltip title={advance.type === 'given' ? 'Mark as Received' : 'Mark as Given'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleAdvance(advance._id)}
                        color={advance.type === 'given' ? 'success' : 'error'}
                      >
                        <SwapIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Amount:</Typography>
                      <Typography variant="body1">₹{advance.amount}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Date:</Typography>
                      <Typography variant="body1">{new Date(advance.createdAt).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={advance.type}
                          color={getTypeColor(advance.type)}
                          size="small"
                        />
                        <Chip
                          label={advance.status}
                          color={getStatusColor(advance.status)}
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" noWrap>
                        {advance.type === 'given'
                          ? `To: ${advance.counterpartyId?.name || 'Unknown'}`
                          : `From: ${advance.counterpartyId?.name || 'Unknown'}`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))
            )}
          </Box>
        </>
      )}

      <AdvanceForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSuccess={() => {
          setOpenForm(false);
          fetchAdvances();
        }}
      />

      {/* Advance Details Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Advance Details
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAdvance && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Title"
                name="title"
                value={editData.title || ''}
                onChange={handleEditChange}
                InputProps={{ readOnly: !editMode }}
                fullWidth
                size="small"
              />
              <TextField
                label="Description"
                name="description"
                value={editData.description || ''}
                onChange={handleEditChange}
                InputProps={{ readOnly: !editMode }}
                fullWidth
                multiline
                rows={2}
                size="small"
              />
              <TextField
                label="Amount"
                name="amount"
                type="number"
                value={editData.amount || ''}
                onChange={handleEditChange}
                InputProps={{ readOnly: !editMode }}
                fullWidth
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={editData.type || ''}
                  onChange={handleEditChange}
                  disabled={!editMode}
                >
                  <MenuItem value="given">Given</MenuItem>
                  <MenuItem value="received">Received</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Counterparty Type</InputLabel>
                <Select
                  name="counterpartyType"
                  value={editData.counterpartyType || ''}
                  onChange={handleEditChange}
                  disabled={!editMode}
                >
                  <MenuItem value="company">Company</MenuItem>
                  <MenuItem value="broker">Broker</MenuItem>
                </Select>
              </FormControl>

              <Autocomplete
                fullWidth
                size="small"
                options={counterpartyList}
                getOptionLabel={(option) =>
                  `${option.name}${option.email ? ` (${option.email})` : ''}`
                }
                value={
                  counterpartyList.find(item => item._id === editData.counterpartyId) || null
                }
                onChange={(event, newValue) => {
                  handleEditChange({
                    target: {
                      name: 'counterpartyId',
                      value: newValue ? newValue._id : '',
                    },
                  });
                }}
                disabled={!editMode}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      editData.counterpartyType === 'company'
                        ? 'Company (Client/Provider/Both)'
                        : 'Broker'
                    }
                    required
                  />
                )}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!editMode ? (
            <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)} color="primary" size="small">
              Edit
            </Button>
          ) : (
            <Button startIcon={<SaveIcon />} onClick={handleSaveEdit} color="success" size="small">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvanceList; 