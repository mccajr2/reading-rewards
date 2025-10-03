
import { useState, useEffect } from 'react';
import type { OpenLibraryBookDto, OpenLibraryBookDetailsDto } from '../types/dto';
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

export default function Search() {
  const [tab, setTab] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState('');
  const [results, setResults] = useState<OpenLibraryBookDto[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [details, setDetails] = useState<{ [key: number]: OpenLibraryBookDetailsDto | undefined }>({});
  const [existingBooks, setExistingBooks] = useState<{ [olid: string]: any }>({});

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all books in DB on mount
  useEffect(() => {
    const fetchExistingBooks = async () => {
      const r = await fetch(`${API_URL}/books`);
      if (r.ok) {
        const books = await r.json();
        const map: { [olid: string]: any } = {};
        books.forEach((b: any) => { map[b.olid] = b; });
        setExistingBooks(map);
      }
    };
    fetchExistingBooks();
  }, []);

  const search = async () => {
    const r = await fetch(`${API_URL}/search?q=` + encodeURIComponent(q));
    const docs: OpenLibraryBookDto[] = await r.json();
    // Move any existing book to top
    const sorted = docs.sort((a, b) => {
      const aExists = !!existingBooks[a.olid];
      const bExists = !!existingBooks[b.olid];
      if (aExists && !bExists) return -1;
      if (!aExists && bExists) return 1;
      return 0;
    });
    setResults(sorted);
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

  const toggleExpand = async (index: number, book: OpenLibraryBookDto) => {
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
    if (!details[index] && !expanded[index]) {
      const olid = book.olid;
      const r = await fetch(`${API_URL}/work/${olid}`);
      const j: OpenLibraryBookDetailsDto = await r.json();
      setDetails(prev => ({ ...prev, [index]: j }));
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
            const response = await fetch(
              `${API_URL}/lookup?isbn=${isbnOrUpc}`
            );
            if (!response.ok) throw new Error(`Book not found for code ${isbnOrUpc}`);
            const book = await response.json();
            setResults([book]);
            setExpanded({});
            setDetails({});
            // setSelectedBook(book);
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
              const olid = r.olid;
              const existing = existingBooks[olid];
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
                        {Array.isArray(details[i].coverIds) && details[i].coverIds.length > 0 && (() => {
                          const coverId = details[i].coverIds.find((id: number) => id !== -1);
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
        </>
      )}
    </Box>
  );
}
