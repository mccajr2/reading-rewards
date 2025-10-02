
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import InfoBanner from './InfoBanner';

declare global {
  interface Window {
    updateCredits?: () => void;
  }
}

export default function ReadingList() {
  // Refs for each book's chapter list div
  const chapterListRefs = React.useRef<{ [olid: string]: HTMLDivElement | null }>({});

  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<{ [olid: string]: any[] }>({});
  const [readChapters, setReadChapters] = useState<{ [olid: string]: Set<number> }>({});
  const [readDates, setReadDates] = useState<{ [olid: string]: { [chapterIndex: number]: string } }>({});

  useEffect(() => {
    books.forEach(book => {
      const chaptersArr = chapters[book.olid] || [];
      let targetChapter: any = chaptersArr.find((c: any) => !readChapters[book.olid]?.has(c.chapterIndex));
      // If all chapters are read, scroll to last chapter
      if (!targetChapter && chaptersArr.length > 0) {
        targetChapter = chaptersArr[chaptersArr.length - 1];
      }
      if (chapterListRefs.current[book.olid] && targetChapter) {
        const bookDiv = chapterListRefs.current[book.olid];
        const ul = bookDiv?.querySelector('ul');
        const li = ul?.querySelector(`[data-chapter='${targetChapter.chapterIndex}']`);
        if (li && bookDiv) {
          // Calculate offset of li relative to bookDiv and set scrollTop
          const liRect = (li as HTMLElement).getBoundingClientRect();
          const divRect = bookDiv.getBoundingClientRect();
          const offset = liRect.top - divRect.top + bookDiv.scrollTop;
          // Center the target chapter in the book div
          bookDiv.scrollTop = offset - bookDiv.clientHeight / 2 + (li as HTMLElement).offsetHeight / 2;
        }
      }
    });
  }, [books, chapters, readChapters]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchList = async () => {
      // Fetch all books
      const r = await fetch(`${API_URL}/books`);
      if (!r.ok) return;
      const allBooks = await r.json();
      const inProgressBooks = allBooks.filter((b: any) => b.inProgress);
      setBooks(inProgressBooks);

      // Fetch chapters for each book
      const chaptersObj: { [olid: string]: any[] } = {};
      for (const book of inProgressBooks) {
        const rc = await fetch(`${API_URL}/books/${book.olid}/chapters`);
        chaptersObj[book.olid] = rc.ok ? await rc.json() : [];
      }
      setChapters(chaptersObj);

      // Fetch read chapters and dates for each book
      const readObj: { [olid: string]: Set<number> } = {};
      const dateObj: { [olid: string]: { [chapterIndex: number]: string } } = {};
      const historyRes = await fetch(`${API_URL}/history`);
      if (historyRes.ok) {
        const history = await historyRes.json();
        inProgressBooks.forEach((book: any) => {
          const bookHistory = history.filter((h: any) => h.bookOlid === book.olid);
          readObj[book.olid] = new Set(bookHistory.map((h: any) => h.chapterIndex));
          dateObj[book.olid] = {};
          bookHistory.forEach((h: any) => {
            if (h.readAt) {
              const date = new Date(h.readAt);
              const formatted = date.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              });
              dateObj[book.olid][h.chapterIndex] = formatted;
            }
          });
        });
      }
      setReadChapters(readObj);
      setReadDates(dateObj);
    };
    fetchList();
  }, []);

  const handleCheck = async (olid: string, chapterIndex: number, isRead: boolean, isMostRecent: boolean) => {
    if (!isRead) {
      // Mark as read
      const res = await fetch(`${API_URL}/books/${olid}/chapters/${chapterIndex}/read`, { method: 'POST' });
      let readAt = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (res.ok) {
        try {
          const data = await res.json();
          if (data.readAt) {
            readAt = new Date(data.readAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            });
          }
        } catch { }
      }
      setReadChapters(prev => {
        const updated = { ...prev };
        if (!updated[olid]) updated[olid] = new Set();
        updated[olid].add(chapterIndex);
        return updated;
      });
      setReadDates(prev => {
        const updated = { ...prev };
        if (!updated[olid]) updated[olid] = {};
        updated[olid][chapterIndex] = readAt;
        return updated;
      });
      if (window.updateCredits) window.updateCredits();

      // Check if this was the final chapter
      const allChapters = chapters[olid] || [];
      const allRead = allChapters.every((c: any) => (c.chapterIndex === chapterIndex ? true : readChapters[olid]?.has(c.chapterIndex)));
      if (allChapters.length > 0 && allRead) {
        if (window.confirm('Congratulations! You finished the book. Mark as finished and allow rereading?')) {
          await fetch(`${API_URL}/books/${olid}/finish`, { method: 'POST' });
          // Refresh the list
          window.location.reload();
        }
      }
    } else if (isMostRecent) {
      // Confirm and delete most recent read
      if (window.confirm('Are you sure you want to undo the most recent read for this chapter?')) {
        const res = await fetch(`${API_URL}/books/${olid}/chapters/${chapterIndex}/read`, { method: 'DELETE' });
        if (res.ok) {
          setReadChapters(prev => {
            const updated = { ...prev };
            if (updated[olid]) updated[olid].delete(chapterIndex);
            return updated;
          });
          setReadDates(prev => {
            const updated = { ...prev };
            if (updated[olid]) delete updated[olid][chapterIndex];
            return updated;
          });
          if (window.updateCredits) window.updateCredits();
        }
      }
    }
  };

  return (
    <Box>

      <InfoBanner
        title="Your active books!"
        description="Check off each chapter as you finish it and watch your reading rewards add up.
          Find the chapter with the checkbox—that's your next mission! 💰"
      />

      {books.length === 0 && <Typography>No books in progress.</Typography>}
      {books.map(book => (
        <Box key={book.olid} mb={4}>
          <Typography variant="h6" fontWeight="bold">
            {book.title}
            {book.readCount > 1 ? ` x${book.readCount}` : ''}
            <Typography component="span" variant="body2" color="text.secondary"> ({book.authors})</Typography>
          </Typography>
          <Box
            sx={{ maxHeight: 320, overflowY: 'auto', borderRadius: 1, border: '1px solid #dee2e6', background: '#fff', mt: 1 }}
            ref={el => { chapterListRefs.current[book.olid] = el as HTMLDivElement | null; }}
          >
            <List disablePadding>
              {(chapters[book.olid] || []).map((chapter: any, _unused: number, arr: any[]) => {
                const isRead = readChapters[book.olid]?.has(chapter.chapterIndex) || false;
                // Current chapter is the first unchecked chapter
                const currentChapterIndex = Math.min(...arr.filter((c: any) => !readChapters[book.olid]?.has(c.chapterIndex)).map((c: any) => c.chapterIndex));
                const isCurrent = chapter.chapterIndex === currentChapterIndex;
                // Find most recent read chapter for this book
                const readIndexes = arr.filter((c: any) => readChapters[book.olid]?.has(c.chapterIndex)).map((c: any) => c.chapterIndex);
                const mostRecentRead = Math.max(...readIndexes);
                const isMostRecent = isRead && chapter.chapterIndex === mostRecentRead;
                return (
                  <ListItem
                    key={chapter.chapterIndex}
                    data-chapter={chapter.chapterIndex}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: isRead ? '#888' : undefined,
                      textDecoration: isRead ? 'line-through' : undefined,
                      fontStyle: isRead ? 'italic' : undefined,
                      py: 1,
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    {(isCurrent && !isRead) || isMostRecent ? (
                      <Checkbox
                        checked={isRead}
                        onChange={() => handleCheck(book.olid, chapter.chapterIndex, isRead, isMostRecent)}
                        sx={{ mr: 2 }}
                      />
                    ) : (
                      <Box sx={{ width: '2em', display: 'inline-block' }} />
                    )}
                    <Box>
                      <Typography component="span">
                        {chapter.name || chapter.title || `Chapter ${chapter.chapterIndex}`}
                        {isRead && readDates[book.olid]?.[chapter.chapterIndex] && (
                          <Typography component="span" sx={{ ml: 2, fontSize: '0.9em', color: '#666' }}>
                            ({readDates[book.olid][chapter.chapterIndex]})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
