
import React from "react"
import { useState } from 'react';
import './App.css';
import spatula from './assets/spatula.jpg';

import StripeContainer from './component/StripeContainer';



function App() {
  const [showItem, setShowItem] = useState(false)
  return (
    <div className="App">
      <h1>The MADA SHOP</h1>
      {showItem ? <StripeContainer/> : <div> <h3>$10.00</h3> <img src={spatula} alt="Spaluta" />
      <button onClick={() => setShowItem(true)}>Acheter une spatule</button></div>}
    </div>
  );
}

export default App;
