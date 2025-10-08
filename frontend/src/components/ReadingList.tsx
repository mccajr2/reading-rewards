

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

// BookRead-aware ReadingList
export default function ReadingList() {
  // Refs for each bookRead's chapter list div
  const chapterListRefs = React.useRef<{ [bookReadId: string]: HTMLDivElement | null }>({});

  // Each bookRead is a unique reading instance (not just OLID)
  const [bookReads, setBookReads] = useState<any[]>([]); // Each has id, bookOlid, inProgress, etc.
  const [booksByOlid, setBooksByOlid] = useState<{ [olid: string]: any }>({});
  const [chapters, setChapters] = useState<{ [olid: string]: any[] }>({});
  // Per BookReadId: Set of chapter UUIDs read
  const [readChapters, setReadChapters] = useState<{ [bookReadId: string]: Set<string> }>({});
  const [readDates, setReadDates] = useState<{ [bookReadId: string]: { [chapterId: string]: string } }>({});

  useEffect(() => {
    bookReads.forEach(br => {
      const chaptersArr = chapters[br.bookOlid] || [];
      let targetChapter: any = chaptersArr.find((c: any) => !readChapters[br.id]?.has(c.id));
      // If all chapters are read, scroll to last chapter
      if (!targetChapter && chaptersArr.length > 0) {
        targetChapter = chaptersArr[chaptersArr.length - 1];
      }
      if (chapterListRefs.current[br.id] && targetChapter) {
        const bookDiv = chapterListRefs.current[br.id];
        const ul = bookDiv?.querySelector('ul');
        const li = ul?.querySelector(`[data-chapter='${targetChapter.chapterIndex}']`);
        if (li && bookDiv) {
          const liRect = (li as HTMLElement).getBoundingClientRect();
          const divRect = bookDiv.getBoundingClientRect();
          const offset = liRect.top - divRect.top + bookDiv.scrollTop;
          bookDiv.scrollTop = offset - bookDiv.clientHeight / 2 + (li as HTMLElement).offsetHeight / 2;
        }
      }
    });
  }, [bookReads, chapters, readChapters]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchList = async () => {
      // Fetch all in-progress BookRead objects for the user
      const r = await fetch(`${API_URL}/bookreads/in-progress`);
      if (!r.ok) return;
      const bookReadsArr = await r.json();
      setBookReads(bookReadsArr);
      // Group by OLID for book info
      const booksByOlid: { [olid: string]: any } = {};
      bookReadsArr.forEach((br: any) => {
        booksByOlid[br.bookOlid] = {
          olid: br.bookOlid,
          title: br.title,
          authors: Array.isArray(br.authors) ? br.authors.join(', ') : br.authors,
          readCount: br.readCount
        };
      });
      setBooksByOlid(booksByOlid);
      // Fetch chapters for each book OLID
      const chaptersObj: { [olid: string]: any[] } = {};
      for (const br of bookReadsArr) {
        const rc = await fetch(`${API_URL}/books/${br.bookOlid}/chapters`);
        chaptersObj[br.bookOlid] = rc.ok ? await rc.json() : [];
      }
      setChapters(chaptersObj);
      // Use readChapterIds from backend for each BookRead
      const readObj: { [bookReadId: string]: Set<string> } = {};
      for (const br of bookReadsArr) {
        readObj[br.id] = new Set(br.readChapterIds || []);
      }
      setReadChapters(readObj);
      // (Optional) If you want to keep readDates, you can still fetch chapterreads per BookRead as before
    };
    fetchList();
  }, []);

  // bookReadId-aware handleCheck
  const handleCheck = async (bookReadId: string, bookOlid: string, chapter: any, isRead: boolean, isMostRecent: boolean) => {
    const chapterId = chapter.id;
    if (!isRead) {
      // Mark as read for a specific BookRead instance
      const res = await fetch(`${API_URL}/bookreads/${bookReadId}/chapters/${chapterId}/read`, { method: 'POST' });
      let readAt = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (res.ok) {
        try {
          const data = await res.json();
          if (data.completionDate) {
            readAt = new Date(data.completionDate).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            });
          }
        } catch { }
      }
      setReadChapters(prev => {
        const updated = { ...prev };
        if (!updated[bookReadId]) updated[bookReadId] = new Set();
        updated[bookReadId].add(chapterId);
        return updated;
      });
      setReadDates(prev => {
        const updated = { ...prev };
        if (!updated[bookReadId]) updated[bookReadId] = {};
        updated[bookReadId][chapterId] = readAt;
        return updated;
      });
      if (window.updateCredits) window.updateCredits();

      // Check if this was the final chapter
      const allChapters = chapters[bookOlid] || [];
      const allRead = allChapters.every((c: any) => readChapters[bookReadId]?.has(c.id) || c.id === chapterId);
      if (allChapters.length > 0 && allRead) {
        if (window.confirm('Congratulations! You finished the book. Mark as finished and allow rereading?')) {
          await fetch(`${API_URL}/books/${bookOlid}/finish`, { method: 'POST' });
          window.location.reload();
        }
      }
    } else if (isMostRecent) {
      if (window.confirm('Are you sure you want to undo the most recent read for this chapter?')) {
        const res = await fetch(`${API_URL}/books/${bookOlid}/chapters/${chapterId}/read`, { method: 'DELETE' });
        if (res.ok) {
          setReadChapters(prev => {
            const updated = { ...prev };
            if (updated[bookReadId]) updated[bookReadId].delete(chapterId);
            return updated;
          });
          setReadDates(prev => {
            const updated = { ...prev };
            if (updated[bookReadId]) delete updated[bookReadId][chapterId];
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
        description="Check off each chapter as you finish it and watch your reading rewards add up.\nFind the chapter with the checkbox—that's your next mission! 💰"
      />
      {bookReads.length === 0 && <Typography>No books in progress.</Typography>}
      {bookReads.map(br => {
        const book = booksByOlid[br.bookOlid] || {};
        const chaptersArr = chapters[br.bookOlid] || [];
        const readSet = readChapters[br.id] || new Set();
        const dateMap = readDates[br.id] || {};
        // Find first unread chapter
        const currentChapterId = chaptersArr.find((c: any) => !readSet.has(c.id))?.id;
        // Find most recent read chapter
        const readIds = chaptersArr.filter((c: any) => readSet.has(c.id)).map((c: any) => c.id);
        const mostRecentReadId = readIds.length > 0 ? readIds[readIds.length - 1] : null;
        return (
          <Box key={br.id} mb={4}>
            <Typography variant="h6" fontWeight="bold">
              {book.title}
              {book.readCount > 1 ? ` x${book.readCount}` : ''}
              <Typography component="span" variant="body2" color="text.secondary"> ({book.authors})</Typography>
            </Typography>
            <Box
              sx={{ maxHeight: 320, overflowY: 'auto', borderRadius: 1, border: '1px solid #dee2e6', background: '#fff', mt: 1 }}
              ref={el => { chapterListRefs.current[br.id] = el as HTMLDivElement | null; }}
            >
              <List disablePadding>
                {chaptersArr.map((chapter: any) => {
                  const isRead = readSet.has(chapter.id);
                  const isCurrent = chapter.id === currentChapterId;
                  const isMostRecent = isRead && chapter.id === mostRecentReadId;
                  return (
                    <ListItem
                      key={chapter.id}
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
                          onChange={() => handleCheck(br.id, br.bookOlid, chapter, isRead, isMostRecent)}
                          sx={{ mr: 2 }}
                        />
                      ) : (
                        <Box sx={{ width: '2em', display: 'inline-block' }} />
                      )}
                      <Box>
                        <Typography component="span">
                          {chapter.name || chapter.title || `Chapter ${chapter.chapterIndex}`}
                          {isRead && dateMap[chapter.id] && (
                            <Typography component="span" sx={{ ml: 2, fontSize: '0.9em', color: '#666' }}>
                              ({dateMap[chapter.id]})
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
        );
      })}
    </Box>
  );
}
