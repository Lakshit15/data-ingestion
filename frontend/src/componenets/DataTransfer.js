import React, { useState } from 'react';
import { getColumns, importToClickHouse, exportFromClickHouse } from '../services/api';
import ColumnSelector from './ColumnSelector';
import './DataTransfer.css';

const DataTransfer = ({ connection, onDisconnect }) => {
  const [activeTab, setActiveTab] = useState('import');
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    const { data } = await getColumns({ ...connection, table });
    setColumns(data);
    setSelectedColumns([]);
  };

  const handleImport = async () => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(connection).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('table', selectedTable);

    setStatus('Importing...');
    try {
      await importToClickHouse(formData);
      setStatus('Import successful!');
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleExport = async () => {
    setStatus('Exporting...');
    try {
      const response = await exportFromClickHouse({
        ...connection,
        table: selectedTable,
        columns: selectedColumns.join(',')
      });
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedTable}_export.csv`);
      document.body.appendChild(link);
      link.click();
      setStatus('Export completed!');
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="data-transfer">
      <div className="header">
        <h2>Connected to {connection.host}:{connection.port}</h2>
        <button onClick={onDisconnect}>Disconnect</button>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'import' ? 'active' : ''}
          onClick={() => setActiveTab('import')}
        >
          Import to ClickHouse
        </button>
        <button 
          className={activeTab === 'export' ? 'active' : ''}
          onClick={() => setActiveTab('export')}
        >
          Export from ClickHouse
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'import' ? (
          <div className="import-section">
            <div className="form-group">
              <label>Select Table:</label>
              <select 
                value={selectedTable} 
                onChange={(e) => handleTableSelect(e.target.value)}
              >
                <option value="">Select table</option>
                {connection.tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Upload File:</label>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
                accept=".csv,.tsv"
              />
            </div>
            <button onClick={handleImport}>Import Data</button>
          </div>
        ) : (
          <div className="export-section">
            <div className="form-group">
              <label>Select Table:</label>
              <select 
                value={selectedTable} 
                onChange={(e) => handleTableSelect(e.target.value)}
              >
                <option value="">Select table</option>
                {connection.tables.map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
            {columns.length > 0 && (
              <ColumnSelector
                columns={columns}
                selectedColumns={selectedColumns}
                onSelect={setSelectedColumns}
              />
            )}
            <button 
              onClick={handleExport}
              disabled={!selectedTable}
            >
              Export Data
            </button>
          </div>
        )}
      </div>

      {status && <div className="status-message">{status}</div>}
    </div>
  );
};

export default DataTransfer;