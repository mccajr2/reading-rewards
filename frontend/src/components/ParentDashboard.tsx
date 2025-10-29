import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { fetchWithAuth } from '../fetchWithAuth';
const API_URL = import.meta.env.VITE_API_URL;

export default function ParentDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [kids, setKids] = useState<Array<{ id: string, firstName: string, username: string }>>([]);
    const [form, setForm] = useState({ username: '', firstName: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'PARENT') {
            navigate('/');
            return;
        }
        fetchWithAuth(`${API_URL}/parent/kids`, {}, token)
            .then(res => res.json())
            .then(setKids)
            .catch(() => setKids([]));
    }, [user, token, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleAddKid = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await fetchWithAuth(`${API_URL}/parent/kids`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            }, token);
            if (!res.ok) {
                const text = await res.text();
                setError(text || 'Failed to add child');
                return;
            }
            setSuccess('Child account created!');
            setForm({ username: '', firstName: '', password: '' });
            // Refresh kids list
            const kidsRes = await fetchWithAuth(`${API_URL}/parent/kids`, {}, token);
            setKids(await kidsRes.json());
        } catch {
            setError('Failed to add child');
        }
    };

    // State for reset child password form
    const [resetForm, setResetForm] = useState({ childUsername: '', newPassword: '' });

    const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setResetForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };
    const [resetMsg, setResetMsg] = useState('');
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    const openResetDialog = (childUsername: string) => {
        setResetForm({ childUsername, newPassword: '' });
        setResetMsg('');
        setResetDialogOpen(true);
    };

    const closeResetDialog = () => {
        setResetDialogOpen(false);
        setResetForm({ childUsername: '', newPassword: '' });
        setResetMsg('');
    };

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setResetMsg('');
        try {
            const res = await fetchWithAuth(`${API_URL}/parent/reset-child-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resetForm)
            }, token);
            if (!res.ok) {
                const text = await res.text();
                setResetMsg(text || 'Failed to reset password');
                return;
            }
            setResetMsg('Password reset successfully!');
            setResetForm({ childUsername: '', newPassword: '' });
            setTimeout(() => setResetDialogOpen(false), 1200);
        } catch {
            setResetMsg('Failed to reset password');
        }
    };
    return (
        <>
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 6 }}>
                <Typography variant="h6" sx={{ mt: 4 }}>Your Kids</Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>First Name</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {kids.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3}><Typography>No kids found.</Typography></TableCell>
                                </TableRow>
                            ) : (
                                kids.map(kid => (
                                    <TableRow key={kid.id}>
                                        <TableCell>{kid.firstName}</TableCell>
                                        <TableCell>{kid.username}</TableCell>
                                        <TableCell align="right">
                                            <Button variant="outlined" color="secondary" size="small" onClick={() => openResetDialog(kid.username)}>
                                                Reset Password
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Typography variant="h6" sx={{ mt: 4 }}>Add a New Kid</Typography>
                <form onSubmit={handleAddKid}>
                    <TextField
                        label="Username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        required
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="First Name"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        fullWidth
                        sx={{ mb: 2 }}
                    />
                    {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                    {success && <Typography color="primary" sx={{ mb: 2 }}>{success}</Typography>}
                    <Button type="submit" variant="contained" color="primary">Add Kid</Button>
                </form>
            </Box>
            <Dialog open={resetDialogOpen} onClose={closeResetDialog}>
                <DialogTitle>Reset Password for {resetForm.childUsername}</DialogTitle>
                <form onSubmit={handleResetPassword}>
                    <DialogContent>
                        <TextField
                            label="New Password"
                            name="newPassword"
                            type="password"
                            value={resetForm.newPassword}
                            onChange={handleResetChange}
                            required
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                        {resetMsg && <Typography color={resetMsg.includes('success') ? 'primary' : 'error'} sx={{ mb: 2 }}>{resetMsg}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeResetDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" color="secondary">Reset Password</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>)
}
