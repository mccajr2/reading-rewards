// Add TS declaration for window.codeReader
declare global {
  interface Window {
    codeReader?: any;
  }
}

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchWithAuth } from '../fetchWithAuth';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Scanner from './Scanner';
import ManualSearch from './ManualSearch';
import InfoBanner from './InfoBanner';
import type { BookSummaryDto } from '../types/dto';

export default function Search() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [] = useState(false); // Only needed for legacy, can be removed after refactor
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [results, setResults] = useState<BookSummaryDto[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [existingBooks, setExistingBooks] = useState<{ [googleBookId: string]: any }>({});

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all books in DB on mount
  useEffect(() => {
    const fetchExistingBooks = async () => {
      const r = await fetchWithAuth(`${API_URL}/books`, {}, token);
      if (r.ok) {
        const books = await r.json();
        const map: { [googleBookId: string]: any } = {};
        books.forEach((b: any) => { map[b.googleBookId] = b; });
        setExistingBooks(map);
      }
    };
    fetchExistingBooks();
  }, [token]);

  const search = async () => {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (author) params.append('author', author);
    const r = await fetchWithAuth(`${API_URL}/search?` + params.toString(), {}, token);
    const docs: BookSummaryDto[] = await r.json();
    // Move any existing book to top
    const sorted = docs.sort((a, b) => {
      const aExists = !!existingBooks[a.googleBookId];
      const bExists = !!existingBooks[b.googleBookId];
      if (aExists && !bExists) return -1;
      if (!aExists && bExists) return 1;
      return 0;
    });
    setResults(sorted);
    setExpanded({});
  };

  const addBook = async (book: BookSummaryDto) => {
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
      googleBookId: book.googleBookId
    }));
    // Save book first (authors as array)
    const bookRes = await fetchWithAuth(`${API_URL}/books`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ googleBookId: book.googleBookId, title: book.title, authors: Array.isArray(book.authors) ? book.authors : [book.authors], description: book.description, thumbnailUrl: book.thumbnailUrl })
    }, token);
    if (!bookRes.ok) {
      alert('Failed to add book.');
      return;
    }
    // Save chapters
    const chaptersRes = await fetchWithAuth(`${API_URL}/books/${book.googleBookId}/chapters`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chapters)
    }, token);
    if (!chaptersRes.ok) {
      alert('Failed to add chapters.');
      return;
    }
    // Redirect to reading list and scroll to the new book
    navigate('/list', { state: { newGoogleBookId: book.googleBookId } });
  };

  const toggleExpand = async (index: number) => {
    setExpanded(prev => {
      return { ...prev, [index]: !prev[index] };
    });
  };


  // Handler for scanner result
  const handleScannerResult = async (isbnOrUpc: string) => {
    setError("");
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/search?isbn=${isbnOrUpc}`, {}, token);
      if (!response.ok) throw new Error(`Book not found for code ${isbnOrUpc}`);
      const books: BookSummaryDto[] = await response.json();
      const book = books[0];
      if (book) {
        setResults([book]);
        setExpanded({ 0: true });
      } else {
        setError("Book not found for code " + isbnOrUpc);
      }
    } catch (lookupErr: any) {
      setError(lookupErr.message || "Lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>

      <InfoBanner
        title="Find your next adventure!"
        description="Scan a book's barcode with your camera for instant info, or search
          by title or author. What will you read next? 📸🔍"
      />

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setResults([]);
        }}
        sx={{ mb: 3 }}
      >
        <Tab label="Scan ISBN" />
        <Tab label="Manual Search" />
      </Tabs>
      {tab === 0 && (
        <Scanner
          onResult={handleScannerResult}
          loading={loading}
          setLoading={setLoading}
          setError={setError}
        />
      )}
      {tab === 1 && (
        <ManualSearch
          title={title}
          setTitle={setTitle}
          author={author}
          setAuthor={setAuthor}
          onSearch={search}
          loading={loading}
        />
      )}
      <List>
        {results.map((r, i) => {
          const googleBookId = r.googleBookId;
          const existing = existingBooks[googleBookId];
          return (
            <ListItem key={i} sx={{ display: 'block', mb: 1, border: '1px solid #dee2e6', borderRadius: 1, background: '#fff' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{r.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.authors && r.authors.join(', ')}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="info" onClick={() => toggleExpand(i)}>
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
                      // Call backend reread endpoint and redirect to reading list, scroll to this book
                      const res = await fetch(`${API_URL}/books/${existing.googleBookId}/reread`, { method: 'POST' });
                      if (res.ok) {
                        navigate('/list', { state: { newGoogleBookId: existing.googleBookId } });
                      } else {
                        alert('Failed to start reread.');
                      }
                    }}>
                      Reread
                    </Button>
                  )}
                </Stack>
              </Box>
              {expanded[i] && (
                <Box mt={2} p={2} borderRadius={1} bgcolor="#f8f9fa" border={1} borderColor="#dee2e6">
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    {/* Cover Art */}
                    {r.thumbnailUrl && (
                      <img
                        src={r.thumbnailUrl}
                        alt="Book cover"
                        style={{ maxWidth: '128px', maxHeight: '200px', borderRadius: '4px', marginRight: '8px' }}
                      />
                    )}
                    {/* Description */}
                    <Box flex={1}>
                      {r.description && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" fontWeight="bold">Description:</Typography>
                          <Box textAlign="left">
                            {r.description && (
                              <span dangerouslySetInnerHTML={{ __html: r.description }} />
                            )}
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
