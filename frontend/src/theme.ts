// theme.ts - Create this file to define your Bruins theme
import { createTheme } from '@mui/material/styles';

export const bruinsTheme = createTheme({
  palette: {
    primary: {
      main: '#FFB81C', // Bruins gold
      contrastText: '#000000',
    },
    secondary: {
      main: '#000000', // Black
      contrastText: '#FFB81C',
    },
    background: {
      default: '#1a1a1a',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          border: '2px solid #FFB81C',
          boxShadow: '0 4px 15px rgba(255, 184, 28, 0.3)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#a8a8a8',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'rgba(255, 184, 28, 0.1)',
            color: '#FFB81C',
          },
          '&.Mui-selected': {
            backgroundColor: '#FFB81C',
            color: '#000000',
            borderRadius: '8px',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          display: 'none', // Hide the default indicator since we're styling the tab itself
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});