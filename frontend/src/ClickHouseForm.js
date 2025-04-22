import React, { useState } from 'react';
import axios from 'axios';

export default function ClickHouseForm() {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(8123);
  const [jwt, setJwt] = useState("");

  const handleConnect = async () => {
    try {
      const res = await axios.post("http://localhost:8000/clickhouse/connect", { host, port, jwt });
      alert(`Connected! ${res.data.status}`);
    } catch (err) {
      alert(`Error: ${err.response.data.detail}`);
    }
  };

  return (
    <div>
      <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="Host" />
      <input type="number" value={port} onChange={(e) => setPort(e.target.value)} placeholder="Port" />
      <input type="password" value={jwt} onChange={(e) => setJwt(e.target.value)} placeholder="JWT Token" />
      <button onClick={handleConnect}>Connect</button>
    </div>
  );
}