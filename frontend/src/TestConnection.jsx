import React, { useState } from 'react';
import { authAPI } from './services/api';

const TestConnection = () => {
  const [status, setStatus] = useState('Not tested');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login('admin@dairy.com', 'admin123');
      setStatus('✅ Connected! Token: ' + response.data.access_token.substring(0, 20) + '...');
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>Backend Connection Test</h3>
      <button 
        onClick={testConnection} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '10px'
        }}
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      <p style={{ marginTop: '15px', fontWeight: 'bold' }}>Status: {status}</p>
    </div>
  );
};

export default TestConnection;