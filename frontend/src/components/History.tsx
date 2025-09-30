import React, { useState, useEffect } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';

export default function History() {
  const [books, setBooks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  // Only show books not in progress
  const finishedBooks = books.filter((b: any) => !b.inProgress);
  // Group by olid
  const grouped = finishedBooks.reduce((acc: any, book: any) => {
    acc[book.olid] = book;
    return acc;
  }, {});

  return (
    <div>
      <Typography variant="h6" gutterBottom>History</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>Error: {error}</Typography>}
      <List>
        {Object.values(grouped).map((book: any, i: number) => (
          <ListItem key={i} sx={{ border: '1px solid #dee2e6', borderRadius: 1, mb: 1, background: '#fff' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {book.title}{book.readCount > 1 ? ` x${book.readCount}` : ''}
              <Typography component="span" variant="body2" color="text.secondary"> ({book.authors})</Typography>
            </Typography>
          </ListItem>
        ))}
      </List>
    </div>
  );
}
