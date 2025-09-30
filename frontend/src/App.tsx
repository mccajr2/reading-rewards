import React, { useState, useEffect } from 'react';
import Search from './search';
import ReadingList from './readinglist';
import History from './history';
import Credits from './credits';

export default function App() {
  const KID_NAME = import.meta.env.VITE_KID_NAME;
  useEffect(() => {
    if (KID_NAME) {
      document.title = `${KID_NAME}'s Reading Rewards`;
    } else {
      document.title = 'Reading Rewards';
    }
  }, [KID_NAME]);
  const [view, setView] = useState<'search' | 'list' | 'history'>('search');
  const [hasInProgress, setHasInProgress] = useState(false);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/books`).then(r => r.ok ? r.json() : []).then(allBooks => {
      if (Array.isArray(allBooks) && allBooks.some((b: any) => b.inProgress)) {
        setHasInProgress(true);
        setView('list');
      } else {
        setHasInProgress(false);
        setView('search');
      }
    });
  }, []);
  return (
    <div className="container py-3">

      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#"><span className="star-icon">🏒</span>
            {KID_NAME}'s Reading Rewards<span className="star-icon">🏒</span></a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <a
                className={`nav-link${view === 'list' ? ' active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setView('list')}
              >
                Current Books
              </a>
              <a
                className={`nav-link${view === 'history' ? ' active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setView('history')}
              >
                Reading History
              </a>
              <a
                className={`nav-link${view === 'search' ? ' active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setView('search')}
              >
                Find Books
              </a>
            </ul>
          </div>
        </div>
        <Credits />
      </nav>

      {view === 'search' && <Search />}
      {view === 'list' && <ReadingList />}
      {view === 'history' && <History />}
    </div>
  );
}
