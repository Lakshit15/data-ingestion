import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});

// ClickHouse Connection
export const connectClickHouse = (config) => API.post('/clickhouse/connect', config);
export const listTables = (config) => API.post('/clickhouse/tables', config);
export const getColumns = (config) => API.post('/clickhouse/columns', config);

// Data Transfer
export const importToClickHouse = (formData) => API.post(
  '/ingest/file-to-clickhouse', 
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
);

export const exportFromClickHouse = (config) => API.get(
  '/ingest/clickhouse-to-file', 
  {
    params: config,
    responseType: 'blob'
  }
);