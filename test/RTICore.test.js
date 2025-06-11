const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RTICore", function () {
  let RTICore, rtiCore, owner, responder;

  before(async () => {
    [owner, responder] = await ethers.getSigners();
    RTICore = await ethers.getContractFactory("RTICore");
    rtiCore = await RTICore.deploy();
  });

  it("Should create a new RTI request", async function () {
    const futureDeadline = Math.floor(Date.now() / 1000) + 3600;

    await expect(
      rtiCore.connect(owner).createRequest(
        "Urban Development", 
        "Total budget for road repairs in 2023", 
        futureDeadline,
        { value: ethers.parseEther("0.1") }
      )
    ).to.emit(rtiCore, "RequestCreated");
  });

  it("Should fulfill a request", async function () {
    const futureDeadline = Math.floor(Date.now() / 1000) + 3600;

    await rtiCore.connect(owner).createRequest(
      "Water Supply",
      "How much water was supplied in Jan 2024?",
      futureDeadline,
      { value: ethers.parseEther("0.1") }
    );

    const tx = await rtiCore.connect(responder).fulfillRequest(
      0,
      "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
    );

    await expect(tx).to.emit(rtiCore, "RequestFulfilled");
  });
});
