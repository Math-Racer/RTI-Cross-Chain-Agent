// client/src/components/RTIList.js
import React, { useState } from 'react';

function RTIList({ rtis, onRespond, onVerify, onRefund, account }) {
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);

  const handleRespondClick = (rtiId) => {
    setRespondingTo(rtiId);
  };

  const submitResponse = () => {
    onRespond(respondingTo, responseText);
    setRespondingTo(null);
    setResponseText('');
  };

  const canRefund = (rti) => {
    const deadline = new Date(rti.deadline);
    const now = new Date();
    return (rti.status === 'Pending' || rti.status === 'Rejected') && now > deadline;
  };

  return (
    <div className="rti-list">
      <h2>RTI Requests</h2>
      {rtis.length === 0 ? (
        <p>No RTI requests found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Bounty (ETH)</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rtis.map((rti) => (
              <tr key={rti.id}>
                <td>{rti.id}</td>
                <td>{rti.title}</td>
                <td>{rti.description.substring(0, 50)}...</td>
                <td>{rti.bounty}</td>
                <td>{new Date(rti.deadline).toLocaleDateString()}</td>
                <td>{rti.status}</td>
                <td>
                  {rti.has_file && (
                    <a 
                      href={`http://localhost:5000/download/${rti.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  )}
                  {rti.status === 'Pending' && account.startsWith('0x') && (
                    <button onClick={() => handleRespondClick(rti.id)}>
                      Respond
                    </button>
                  )}
                  {rti.status === 'Responded' && account.startsWith('0x') && (
                    <button onClick={() => onVerify(rti.id)}>
                      Verify
                    </button>
                  )}
                  {canRefund(rti) && (
                    <button onClick={() => onRefund(rti.id)}>
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {respondingTo !== null && (
        <div className="response-modal">
          <h3>Respond to RTI #{respondingTo}</h3>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Enter your response..."
          />
          <div>
            <button onClick={submitResponse}>Submit Response</button>
            <button onClick={() => setRespondingTo(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RTIList;