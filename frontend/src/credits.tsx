import React, { useState, useEffect } from 'react';
export default function Credits() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [d, setD] = useState(0);
  useEffect(() => {
    const fetchCredits = () => {
      fetch(`${API_URL}/credits`)
        .then(r => r.json())
        .then(j => {
          console.log("[Credits API] Response:", j);
          setD(j.dollars);
        })
        .catch((e) => { console.log("[Credits API] Error:", e); });
    };
    fetchCredits();
    window.updateCredits = fetchCredits;
    return () => { delete window.updateCredits; };
  }, []);
  return (

    <div className="earnings-badge">
      <div className="badge-container">
        <div className="badge-label">
          <span className="star-icon">⭐</span>
          Reading Earnings
          <span className="star-icon">⭐</span>
        </div>
        <div className="badge-amount" id="earnings">${d.toFixed(2)}</div>
        <div className="badge-subtitle">Keep Reading! 📚</div>
      </div>
    </div>
  );
}
