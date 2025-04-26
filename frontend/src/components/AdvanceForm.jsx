import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdvanceForm = ({ open, onClose, onSuccess }) => {
    const { checkAuth } = useAuth();
    const initialFormState = {
        title: '',
        description: '',
        amount: '',
        type: 'given',
        counterpartyType: 'company',
        counterpartyId: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState(null);
    const { companies = [], brokers = [], fetchCompanies, fetchBrokers } = useData();

    // Add ESC key handler
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && open) {
                onClose();
                setFormData(initialFormState);
                setError(null);
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            fetchCompanies && fetchCompanies();
            fetchBrokers && fetchBrokers();
        }
    }, [open, fetchCompanies, fetchBrokers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Reset counterpartyId if type changes
        if (name === 'counterpartyType') {
            setFormData(prev => ({ ...prev, counterpartyId: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prepare payload for backend
            const payload = {
                title: formData.title,
                description: formData.description,
                amount: formData.amount,
                type: formData.type,
                counterpartyType: formData.counterpartyType,
                counterpartyId: formData.counterpartyId
            };
            await axios.post(`${backendUrl}/api/advances`, payload);
            onSuccess();
            setFormData(initialFormState);
            checkAuth();
        } catch (err) {
            setError('Failed to create advance');
            console.error(err);
        }
    };

    // Get the list to show in dropdown
    const counterpartyList = formData.counterpartyType === 'company' ? (Array.isArray(companies) ? companies : []) : (Array.isArray(brokers) ? brokers : []);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>New Advance</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            fullWidth
                        />
                        <TextField
                            label="Amount"
                            name="amount"
                            type="number"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="given">Given</MenuItem>
                                <MenuItem value="received">Received</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Counterparty Type</InputLabel>
                            <Select
                                name="counterpartyType"
                                value={formData.counterpartyType}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="company">Company</MenuItem>
                                <MenuItem value="broker">Broker</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>{formData.counterpartyType === 'company' ? 'Company' : 'Broker'}</InputLabel>
                            <Select
                                name="counterpartyId"
                                value={formData.counterpartyId}
                                onChange={handleChange}
                                required
                            >
                                {counterpartyList.map(item => (
                                    <MenuItem key={item._id} value={item._id}>
                                        {item.name} {item.email ? `(${item.email})` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {error && (
                            <Box color="error.main">{error}</Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AdvanceForm; 