import { useState, useEffect, useRef } from 'react';
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
  const location = useLocation();
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
  const finishedBooks = books.filter((b: any) => !b.inProgress);
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
      {error && <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>}
      <List>
        {Object.values(grouped).map((book: any, i: number) => (
          <ListItem
            key={i}
            ref={el => { bookRefs.current[book.googleBookId] = el as HTMLDivElement | null; }}
            sx={{ border: '1px solid #dee2e6', borderRadius: 1, mb: 1, background: '#fff', display: 'flex', alignItems: 'center' }}
          >
            {book.thumbnailUrl && (
              <Avatar src={book.thumbnailUrl} alt={book.title} variant="square" sx={{ width: 48, height: 72, mr: 2 }} />
            )}
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {book.title}{book.readCount > 1 ? ` x${book.readCount}` : ''}
                <Typography component="span" variant="body2" color="text.secondary"> ({book.authors})</Typography>
              </Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
