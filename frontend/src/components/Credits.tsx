import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

export default function Credits() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [totalEarned, setTotalEarned] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRewardsSummary = () => {
      fetch(`${API_URL}/rewards/summary`)
        .then(r => r.json())
        .then(j => {
          console.log("[Rewards Summary API] Response:", j);
          setTotalEarned(j.totalEarned || 0);
        })
        .catch((e) => { console.log("[Rewards Summary API] Error:", e); });
    };
    fetchRewardsSummary();
    window.updateCredits = fetchRewardsSummary;
    return () => { delete window.updateCredits; };
  }, []);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        px: 3, 
        py: 2, 
        borderRadius: 3, 
        background: 'linear-gradient(135deg, #FFB81C 0%, #e6a419 100%)',
        border: '3px solid #000000',
        display: 'inline-block', 
        minWidth: 180,
        boxShadow: '0 8px 25px rgba(255, 184, 28, 0.5)',
        animation: 'pulse 2s ease-in-out infinite',
        cursor: 'pointer',
        '@keyframes pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.05)',
          },
        },
      }}
      onClick={() => navigate('/rewards')}
      tabIndex={0}
      role="button"
      aria-label="View rewards"
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: '#000000', 
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 0.5,
            fontSize: '0.75rem',
          }}
        >
          <span>🏒</span>
          Reading Earnings
          <span>🏒</span>
        </Typography>
        <Typography 
          variant="h4" 
          id="earnings" 
          sx={{ 
            color: '#000000', 
            fontWeight: 900,
            textShadow: '2px 2px 4px rgba(255,255,255,0.3)',
            fontFamily: 'Arial Black, sans-serif',
            my: 0.5,
          }}
        >
          ${totalEarned.toFixed(2)}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#1a1a1a', 
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        >
          Keep Reading! 📚
        </Typography>
      </Box>
    </Paper>
  );
}