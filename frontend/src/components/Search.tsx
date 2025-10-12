// Add TS declaration for window.codeReader
declare global {
  interface Window {
    codeReader?: any;
  }
}

import { useState, useEffect } from 'react';
// Helper to always include JWT in Authorization header
function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem('jwt');
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import InfoBanner from './InfoBanner';
import type { BookSummaryDto } from '../types/dto';

export default function Search() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [results, setResults] = useState<BookSummaryDto[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [details, setDetails] = useState<{ [key: number]: BookSummaryDto | undefined }>({});
  // Track books in progress for the current user only
  const [userBooks, setUserBooks] = useState<{ [googleBookId: string]: any }>({});
  // Track all books in the database (across all users)
  const [allBooks, setAllBooks] = useState<{ [googleBookId: string]: any }>({});

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all books in progress for the current user and all books in the DB on mount
  useEffect(() => {
    const fetchUserBooks = async () => {
      const r = await authFetch(`${API_URL}/books`, { credentials: 'include' });
      if (r.ok) {
        const books = await r.json();
        const map: { [googleBookId: string]: any } = {};
        books.forEach((b: any) => { map[b.googleBookId] = b; });
        setUserBooks(map);
      }
    };
    // Fetch all books in the DB (across all users)
    const fetchAllBooks = async () => {
      const r = await authFetch(`${API_URL}/all-books`); // <-- You need to implement this endpoint in the backend
      if (r.ok) {
        const books = await r.json();
        const map: { [googleBookId: string]: any } = {};
        books.forEach((b: any) => { map[b.googleBookId] = b; });
        setAllBooks(map);
      }
    };
    fetchUserBooks();
    fetchAllBooks();
  }, []);

  const search = async () => {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (author) params.append('author', author);
    const r = await authFetch(`${API_URL}/search?` + params.toString());
    const docs: BookSummaryDto[] = await r.json();
    // Move any book the user has in their list to the top
    const sorted = docs.sort((a, b) => {
      const aExists = !!userBooks[a.googleBookId];
      const bExists = !!userBooks[b.googleBookId];
      if (aExists && !bExists) return -1;
      if (!aExists && bExists) return 1;
      return 0;
    });
    setResults(sorted);
    setExpanded({});
    setDetails({});
  };

  const addBook = async (book: BookSummaryDto) => {
    // If the user already has this book, just add BookRead for this user (no chapter prompt)
    if (userBooks[book.googleBookId]) {
      // Save book (will only add BookRead for user)
      const bookRes = await authFetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleBookId: book.googleBookId,
          title: book.title,
          authors: Array.isArray(book.authors) ? book.authors : [book.authors],
          description: book.description,
          thumbnailUrl: book.thumbnailUrl
        })
      });
      if (!bookRes.ok) {
        alert('Failed to add book.');
        return;
      }
      // Redirect to reading list and scroll to the new book
      navigate('/list', { state: { newGoogleBookId: book.googleBookId } });
      return;
    }
    // If the book exists in the DB (for any user), just add BookRead for this user (no chapter prompt)
    if (allBooks[book.googleBookId]) {
      const bookRes = await authFetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleBookId: book.googleBookId,
          title: book.title,
          authors: Array.isArray(book.authors) ? book.authors : [book.authors],
          description: book.description,
          thumbnailUrl: book.thumbnailUrl
        })
      });
      if (!bookRes.ok) {
        alert('Failed to add book.');
        return;
      }
      navigate('/list', { state: { newGoogleBookId: book.googleBookId } });
      return;
    }
    // Book does not exist in the DB at all, prompt for chapters
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
    const bookRes = await authFetch(`${API_URL}/books`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ googleBookId: book.googleBookId, title: book.title, authors: Array.isArray(book.authors) ? book.authors : [book.authors], description: book.description, thumbnailUrl: book.thumbnailUrl })
    });
    if (!bookRes.ok) {
      alert('Failed to add book.');
      return;
    }
    // Save chapters
    const chaptersRes = await authFetch(`${API_URL}/books/${book.googleBookId}/chapters`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chapters)
    });
    if (!chaptersRes.ok) {
      alert('Failed to add chapters.');
      return;
    }
    // Redirect to reading list and scroll to the new book
    navigate('/list', { state: { newGoogleBookId: book.googleBookId } });
  };

  const toggleExpand = async (index: number, book: BookSummaryDto) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
    if (!details[index] && !expanded[index]) {
      setDetails(prev => ({ ...prev, [index]: book }));
    }
  };

  const handleScan = async () => {
    setError("");
    setLoading(true);

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.EAN_8,
        BarcodeFormat.EAN_13,
      ]);

      const codeReader = new BrowserMultiFormatReader(hints);
      // Store codeReader globally so Stop Scanner can access and reset it
      window.codeReader = codeReader;

      const constraints = { video: { facingMode: "environment" } as MediaTrackConstraints };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.getElementById("video") as HTMLVideoElement;
      videoElement.srcObject = stream;
      await videoElement.play();
      setScanning(true);

      codeReader.decodeFromVideoDevice(null, "video", async (result) => {
        if (result) {
          const isbnOrUpc = result.getText();
          console.log("✅ Scanned:", isbnOrUpc);

          codeReader.reset();
          (stream.getTracks() || []).forEach((t) => t.stop());
          videoElement.srcObject = null;
          setScanning(false);

          try {
            const API_URL = import.meta.env.VITE_API_URL;
            const response = await authFetch(
              `${API_URL}/search?isbn=${isbnOrUpc}`
            );
            if (!response.ok) throw new Error(`Book not found for code ${isbnOrUpc}`);
            const books: BookSummaryDto[] = await response.json();
            const book = books[0];
            if (book) {
              setResults([book]);
              setExpanded({ 0: true });
              setDetails({ 0: book });
            } else {
              setError("Book not found for code " + isbnOrUpc);
            }
          } catch (lookupErr: any) {
            setError(lookupErr.message || "Lookup failed.");
          }
        }
      });
    } catch (err: any) {
      setError(err.message || "Scanner error");
      setLoading(false);
      setScanning(false);
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
        <Box p={2}>
          {/* UPC Scanner */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {!scanning && (
              <Button variant="contained" onClick={handleScan} disabled={loading}>
                Start Scanner
              </Button>
            )}
            {scanning && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  const videoElement = document.getElementById("video") as HTMLVideoElement;
                  if (videoElement && videoElement.srcObject) {
                    (videoElement.srcObject as MediaStream)
                      .getTracks()
                      .forEach((track) => track.stop());
                    videoElement.srcObject = null;
                  }
                    // Also reset the codeReader if it exists
                    if (window.codeReader && typeof window.codeReader.reset === 'function') {
                      window.codeReader.reset();
                    }
                  setScanning(false);
                }}
              >
                Stop Scanner
              </Button>
            )}
          </Stack>
          <video
            id="video"
            width="300"
            height="200"
            style={{ border: "1px solid black" }}
          />
        </Box>
      )}
      {tab === 1 && (
        <>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <TextField
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              onKeyDown={e => { if (e.key === 'Enter' && (title || author)) search(); }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="Author"
              onKeyDown={e => { if (e.key === 'Enter' && (title || author)) search(); }}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" onClick={search} disabled={!title && !author}>Search</Button>
          </Stack>
        </>
      )}
      <List>
        {results.map((r, i) => {
          const googleBookId = r.googleBookId;
          const userBook = userBooks[googleBookId];
          return (
            <ListItem key={i} sx={{ display: 'block', mb: 1, border: '1px solid #dee2e6', borderRadius: 1, background: '#fff' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{r.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.authors && r.authors.join(', ')}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="info" onClick={() => toggleExpand(i, r)}>
                    {expanded[i] ? 'Hide Details' : 'Show Details'}
                  </Button>
                  {!userBook && (
                    <Button size="small" variant="contained" color="success" onClick={() => addBook(r)}>Add</Button>
                  )}
                  {userBook && userBook.inProgress && (
                    <Button size="small" variant="contained" color="primary" onClick={() => window.location.href = '/readinglist'}>
                      See in Reading list
                    </Button>
                  )}
                  {userBook && !userBook.inProgress && (
                    <Button size="small" variant="contained" color="warning" onClick={async () => {
                      // Call backend reread endpoint and redirect to reading list, scroll to this book
                      const res = await authFetch(`${API_URL}/books/${userBook.googleBookId}/reread`, { method: 'POST' });
                      if (res.ok) {
                        navigate('/list', { state: { newGoogleBookId: userBook.googleBookId } });
                      } else {
                        alert('Failed to start reread.');
                      }
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
                    {details[i].thumbnailUrl && (
                      <img
                        src={details[i].thumbnailUrl}
                        alt="Book cover"
                        style={{ maxWidth: '128px', maxHeight: '200px', borderRadius: '4px', marginRight: '8px' }}
                      />
                    )}
                    {/* Description */}
                    <Box flex={1}>
                      {details[i].description && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" fontWeight="bold">Description:</Typography>
                          <Box textAlign="left">
                            {details[i].description && (
                              <span dangerouslySetInnerHTML={{ __html: details[i].description }} />
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
