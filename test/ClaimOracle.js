const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClaimOracle", function () {
  let ClaimOracle, claimOracle, owner, requester, addr1;

  beforeEach(async function () {
    // Deploy the ClaimOracle contract
    ClaimOracle = await ethers.getContractFactory("ClaimOracle");
    [owner, requester, addr1] = await ethers.getSigners();
    claimOracle = await ClaimOracle.deploy();
    await claimOracle.waitForDeployment();
  });

  it("should set the initial claim fee", async function () {
    const initialFee = await claimOracle.claimFee();
    expect(initialFee).to.equal(ethers.parseEther("0.01"));
  });

  it("should allow a requester to submit a claim", async function () {
    const tokenId = 1;
    const data = "encryptedData";
    const fee = await claimOracle.claimFee();

    await expect(
      claimOracle.connect(requester).requestClaim(tokenId, data, { value: fee })
    )
      .to.emit(claimOracle, "ClaimRequested")
      .withArgs(tokenId, data, requester.address);

    const contractBalance = await ethers.provider.getBalance(
      claimOracle.target
    );
    expect(contractBalance).to.equal(fee);
  });

  it("should reject a claim request with insufficient fee", async function () {
    const tokenId = 1;
    const data = "encryptedData";

    await expect(
      claimOracle
        .connect(requester)
        .requestClaim(tokenId, data, { value: ethers.parseEther("0.005") })
    ).to.be.revertedWith("Insufficient claim fee");
  });

  it("should reject duplicate claims for the same token ID", async function () {
    const tokenId = 1;
    const data = "encryptedData";
    const fee = await claimOracle.claimFee();

    await claimOracle
      .connect(requester)
      .requestClaim(tokenId, data, { value: fee });

    await expect(
      claimOracle
        .connect(addr1)
        .requestClaim(tokenId, "newData", { value: fee })
    ).to.be.revertedWith("Claim already in progress");
  });

  it("should allow fulfilling a valid claim and transfer funds to requester", async function () {
    const tokenId = 1;
    const data = "encryptedData";
    const fee = await claimOracle.claimFee();
    const claimAmount = ethers.parseEther("0.5");

    // Fund the contract
    await owner.sendTransaction({
      to: claimOracle.target,
      value: ethers.parseEther("1"),
    });

    // Request claim
    await claimOracle
      .connect(requester)
      .requestClaim(tokenId, data, { value: fee });

    const initialBalance = BigInt(
      await ethers.provider.getBalance(requester.address)
    );

    // Fulfill claim
    await expect(claimOracle.fulfillClaim(tokenId, true, claimAmount))
      .to.emit(claimOracle, "ClaimFulfilled")
      .withArgs(tokenId, true, claimAmount, requester.address);

    const finalBalance = BigInt(
      await ethers.provider.getBalance(requester.address)
    );
    expect(finalBalance - initialBalance).to.equal(BigInt(claimAmount));
  });

  it("should reject fulfilling a claim if contract balance is insufficient", async function () {
    const tokenId = 1;
    const data = "encryptedData";
    const fee = await claimOracle.claimFee();

    // Request claim
    await claimOracle
      .connect(requester)
      .requestClaim(tokenId, data, { value: fee });

    // Attempt to fulfill claim with insufficient balance
    const claimAmount = ethers.parseEther("0.5");
    await expect(
      claimOracle.fulfillClaim(tokenId, true, claimAmount)
    ).to.be.revertedWith("Insufficient contract balance");
  });

  it("should allow the owner to withdraw funds", async function () {
    const depositAmount = ethers.parseEther("1");
    const withdrawAmount = ethers.parseEther("0.5");

    // Fund the contract
    await owner.sendTransaction({
      to: claimOracle.target,
      value: depositAmount,
    });

    // Verify initial contract balance
    const initialContractBalance = await ethers.provider.getBalance(
      claimOracle.target
    );
    expect(initialContractBalance).to.equal(depositAmount);

    // Withdraw funds and check balance changes
    await expect(() =>
      claimOracle.withdraw(owner.address, withdrawAmount)
    ).to.changeEtherBalance(owner, withdrawAmount);

    // Verify final contract balance
    const finalContractBalance = await ethers.provider.getBalance(
      claimOracle.target
    );
    expect(finalContractBalance).to.equal(depositAmount - withdrawAmount);
  });

  it("should allow the owner to update the claim fee", async function () {
    const newFee = ethers.parseEther("0.02");

    await claimOracle.updateClaimFee(newFee);
    const updatedFee = await claimOracle.claimFee();

    expect(updatedFee).to.equal(newFee);
  });

  it("should accept ETH via the fallback function", async function () {
    const depositAmount = ethers.parseEther("0.5");

    await owner.sendTransaction({
      to: claimOracle.target,
      value: depositAmount,
    });

    const contractBalance = await ethers.provider.getBalance(
      claimOracle.target
    );
    expect(contractBalance).to.equal(depositAmount);
  });
});
