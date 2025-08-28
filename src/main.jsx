import React from 'react';
import ReactDOM from 'react-dom/client';
import PokerGame from './PokerGame';
import './style.css'; // opzionale se vuoi aggiungere stili

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PokerGame />
  </React.StrictMode>
);
