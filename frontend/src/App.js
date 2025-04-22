import React, { useState } from 'react';
import './App.css';
import ConnectionForm from './components/ConnectionForm.js';
import DataTransfer from './components/DataTransfer.js';

function App() {
  const [connection, setConnection] = useState(null);

  return (
    <div className="app-container">
      <header>
        <h1>ClickHouse Data Ingestion Tool</h1>
      </header>
      
      <main>
        {!connection ? (
          <ConnectionForm onConnectSuccess={setConnection} />
        ) : (
          <DataTransfer 
            connection={connection} 
            onDisconnect={() => setConnection(null)} 
          />
        )}
      </main>
    </div>
  );
}

export default App;