
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function Search(){

  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<{[key: number]: boolean}>({});
  const [details, setDetails] = useState<{[key: number]: any}>({});
  const [existingBooks, setExistingBooks] = useState<{[olid: string]: any}>({});

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all books in DB on mount
  useEffect(() => {
    const fetchExistingBooks = async () => {
      const r = await fetch(`${API_URL}/books`);
      if (r.ok) {
        const books = await r.json();
        const map: {[olid: string]: any} = {};
        books.forEach((b: any) => { map[b.olid] = b; });
        setExistingBooks(map);
      }
    };
    fetchExistingBooks();
  }, []);

  const search = async () => {
    const r = await fetch(`${API_URL}/search?q=` + encodeURIComponent(q));
    const j = await r.json();
    let docs = j.docs || [];
    // Move any existing book to top
    docs = docs.sort((a: any, b: any) => {
      const aOlid = (a.key || '').split('/').pop();
      const bOlid = (b.key || '').split('/').pop();
      const aExists = !!existingBooks[aOlid];
      const bExists = !!existingBooks[bOlid];
      if (aExists && !bExists) return -1;
      if (!aExists && bExists) return 1;
      return 0;
    });
    setResults(docs);
    setExpanded({});
    setDetails({});
  };

  const addBook = async (doc: any) => {
    const olid = (doc.key || '').split('/').pop();
    const book = { olid, title: doc.title, authors: (doc.author_name || []).join(', ') };
    const chapterCountStr = window.prompt('How many chapters are in this book?');
    const chapterCount = chapterCountStr ? parseInt(chapterCountStr, 10) : 0;
    if (!chapterCount || isNaN(chapterCount) || chapterCount < 1) {
      alert('Please enter a valid number of chapters.');
      return;
    }
    // Create chapters
    const chapters = Array.from({ length: chapterCount }, (_, idx) => ({
      chapterIndex: idx + 1,
      name: `Chapter ${idx + 1}`,
      bookOlid: olid
    }));
    console.log("Chapters to send:", chapters);
    // Save book first
    const bookRes = await fetch(`${API_URL}/books`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(book)
    });
    if (!bookRes.ok) {
      alert('Failed to add book.');
      return;
    }
    // Save chapters
    const chaptersRes = await fetch(`${API_URL}/books/${olid}/chapters`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chapters)
    });
    const chaptersResText = await chaptersRes.text();
    console.log("Chapters response:", chaptersRes.status, chaptersResText);
    if (!chaptersRes.ok) {
      alert('Failed to add chapters.');
      return;
    }
    alert('Added book and chapters to reading list. Now click Reading List tab to add chapters or mark reads.');
  };

  const toggleExpand = async (index: number, doc: any) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
    if (!details[index] && !expanded[index]) {
      const olid = (doc.key || '').split('/').pop();
      const r = await fetch(`${API_URL}/work/${olid}`);
      const j = await r.json();
      setDetails(prev => ({ ...prev, [index]: j }));
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search books (Open Library)"
          onKeyDown={e => { if (e.key === 'Enter') search(); }}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button variant="outlined" onClick={search}>Search</Button>
      </Stack>
      <List>
        {results.map((r, i) => {
          const olid = (r.key || '').split('/').pop();
          const existing = existingBooks[olid];
          return (
            <ListItem key={i} sx={{ display: 'block', mb: 1, border: '1px solid #dee2e6', borderRadius: 1, background: '#fff' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{r.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{(r.author_name || []).join(', ')}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="info" onClick={() => toggleExpand(i, r)}>
                    {expanded[i] ? 'Hide Details' : 'Show Details'}
                  </Button>
                  {!existing && (
                    <Button size="small" variant="contained" color="success" onClick={() => addBook(r)}>Add</Button>
                  )}
                  {existing && existing.inProgress && (
                    <Button size="small" variant="contained" color="primary" onClick={() => window.location.href = '/readinglist'}>
                      See in Reading list
                    </Button>
                  )}
                  {existing && !existing.inProgress && (
                    <Button size="small" variant="contained" color="warning" onClick={async () => {
                      // Toggle inProgress and redirect
                      await fetch(`${API_URL}/books`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...existing, inProgress: true })
                      });
                      window.location.href = '/readinglist';
                    }}>
                      Reread
                    </Button>
                  )}
                </Stack>
              </Box>
              {expanded[i] && details[i] && (
                <Box mt={2} p={2} borderRadius={1} bgcolor="#f8f9fa" border={1} borderColor="#dee2e6">
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {/* Cover Art */}
                    {Array.isArray(details[i].covers) && details[i].covers.length > 0 && (() => {
                      const coverId = details[i].covers.find((id: number) => id !== -1);
                      return coverId ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`}
                          alt="Book cover"
                          style={{ maxWidth: '120px', maxHeight: '180px', borderRadius: '4px', marginRight: '8px' }}
                        />
                      ) : null;
                    })()}
                    {/* Description */}
                    <Box flex={1}>
                      {details[i].description && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" fontWeight="bold">Description:</Typography>
                          <Box textAlign="left">
                            {typeof details[i].description === 'string'
                              ? <span dangerouslySetInnerHTML={{ __html: details[i].description }} />
                              : details[i].description.value
                                ? <span dangerouslySetInnerHTML={{ __html: details[i].description.value }} />
                                : null}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
