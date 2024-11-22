const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("PHRNFT Contract", function () {
  // Fixture to deploy the PHRNFT contract
  async function deployPHRNFTFixture() {
    // Get accounts
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy contract
    const PHRNFT = await ethers.getContractFactory("PHRNFT");
    const phrNFT = await PHRNFT.deploy();
    await phrNFT.waitForDeployment();

    return { phrNFT, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the contract owner on deployment", async function () {
      const { phrNFT, owner } = await loadFixture(deployPHRNFTFixture);

      expect(await phrNFT.contractOwner()).to.equal(owner.address);
    });

    it("Should start with a tokenCounter of 0", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);

      expect(await phrNFT.tokenCounter()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token and assign it to the correct owner", async function () {
      const { phrNFT, owner } = await loadFixture(deployPHRNFTFixture);

      const recipient = owner.address;
      const encryptedData = "encryptedDataHash";
      const tokenURI = "ipfs://token-metadata";
      const icd10Code = "A00";

      // Mint token
      const tx = await phrNFT.mint(recipient, encryptedData, tokenURI, icd10Code);
      await tx.wait();

      // Verify token ownership and metadata
      const tokenId = 0;
      expect(await phrNFT.ownerOf(tokenId)).to.equal(recipient);
      expect(await phrNFT.getMedicalRecord(tokenId)).to.equal(encryptedData);
      expect(await phrNFT.tokenURI(tokenId)).to.equal(tokenURI);
      expect((await phrNFT.medRecords(tokenId)).icd10Code).to.equal(icd10Code);
    });

    it("Should increment the tokenCounter after minting", async function () {
      const { phrNFT, owner } = await loadFixture(deployPHRNFTFixture);

      const recipient = owner.address;
      const encryptedData = "encryptedDataHash";
      const tokenURI = "ipfs://token-metadata";
      const icd10Code = "A00";

      await phrNFT.mint(recipient, encryptedData, tokenURI, icd10Code);

      expect(await phrNFT.tokenCounter()).to.equal(1);
    });

    it("Should revert if a non-owner tries to mint a token", async function () {
      const { phrNFT, otherAccount } = await loadFixture(deployPHRNFTFixture);

      const recipient = otherAccount.address;
      const encryptedData = "encryptedDataHash";
      const tokenURI = "ipfs://token-metadata";
      const icd10Code = "A00";

      await expect(
        phrNFT.connect(otherAccount).mint(recipient, encryptedData, tokenURI, icd10Code)
      ).to.be.revertedWith("not contract owner");
    });
  });

  describe("Accessing Medical Records", function () {
    it("Should return the correct encrypted data for a token ID", async function () {
      const { phrNFT, owner } = await loadFixture(deployPHRNFTFixture);

      const recipient = owner.address;
      const encryptedData = "encryptedDataHash";
      const tokenURI = "ipfs://token-metadata";
      const icd10Code = "A00";

      await phrNFT.mint(recipient, encryptedData, tokenURI, icd10Code);

      const tokenId = 0;
      expect(await phrNFT.getMedicalRecord(tokenId)).to.equal(encryptedData);
    });

    it("Should revert when accessing data for a non-existent token", async function () {
      const { phrNFT } = await loadFixture(deployPHRNFTFixture);

      await expect(phrNFT.getMedicalRecord(999)).to.be.revertedWith("token doesn't exist");
    });
  });
});