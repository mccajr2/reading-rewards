import React, {useState, useEffect} from 'react';
export default function History(){
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

  return (<div>
    <h4>History</h4>
    {error && <div style={{color:'red',marginBottom:'1em'}}>Error: {error}</div>}
    <ul className="list-group">
      {Object.values(grouped).map((book: any, i: number) => (
        <li key={i} className="list-group-item">
          {book.title}{book.readCount > 1 ? ` x${book.readCount}` : ''} <span className="text-muted">({book.authors})</span>
        </li>
      ))}
    </ul>
  </div>);
}
