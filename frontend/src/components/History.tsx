
import { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import InfoBanner from './InfoBanner';
import Avatar from '@mui/material/Avatar';


export default function History() {
  const [books, setBooks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [inProgress, setInProgress] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const completedGoogleBookId = location.state?.completedGoogleBookId;
  const bookRefs = useRef<{ [googleBookId: string]: HTMLDivElement | null }>({});
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/books`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}`);
        try {
          return await r.json();
        } catch {
          throw new Error('Invalid JSON response');
        }
      })
      .then(setBooks)
      .catch(e => setError(e.message));
    // Also fetch in-progress books for reread logic
    fetch(`${API_URL}/bookreads/in-progress`)
      .then(async r => {
        if (!r.ok) return [];
        try {
          return await r.json();
        } catch {
          return [];
        }
      })
      .then(setInProgress);
  }, []);

  // Scroll to completed book if present
  useEffect(() => {
    if (completedGoogleBookId && bookRefs.current[completedGoogleBookId]) {
      setTimeout(() => {
        bookRefs.current[completedGoogleBookId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [books, completedGoogleBookId]);

  // Only show books not in progress
  let finishedBooks = books.filter((b: any) => !b.inProgress);
  // Filter by title or author
  const filterLower = filter.trim().toLowerCase();
  if (filterLower) {
    finishedBooks = finishedBooks.filter((b: any) => {
      const title = typeof b.title === 'string' ? b.title : '';
      // authors may be string or array or undefined/null
      let authors = '';
      if (typeof b.authors === 'string') {
        authors = b.authors;
      } else if (Array.isArray(b.authors)) {
        authors = b.authors.join(', ');
      }
      return (
        title.toLowerCase().includes(filterLower) ||
        authors.toLowerCase().includes(filterLower)
      );
    });
  }
  // Group by googleBookId
  const grouped = finishedBooks.reduce((acc: any, book: any) => {
    acc[book.googleBookId] = book;
    return acc;
  }, {});

  return (
    <Box>
      <InfoBanner
        title="The trophy case!"
        description="Every book you've finished lives here. Look back at all your completed 
          reads and see how far you've come. Champion reader! 🏅"
      />
      <TextField
        label="Filter by title or author"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ mb: 2, mt: 1, width: 320 }}
      />
      {error && <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>}
      <List>
        {Object.values(grouped).map((book: any, i: number) => {
          // Check if this book is already in the reading list (inProgress)
          const existing = inProgress.find((b: any) => b.googleBookId === book.googleBookId);
          return (
            <ListItem
              key={i}
              ref={el => { bookRefs.current[book.googleBookId] = el as HTMLDivElement | null; }}
              sx={{ border: '1px solid #dee2e6', borderRadius: 1, mb: 1, background: '#fff', display: 'flex', alignItems: 'center' }}
            >
              {book.thumbnailUrl && (
                <Avatar src={book.thumbnailUrl} alt={book.title} variant="square" sx={{ width: 48, height: 72, mr: 2 }} />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {book.title}{book.readCount > 1 ? ` x ${book.readCount}` : ''}
                  <Typography component="span" variant="body2" color="text.secondary"> ({book.authors})</Typography>
                </Typography>
              </Box>
              {existing && existing.inProgress && (
                <Button size="small" variant="contained" color="primary" sx={{ ml: 2 }} onClick={() => navigate('/list')}>
                  See in Reading list
                </Button>
              )}
              {!existing && (
                <Button size="small" variant="contained" color="warning" sx={{ ml: 2 }} onClick={async () => {
                  const API_URL = import.meta.env.VITE_API_URL;
                  const res = await fetch(`${API_URL}/books/${book.googleBookId}/reread`, { method: 'POST' });
                  if (res.ok) {
                    navigate('/list', { state: { newGoogleBookId: book.googleBookId } });
                  } else {
                    alert('Failed to start reread.');
                  }
                }}>
                  Reread
                </Button>
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
