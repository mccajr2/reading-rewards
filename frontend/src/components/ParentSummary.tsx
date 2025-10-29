import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchWithAuth } from '../fetchWithAuth';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export default function ParentSummary() {
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth(`${API_URL}/parent/kids/summary`, {}, token)
      .then(r => r.json())
      .then(data => {
        setKids(data.kids || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, API_URL]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Children's Reading & Rewards Summary
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Books Read</TableCell>
                <TableCell align="right">Chapters Read</TableCell>
                <TableCell align="right">Total Earned</TableCell>
                <TableCell align="right">Current Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading...</TableCell>
                </TableRow>
              ) : kids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No children found.</TableCell>
                </TableRow>
              ) : (
                kids.map((kid: any) => (
                  <TableRow key={kid.id}>
                    <TableCell>{kid.name}</TableCell>
                    <TableCell align="right">{kid.booksRead}</TableCell>
                    <TableCell align="right">{kid.chaptersRead}</TableCell>
                    <TableCell align="right">${kid.totalEarned?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell align="right">${kid.currentBalance?.toFixed(2) ?? '0.00'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
