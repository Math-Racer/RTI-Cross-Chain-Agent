import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract, parseEther } from 'ethers';
import RTICoreABI from './abis/RTICore.json'; // Make sure this exists!

const CONTRACT_ADDRESS = "0xBe93b494903F78c407e341a7BbD001a1765331cF"; // Replace with your actual deployed address

function App() {
  const [contract, setContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

  const [department, setDepartment] = useState('');
  const [query, setQuery] = useState('');
  const [daysToRespond, setDaysToRespond] = useState(7);
  const [bounty, setBounty] = useState('');

  // Connect to MetaMask and Smart Contract
  useEffect(() => {
  const init = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const newProvider = new BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newSigner = await newProvider.getSigner();
      const userAddress = await newSigner.getAddress();

      const newContract = new Contract(CONTRACT_ADDRESS, RTICoreABI.abi, newSigner);
      setContract(newContract);
      setCurrentAccount(userAddress);
    } catch (error) {
      console.error("Initialization error:", error);
      alert("Error connecting to MetaMask: " + (error.message || error));
    }
  };

  init();
}, []);


  // Handle RTI Form Submit
  const handleSubmit = async () => {
    if (!contract) {
      alert("Contract not loaded.");
      return;
    }

    try {
      const value = parseEther(bounty); // Convert ETH string to BigNumber
      const tx = await contract.createRequest(department, query, daysToRespond, { value });
      await tx.wait();

      alert("✅ RTI Request Filed!");
      setDepartment('');
      setQuery('');
      setDaysToRespond(7);
      setBounty('');
    } catch (error) {
      console.error("Transaction Error:", error);
      alert("❌ Transaction Failed: " + (error.message || JSON.stringify(error)));
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>📜 RTI DApp</h1>
      <p><strong>👛 Connected Wallet:</strong> {currentAccount || "Not Connected"}</p>

      <input
        type="text"
        placeholder="Department (e.g., Municipal, Police)"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        style={{ width: '100%', padding: '0.5rem' }}
      /><br /><br />

      <textarea
        placeholder="Your RTI Query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        style={{ width: '100%', padding: '0.5rem' }}
      /><br /><br />

      <input
        type="number"
        placeholder="Days to Respond"
        value={daysToRespond}
        onChange={(e) => setDaysToRespond(Number(e.target.value))}
        style={{ width: '100%', padding: '0.5rem' }}
      /><br /><br />

      <input
        type="text"
        placeholder="Bounty (in ETH)"
        value={bounty}
        onChange={(e) => setBounty(e.target.value)}
        style={{ width: '100%', padding: '0.5rem' }}
      /><br /><br />

      <button onClick={handleSubmit} style={{
        padding: '0.7rem 2rem',
        backgroundColor: '#4CAF50',
        color: '#fff',
        border: 'none',
        fontSize: '1rem',
        cursor: 'pointer'
      }}>
        📤 Submit RTI
      </button>
    </div>
  );
}

export default App;
