const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract factory
  const RTICore = await hre.ethers.getContractFactory("RTICore");
  
  // Deploy the contract
  const rtiCore = await RTICore.deploy();
  
  // Wait for deployment to complete (new syntax)
  await rtiCore.waitForDeployment();
  
  // Get the deployed address (new syntax)
  const contractAddress = await rtiCore.getAddress();
  console.log("RTICore deployed to:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });