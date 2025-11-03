import { useState } from 'react';

function TestConnection() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:8080'; // 백엔드 포트에 맞게 수정하세요

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>React ↔️ Spring Boot 연결 테스트</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testHealth}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '테스트 중...' : 'Health Check'}
        </button>

        <button
          onClick={testConnection}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '테스트 중...' : 'CORS 테스트'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <strong>에러:</strong> {error}
          <br />
          <small>백엔드 서버가 실행 중인지 확인하세요 (포트: 8080)</small>
        </div>
      )}

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          <strong>✅ 성공!</strong>
          <pre style={{
            marginTop: '10px',
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {result}
          </pre>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <h3>테스트 방법:</h3>
        <ol>
          <li>백엔드 Spring Boot 애플리케이션 실행 (포트 8080)</li>
          <li>React 개발 서버 실행 (npm run dev - 포트 5173)</li>
          <li>위 버튼을 클릭하여 연결 테스트</li>
        </ol>
        <p><strong>API 주소:</strong> {API_BASE_URL}</p>
      </div>
    </div>
  );
}

export default TestConnection;
