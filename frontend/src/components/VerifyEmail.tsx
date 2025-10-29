import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    fetch(`${API_URL}/auth/verify-email?token=${token}`)
      .then(async res => {
        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified! You can now log in.');
        } else {
          const text = await res.text();
          setStatus('error');
          setMessage(text || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verification failed. Please try again later.');
      });
  }, [searchParams]);

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {status === 'pending' && <CircularProgress sx={{ mb: 2 }} />}
      <Typography variant="h5" color={status === 'success' ? 'primary' : status === 'error' ? 'error' : 'textPrimary'}>
        {message}
      </Typography>
      {status === 'success' && (
        <Link component={RouterLink} to="/login" sx={{ mt: 3, fontSize: 18 }}>
          Go to Login
        </Link>
      )}
    </Box>
  );
}
