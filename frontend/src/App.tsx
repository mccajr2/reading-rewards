import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import Login from './components/Login';
import Signup from './components/Signup';
import ParentDashboard from './components/ParentDashboard';
import ParentSummary from './components/ParentSummary';
import { useAuth } from './components/AuthContext';
import VerifyEmail from './components/VerifyEmail';
import NotFound from './components/NotFound';


function MainApp() {
  const { token, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const KID_NAME = user?.firstName || '';
  useEffect(() => {
    if (KID_NAME && KID_NAME.trim().length > 0) {
      document.title = `${KID_NAME}'s Reading Rewards`;
    } else {
      document.title = 'Reading Rewards';
    }
  }, [KID_NAME]);

  // Auto-redirect to correct tab on initial load
  useEffect(() => {
    if (location.pathname === '/' && user) {
      if (user.role === 'PARENT') {
        navigate('/kids', { replace: true });
      } else if (user.role === 'CHILD') {
        navigate('/search', { replace: true });
      }
    }
  }, [location.pathname, user, navigate]);

  let tabValue: string;
  switch (location.pathname) {
    case '/list':
      tabValue = 'list';
      break;
    case '/history':
      tabValue = 'history';
      break;
    case '/rewards':
      tabValue = 'rewards';
      break;
    case '/kids':
      tabValue = 'kids';
      break;
    case '/summary':
      tabValue = 'summary';
      break;
    default:
      tabValue = 'search';
  }

  // Logout handler for AppBar
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
    } catch (e) {
      // Ignore errors, just ensure local logout
    } finally {
      logout();
      navigate('/');
    }
  }

  return (
    <ThemeProvider theme={bruinsTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      }}>
        {/* Docked Credits badge in upper right of viewport */}
        {user?.role === 'CHILD' && (
          <Box sx={{ position: 'fixed', top: 20, right: 32, zIndex: 2000 }}>
            <Credits />
          </Box>
        )}

        <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3, pr: { xs: 2, sm: 28 }, px: 3 }}>
          <AppBar position="static" color="secondary" elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ padding: 1 }} />
            <Toolbar
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                minHeight: 120,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                    switch (v) {
                      case 'list':
                        navigate('/list');
                        break;
                      case 'history':
                        navigate('/history');
                        break;
                      case 'rewards':
                        navigate('/rewards');
                        break;
                      case 'kids':
                        navigate('/kids');
                        break;
                      case 'summary':
                        navigate('/summary');
                        break;
                      default:
                        navigate('/search');
                    }
                  }}
                  sx={{ minHeight: 48 }}
                >
                  {user?.role === 'CHILD' && (
                    <Tab label="Current Books" value="list" />
                  )}
                  {user?.role === 'CHILD' && (
                    <Tab label="Reading History" value="history" />
                  )}
                  {user?.role === 'CHILD' && (
                    <Tab label="Find Books" value="search" />
                  )}
                  {user?.role === 'CHILD' && (
                    <Tab label="My Rewards" value="rewards" />
                  )}
                  {user?.role === 'PARENT' && (
                    <Tab label="Kids Accounts" value="kids" />
                  )}
                  {user?.role === 'PARENT' && (
                    <Tab label="Kids Summary" value="summary" />
                  )}
                </Tabs>
              </Box>
              {/* Logout button on right of AppBar */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: { xs: 2, sm: 0 } }}>
                <button
                  id="logout-btn"
                  style={{
                    background: '#000',
                    color: '#FFB81C',
                    border: '2px solid #FFB81C',
                    borderRadius: 8,
                    padding: '6px 18px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    marginLeft: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </Box>
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
              {user?.role === 'CHILD' && (
                <>
                  <Route path="/search" element={<Search />} />
                  <Route path="/list" element={<ReadingList />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/rewards" element={<Rewards />} />
                </>
              )}
              {user?.role === 'PARENT' && (
                <>
                  <Route path="/kids" element={<ParentDashboard />} />
                  <Route path="/summary" element={<ParentSummary />} />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  const { token, login, user } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={
            redirectPath ? (
              <Navigate to={redirectPath} />
            ) : (
              <Login onLogin={(token: string, user: any) => {
                login(token, user);
                setRedirectPath('/'); // Always redirect to root
              }} />
            )
          } />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="*" element={<Login onLogin={login} />} />
        </Routes>
      </Router>
    );
  }
  // Authenticated: always show MainApp, ParentDashboard is a tab only for parents
  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}