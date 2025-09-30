import React, {useState, useEffect} from 'react';
import Search from './search';
import ReadingList from './readinglist';
import History from './history';
import Credits from './credits';

export default function App(){
  const [view, setView] = useState<'search'|'list'|'history'>('search');
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
      <h1 className="mb-3">Reading Rewards</h1>
      <nav className="mb-3">
        <button className="btn btn-primary me-2" onClick={()=>setView('search')}>Search</button>
        <button className="btn btn-secondary me-2" onClick={()=>setView('list')}>Reading List</button>
        <button className="btn btn-light" onClick={()=>setView('history')}>History</button>
        <Credits />
      </nav>
      {view==='search' && <Search />}
      {view==='list' && <ReadingList />}
      {view==='history' && <History />}
    </div>
  );
}

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Home from './components/Home';
// import About from './components/About';
// import NotFound from './components/NotFound';

// function App() {
//   return (
//     <Router>
//       <div className="App container mt-4">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/about" element={<About />} />
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;
