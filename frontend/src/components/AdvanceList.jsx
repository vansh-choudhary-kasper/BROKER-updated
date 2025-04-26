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
    Tooltip
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
        try {
            await axios.put(`${backendUrl}/api/advances/${id}/toggle`);
            fetchAdvances();
            checkAuth();
        } catch (err) {
            setError('Failed to toggle advance status');
            console.error(err);
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
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Advances</Typography>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenForm(true)}
                        sx={{ mr: 2 }}
                    >
                        New Advance
                    </Button>
                    <IconButton onClick={fetchAdvances}>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 120 }}>
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

                <FormControl sx={{ minWidth: 120 }}>
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
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {loading ? (
                <Typography>Loading...</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
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
                                            <Button variant="text" onClick={() => handleTitleClick(advance)}>{advance.title}</Button>
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
                    <IconButton onClick={() => setModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
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
                            />
                            <TextField
                                label="Amount"
                                name="amount"
                                type="number"
                                value={editData.amount || ''}
                                onChange={handleEditChange}
                                InputProps={{ readOnly: !editMode }}
                                fullWidth
                            />
                            <FormControl fullWidth>
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
                            <FormControl fullWidth>
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
                            <FormControl fullWidth>
                                <InputLabel>{editData.counterpartyType === 'company' ? 'Company' : 'Broker'}</InputLabel>
                                <Select
                                    name="counterpartyId"
                                    value={editData.counterpartyId || ''}
                                    onChange={handleEditChange}
                                    disabled={!editMode}
                                >
                                    {counterpartyList.map(item => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.name} {item.email ? `(${item.email})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {!editMode ? (
                        <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)} color="primary">Edit</Button>
                    ) : (
                        <Button startIcon={<SaveIcon />} onClick={handleSaveEdit} color="success">Save</Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdvanceList; 