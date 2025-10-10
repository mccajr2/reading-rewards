
import { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, TextField, List, ListItem, Divider } from '@mui/material';

interface Book {
    olid: string;
    title: string;
    authors?: string[];
}
interface Chapter {
    id: string;
    name: string;
    chapterIndex: number;
    bookOlid: string;
}
interface BookRead {
    id: string;
    startDate?: string;
    endDate?: string;
    inProgress?: boolean;
    book?: Book;
}
interface Reward {
    id: string;
    type: 'EARN' | 'PAYOUT' | 'SPEND';
    amount: number;
    note?: string;
    createdAt: string;
    chapter?: Chapter;
    bookRead?: BookRead;
}

export default function Rewards() {
    const API_URL = import.meta.env.VITE_API_URL;
    const [summary, setSummary] = useState({ totalEarned: 0, totalPaidOut: 0, totalSpent: 0, currentBalance: 0 });
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [payout, setPayout] = useState('');
    const [spend, setSpend] = useState('');
    const [spendNote, setSpendNote] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSummary = async () => {
        const r = await fetch(`${API_URL}/rewards/summary`);
        setSummary(await r.json());
    };
    const fetchRewards = async () => {
        const r = await fetch(`${API_URL}/rewards`);
        const data = await r.json();
        // Map backend response to frontend Reward type
        setRewards(data.map((rw: any) => {
            let reward: Reward = {
                id: rw.id,
                type: rw.type,
                amount: rw.amount,
                note: rw.note,
                createdAt: rw.createdAt,
            };
            if (rw.chapter) reward.chapter = rw.chapter;
            if (rw.bookRead) reward.bookRead = rw.bookRead;
            return reward;
        }));
    };

    useEffect(() => {
        fetchSummary();
        fetchRewards();
    }, []);

    const handlePayout = async () => {
    if (!payout || isNaN(Number(payout))) return;
    setLoading(true);
    await fetch(`${API_URL}/rewards/payout?amount=${encodeURIComponent(payout)}`, { method: 'POST' });
    setPayout('');
    await fetchSummary();
    await fetchRewards();
    if (window.updateCredits) window.updateCredits();
    setLoading(false);
    };
    const handleSpend = async () => {
    if (!spend || isNaN(Number(spend)) || !spendNote) return;
    setLoading(true);
    await fetch(`${API_URL}/rewards/spend?amount=${encodeURIComponent(spend)}&note=${encodeURIComponent(spendNote)}`, { method: 'POST' });
    setSpend('');
    setSpendNote('');
    await fetchSummary();
    await fetchRewards();
    if (window.updateCredits) window.updateCredits();
    setLoading(false);
    };

    return (
        <Box maxWidth={600} mx="auto" mt={4}>
            <Paper elevation={4} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} mb={2}>Rewards Dashboard</Typography>
                <Stack direction="row" spacing={3} mb={2}>
                    <Box>
                        <Typography variant="subtitle2">All-Time Earned</Typography>
                        <Typography variant="h6" color="success.main">${summary.totalEarned.toFixed(2)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2">Total Paid Out</Typography>
                        <Typography variant="h6" color="primary.main">${summary.totalPaidOut.toFixed(2)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2">Total Spent</Typography>
                        <Typography variant="h6" color="warning.main">${summary.totalSpent.toFixed(2)}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2">Current Balance</Typography>
                        <Typography variant="h6" color="secondary.main">${summary.currentBalance.toFixed(2)}</Typography>
                    </Box>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={2} mb={2}>
                    <TextField
                        label="Payout Amount"
                        value={payout}
                        onChange={e => setPayout(e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                    <Button variant="contained" color="primary" onClick={handlePayout} disabled={loading || !payout}>Mark Paid Out</Button>
                </Stack>
                <Stack direction="row" spacing={2} mb={2}>
                    <TextField
                        label="Spend Amount"
                        value={spend}
                        onChange={e => setSpend(e.target.value)}
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                        label="What did you buy?"
                        value={spendNote}
                        onChange={e => setSpendNote(e.target.value)}
                        size="small"
                    />
                    <Button variant="contained" color="warning" onClick={handleSpend} disabled={loading || !spend || !spendNote}>Spend</Button>
                </Stack>
            </Paper>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" mb={2}>Reward History</Typography>
                <List>
                    {[...rewards]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(r => (
                            <ListItem key={r.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>{r.type}</Typography>
                                    {r.type === 'EARN' && r.bookRead && r.bookRead.book && r.chapter ? (
                                        <Typography variant="caption" color="text.secondary">
                                            {r.bookRead.book.title} — {r.chapter.name}
                                        </Typography>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">{r.note}</Typography>
                                    )}
                                </Box>
                                <Typography variant="body1" fontWeight={700} color={
                                    r.type === 'EARN' ? 'success.main' : r.type === 'PAYOUT' ? 'primary.main' : 'warning.main'
                                }>
                                    {r.type === 'PAYOUT' ? '-' : r.type === 'SPEND' ? '-' : '+'}${r.amount.toFixed(2)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleString()}</Typography>
                            </ListItem>
                        ))}
                </List>
            </Paper>
        </Box>
    );
}