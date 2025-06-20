import React, { useState, useEffect } from 'react';
import { FileText, User, AlertCircle, Loader2 } from 'lucide-react';
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
      const response = await fetch('http://localhost:5000/rtis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRtis(data);
    } catch (error) {
      console.error('Error fetching RTIs:', error);
      setError('Failed to load RTIs. Please check your backend connection.');
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
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit RTI');
      }

      const result = await response.json();
      if (result.success) {
        alert('RTI submitted successfully!');
        await fetchRTIs();
        setView('list');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error submitting RTI:', error);
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
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        alert('Response submitted successfully!');
        await fetchRTIs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error responding to RTI:', error);
      setError(`Failed to submit response: ${error.message}`);
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
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        alert('RTI verified and bounty released!');
        await fetchRTIs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error verifying RTI:', error);
      setError(`Failed to verify RTI: ${error.message}`);
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
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        alert('Bounty refunded successfully!');
        await fetchRTIs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error refunding RTI:', error);
      setError(`Failed to refund bounty: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-violet-100">
      <div className="min-h-screen backdrop-blur-sm bg-white/20">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <header className="mb-8">
            <div className="bg-white/30 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      India RTI System
                    </h1>
                    <p className="text-purple-600/80 text-sm">Right to Information Portal</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-800 font-medium text-sm">
                    {account.substring(0, 6)}...{account.substring(38)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-100/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="mb-6 bg-purple-100/80 backdrop-blur-sm border border-purple-200 text-purple-700 px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
              <span>Loading...</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="mb-8">
            <div className="bg-white/30 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/20 inline-flex gap-2">
              <button
                onClick={() => setView('list')}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  view === 'list'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                    : 'text-purple-600 hover:bg-white/40 hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                View RTIs
              </button>
              <button
                onClick={() => setView('create')}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  view === 'create'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                    : 'text-purple-600 hover:bg-white/40 hover:scale-105'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Create RTI
              </button>
            </div>
          </nav>

          {/* Main Content */}
          <main>
            {view === 'list' ? (
              <RTIList 
                rtis={rtis} 
                onRespond={handleRespond}
                onVerify={handleVerify}
                onRefund={handleRefund}
                account={account}
                loading={loading}
              />
            ) : (
              <RTIForm onSubmit={handleRTISubmit} loading={loading} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;