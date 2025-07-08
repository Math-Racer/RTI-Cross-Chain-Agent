
## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/VSENTHAMIZHAN/RTI-Cross-Chain-Agent.git
cd RTI-Cross-Chain-Agent
```

### 2. Start Local Blockchain

```bash
npm install hardhat
npx hardhat node
```

**Note:** Keep this terminal running. Open a new terminal window for the next step.

### 3. Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```



### 4. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
python app.py
```

**Note:** Keep this terminal running. Open a new terminal window for the next step.

### 5. Frontend Setup

```bash
cd client
npm install
npm start
```

You can access your website from your browser at http://127.0.0.1:3000

---