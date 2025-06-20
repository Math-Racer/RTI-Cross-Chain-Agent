// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const RTI = await hre.ethers.getContractFactory("RTI");
  const rti = await RTI.deploy(); // ✅ Hardhat-Ethers deploys and waits automatically
console.log("Contract deployed to:", rti.target); // in ethers v6, use `.target` instead of `.address`


 console.log("RTI contract deployed to:", rti.target); // ✅ Ethers v6

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });