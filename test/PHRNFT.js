const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

console.log("Ethers.js version:", ethers.version);

describe("PHRNFT Contract with Oracle Integration", function () {
  async function deployPHRNFTFixture() {
    // Get test accounts
    const [deployer, otherAccount] = await ethers.getSigners();

    // Dummy oracle and LINK token configurations
    const oracleAddress = ethers.ZeroAddress; // Replace with actual oracle address
    const jobId = ethers.encodeBytes32String("testJob"); // Use the correct encoding method for jobId
    const fee = ethers.parseEther("0.1"); // LINK fee
    const linkTokenAddress = ethers.ZeroAddress; // Replace with actual LINK token address

    // Deploy the PHRNFT contract
    const PHRNFT = await ethers.getContractFactory("PHRNFT");
    const phrNFT = await PHRNFT.deploy(oracleAddress, jobId, fee, linkTokenAddress);

    // Return contract and accounts
    return { phrNFT, deployer, otherAccount };
}  

  describe("Deployment", function () {
    it("Should deploy the contract successfully", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);
      expect(phrNFT).to.be.ok; // Ensure contract is deployed
    });

    it("Should start with a tokenCounter of 0", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);
      expect(await phrNFT.tokenCounter()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token and assign it to the correct owner", async function () {
      const { phrNFT, deployer } = await loadFixture(deployPHRNFTFixture);

      const recipient = deployer.address;
      const encryptedData = "encryptedDataHash";
      const icd10Code = "A00";

      const tx = await phrNFT.mint(recipient, encryptedData, icd10Code);
      await tx.wait();

      const tokenId = 0;
      expect(await phrNFT.ownerOf(tokenId)).to.equal(recipient);
      expect(await phrNFT.balanceOf(recipient)).to.equal(1);

      const medicalRecord = await phrNFT.getMedicalRecord(tokenId);
      expect(medicalRecord[0]).to.equal(encryptedData);
      expect(medicalRecord[1]).to.equal(icd10Code);
    });

    it("Should increment the tokenCounter after minting", async function () {
      const { phrNFT, deployer } = await loadFixture(deployPHRNFTFixture);

      const recipient = deployer.address;
      const encryptedData = "encryptedDataHash";
      const icd10Code = "A00";

      await phrNFT.mint(recipient, encryptedData, icd10Code);
      expect(await phrNFT.tokenCounter()).to.equal(1);
    });

    it("Should revert if minting to the zero address", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);

      const encryptedData = "encryptedDataHash";
      const icd10Code = "A00";

      await expect(
        phrNFT.mint(ethers.ZeroAddress, encryptedData, icd10Code)
      ).to.be.revertedWith("PHRNFT: mint to the zero address");
    });
  });

  describe("Claim Process (Oracle Integration)", function () {
    it("Should request claim for a valid token ID", async function () {
      const { phrNFT, deployer } = await loadFixture(deployPHRNFTFixture);

      const encryptedData = "encryptedDataHash";
      const icd10Code = "A00";

      const tx = await phrNFT.mint(deployer.address, encryptedData, icd10Code);
      await tx.wait();

      const tokenId = 0;

      const requestId = await phrNFT.requestClaim(tokenId);
      expect(requestId).to.be.ok;
    });

    it("Should revert if requesting claim for a non-existent token", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);

      await expect(phrNFT.requestClaim(999)).to.be.revertedWith(
        "PHRNFT: token does not exist"
      );
    });

    it("Should fulfill a valid claim and transfer ETH to the owner", async function () {
      const { phrNFT, deployer } = await loadFixture(deployPHRNFTFixture);

      const encryptedData = "encryptedDataHash";
      const icd10Code = "A00";

      const mintTx = await phrNFT.mint(deployer.address, encryptedData, icd10Code);
      await mintTx.wait();

      const tokenId = 0;

      // Simulate Chainlink fulfillClaim call
      const claimable = true;
      const claimAmount = ethers.parseEther("1.0");

      const fulfillTx = await phrNFT.fulfillClaim(
        ethers.hexlify(ethers.toUtf8Bytes("requestId")),
        tokenId,
        claimable,
        claimAmount
      );
      await fulfillTx.wait();

      // Check deployer's balance (assume initial balance was 10000 ETH for this test)
      const balance = await ethers.provider.getBalance(deployer.address);
      expect(balance).to.be.gt(ethers.parseEther("10000"));
    });

    it("Should revert if the claim is not valid", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);

      const claimable = false;
      const claimAmount = ethers.parseEther("1.0");

      await expect(
        phrNFT.fulfillClaim(
          ethers.hexlify(ethers.toUtf8Bytes("requestId")),
          0,
          claimable,
          claimAmount
        )
      ).to.be.revertedWith("PHRNFT: Claim is not valid");
    });
  });
});