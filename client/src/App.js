import React, { useState, useEffect } from 'react';
import { User, AlertCircle, Loader2 } from 'lucide-react';
import RTIList from './components/RTIList';
import RTIForm from './components/RTIForm';
import './App.css';

function App() {
  const [rtis, setRtis] = useState([]);
  const [view, setView] = useState('list');
  const [account] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRTIs();
  }, []);

  const fetchRTIs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/rtis');
      const data = await response.json();
      setRtis(data);
    } catch (error) {
      setError('Failed to load RTIs');
    } finally {
      setLoading(false);
    }
  };

  const handleRTISubmit = async (rtiData) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('citizen_address', account);
    formData.append('title', rtiData.title);
    formData.append('description', rtiData.description);
    formData.append('bounty', rtiData.bounty);
    formData.append('deadline_days', rtiData.deadline);
    if (rtiData.file) {
      formData.append('file', rtiData.file);
    }

    try {
      const response = await fetch('http://localhost:5000/rtis', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        await fetchRTIs();
        setView('list');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(`Failed to submit RTI: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (rtiId, responseText) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rti_id: rtiId,
          response_text: responseText,
          officer_address: account,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRTIs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(`Failed to respond: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (rtiId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rti_id: rtiId,
          admin_address: account,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRTIs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(`Failed to verify: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (rtiId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rti_id: rtiId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchRTIs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError(`Failed to refund: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>India RTI System</h1>
        <div className="account-info">
          <User />
          <span>{account.substring(0, 6)}...{account.substring(38)}</span>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-message">
          <Loader2 className="spinner" />
          <span>Loading...</span>
        </div>
      )}

      <nav>
        <button onClick={() => setView('list')} disabled={loading}>
          View RTIs
        </button>
        <button onClick={() => setView('create')} disabled={loading}>
          Create RTI
        </button>
      </nav>

      <main>
        {view === 'list' ? (
          <RTIList 
            rtis={rtis} 
            onRespond={handleRespond}
            onVerify={handleVerify}
            onRefund={handleRefund}
            account={account}
          />
        ) : (
          <RTIForm onSubmit={handleRTISubmit} loading={loading} />
        )}
      </main>
    </div>
  );
}

export default App;