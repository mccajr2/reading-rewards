import React, {useState, useEffect} from 'react';
export default function History(){
  const backendPort = import.meta.env.VITE_BACKEND_PORT;
  const [hist,setHist]=useState<any[]>([]);
  useEffect(()=>{ fetch('/api/history').then(r=>r.json()).then(setHist).catch(()=>fetch(`http://localhost:${backendPort}/api/history`).then(r=>r.json()).then(setHist)); },[]);
  
  return (<div>
    <h4>History</h4>
    <ul className="list-group">
      {hist.map((h:any,i:number)=>(
        <li key={i} className="list-group-item">
          {h.bookOlid} — chapter {h.chapterIndex} — {new Date(h.readAt).toLocaleString()} — ${ (h.credit/100).toFixed(2) }
        </li>
      ))}
    </ul>
  </div>);
}
