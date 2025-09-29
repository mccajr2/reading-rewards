import React, {useState, useEffect} from 'react';
export default function Credits(){
  const API_URL = import.meta.env.VITE_API_URL;
  const [d,setD]=useState(0);
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
    <span className="badge bg-success ms-3">
      Total: ${d.toFixed(2)}
    </span>
  );
}
