import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Search from './components/Search';
import ReadingList from './components/ReadingList';
import History from './components/History';
import Credits from './components/Credits';
import Rewards from './components/Rewards';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { bruinsTheme } from './theme';


function MainApp() {
  const KID_NAME = import.meta.env.VITE_KID_NAME;
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (KID_NAME) {
      document.title = `${KID_NAME}'s Reading Rewards`;
    } else {
      document.title = 'Reading Rewards';
    }
  }, [KID_NAME]);

  // Tab value based on route
  const tabValue =
    location.pathname === '/list' ? 'list'
      : location.pathname === '/history' ? 'history'
        : 'search';

  return (
    <ThemeProvider theme={bruinsTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      }}>
        {/* Docked Credits badge in upper right of viewport */}
        <Box sx={{ position: 'fixed', top: 20, right: 32, zIndex: 2000 }}>
          <Credits />
        </Box>

        <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3, pr: { xs: 2, sm: 28 }, px: 3 }}>
          <AppBar position="static" color="secondary" elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ padding: 1 }} />
            <Toolbar
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                minHeight: 120,
              }}
            >
              <Typography
                variant="h4"
                component="div"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontWeight: 900,
                  color: '#FFB81C',
                  textShadow: '0 1px 3px rgba(255, 184, 28, 0.15), 0 1px 0 #000',
                  letterSpacing: 2,
                  fontFamily: `'Luckiest Guy', 'Fredoka One', 'Baloo 2', 'Arial Rounded MT Bold', Arial, sans-serif`,
                  fontSize: { xs: '2rem', sm: '2.8rem', md: '3.2rem' },
                  lineHeight: 1.1,
                  py: 1,
                }}
              >
                <span role="img" aria-label="hockey">🏒</span>
                {KID_NAME}'s Reading Rewards
                <span role="img" aria-label="hockey">🏒</span>
              </Typography>
              <link
                href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Fredoka+One&family=Baloo+2:wght@700&display=swap"
                rel="stylesheet"
              />
              <Tabs
                value={tabValue}
                onChange={(_e, v) => {
                  navigate(v === 'list' ? '/list' : v === 'history' ? '/history' : '/search');
                }}
                sx={{ minHeight: 48 }}
              >
                <Tab label="Current Books" value="list" />
                <Tab label="Reading History" value="history" />
                <Tab label="Find Books" value="search" />
              </Tabs>
            </Toolbar>
            <Box sx={{ padding: 1 }} />
          </AppBar>

          <Box
            sx={{
              bgcolor: '#fff',
              borderRadius: 3,
              boxShadow: 3,
              p: { xs: 2, sm: 4 },
              minHeight: 400,
              mb: 4,
            }}
          >
            <Routes>
              <Route path="/search" element={<Search />} />
              <Route path="/list" element={<ReadingList />} />
              <Route path="/history" element={<History />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="*" element={<Search />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}