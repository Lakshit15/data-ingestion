import React, { useState } from 'react';
import { connectClickHouse, listTables } from '../services/api';
import './ConnectionForm.css';

const ConnectionForm = ({ onConnectSuccess }) => {
  const [config, setConfig] = useState({
    host: 'localhost',
    port: 8443,
    jwt: '',
    database: 'default'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await connectClickHouse(config);
      const { data } = await listTables(config);
      onConnectSuccess({ ...config, tables: data.tables });
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connection-form">
      <h2>Connect to ClickHouse</h2>
      <div className="form-group">
        <label>Host:</label>
        <input
          value={config.host}
          onChange={(e) => setConfig({...config, host: e.target.value})}
        />
      </div>
      <div className="form-group">
        <label>Port:</label>
        <input
          type="number"
          value={config.port}
          onChange={(e) => setConfig({...config, port: e.target.value})}
        />
      </div>
      <div className="form-group">
        <label>JWT Token:</label>
        <input
          type="password"
          value={config.jwt}
          onChange={(e) => setConfig({...config, jwt: e.target.value})}
        />
      </div>
      <button onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting...' : 'Connect'}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ConnectionForm;