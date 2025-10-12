import { Navigate } from 'react-router-dom';
// Wrapper for protected routes
function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)!) : null;
  if (!token) return <Navigate to="/" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
import CreateChildForm from './components/CreateChildForm';
import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
// Utility to store and get JWT
const TOKEN_KEY = 'reading_rewards_jwt';
const USER_KEY = 'reading_rewards_user';
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
  const API_URL = import.meta.env.VITE_API_URL;
  // --- Auth state ---
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<any>(() => {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  });
  const [showSignup, setShowSignup] = useState(false);

  // Attach JWT to all fetch requests
  useEffect(() => {
    if (!token) return;
    const origFetch = window.fetch;
    window.fetch = (input, init = {}) => {
      if (typeof input === 'string' && input.startsWith(import.meta.env.VITE_API_URL)) {
        init.headers = {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
      return origFetch(input, init);
    };
    return () => { window.fetch = origFetch; };
  }, [token]);

  const handleLogin = (data: any) => {
    setToken(data.token);
    setUser(data);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  };
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };
  const handleSignup = (data: any) => {
    setShowSignup(false);
    // Optionally auto-login after signup
  };
  const KID_NAME = import.meta.env.VITE_KID_NAME;
  const location = useLocation();
  const navigate = useNavigate();
  // Redirect child users away from /parent
  useEffect(() => {
    if (user?.role === 'CHILD' && location.pathname === '/parent') {
      // Check if child has books in progress
      fetch(`${API_URL}/bookreads/in-progress`)
        .then(r => r.ok ? r.json() : [])
        .then((bookReads) => {
          if (Array.isArray(bookReads) && bookReads.length > 0) {
            navigate('/list', { replace: true });
          } else {
            navigate('/search', { replace: true });
          }
        })
        .catch(() => navigate('/search', { replace: true }));
    }
  }, [user, location.pathname, API_URL, navigate]);
  useEffect(() => {
    if (KID_NAME) {
      document.title = `${KID_NAME}'s Reading Rewards`;
    } else {
      document.title = 'Reading Rewards';
    }
  }, [KID_NAME]);

  // --- Auth UI ---
  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box>
          {showSignup ? (
            <SignupForm onSignup={handleSignup} />
          ) : (
            <LoginForm onLogin={handleLogin} />
          )}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            {showSignup ? (
              <>
                <span>Already have an account? </span>
                <a href="#" onClick={e => { e.preventDefault(); setShowSignup(false); }}>Login</a>
              </>
            ) : (
              <>
                <span>New parent? </span>
                <a href="#" onClick={e => { e.preventDefault(); setShowSignup(true); }}>Sign up</a>
              </>
            )}
          </Box>
        </Box>
      </Box>
    );
  }

  // Tab value based on route
  const tabValue =
    location.pathname === '/list' ? 'list'
      : location.pathname === '/history' ? 'history'
      : location.pathname === '/parent' ? 'parent'
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
                  if (v === 'list') navigate('/list');
                  else if (v === 'history') navigate('/history');
                  else if (v === 'parent') navigate('/parent');
                  else navigate('/search');
                }}
                sx={{ minHeight: 48 }}
              >
                <Tab label="Current Books" value="list" />
                <Tab label="Reading History" value="history" />
                <Tab label="Find Books" value="search" />
                {user?.role === 'PARENT' && <Tab label="Parent Dashboard" value="parent" />}
              </Tabs>
              <Box sx={{ position: 'absolute', right: 24, top: 24 }}>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Logout</button>
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
              <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
              <Route path="/list" element={<RequireAuth><ReadingList /></RequireAuth>} />
              <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
              <Route path="/rewards" element={<RequireAuth><Rewards /></RequireAuth>} />
              {user?.role === 'PARENT' && (
                <Route path="/parent" element={<RequireAuth role="PARENT"><CreateChildForm /></RequireAuth>} />
              )}
              <Route path="*" element={<RequireAuth><Search /></RequireAuth>} />
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