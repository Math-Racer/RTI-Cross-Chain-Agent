require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.19" },
      { version: "0.8.28" }
    ]
  },
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 30_000_000_000  // Optional: 30 Gwei to avoid underpricing
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  hardhat: {
      chainId: 31337, // Local Hardhat chain ID
  }
};
