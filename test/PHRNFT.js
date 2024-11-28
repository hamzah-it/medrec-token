const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PHRNFT", function () {
  let PHRNFT, phrNFT, owner, user, addr1;

  beforeEach(async function () {
    // Deploy the PHRNFT contract
    PHRNFT = await ethers.getContractFactory("PHRNFT");
    [owner, user, addr1] = await ethers.getSigners();
    phrNFT = await PHRNFT.deploy(ethers.ZeroAddress); // Use dummy address for claimOracle
    await phrNFT.waitForDeployment();
  });

  it("should mint an NFT and assign it to the correct owner", async function () {
    const tokenId = await phrNFT.tokenCounter();
    const encryptedData = "encryptedCID123";
    const icd10Code = "A00.0";

    // Mint the NFT
    const tx = await phrNFT.connect(owner).mint(user.address, encryptedData, icd10Code);
    await tx.wait();

    // Validate the owner and medical record
    expect(await phrNFT.ownerOf(tokenId)).to.equal(user.address);
    expect(await phrNFT.balanceOf(user.address)).to.equal(1);

    const record = await phrNFT.getMedicalRecord(tokenId);
    expect(record[0]).to.equal(encryptedData);
    expect(record[1]).to.equal(icd10Code);
  });

  it("should return the correct tokenCounter value", async function () {
    // Initially tokenCounter should be 0
    expect(await phrNFT.tokenCounter()).to.equal(0);

    // Mint an NFT
    await phrNFT.connect(owner).mint(user.address, "encryptedCID123", "A00.0");

    // TokenCounter should increase by 1
    expect(await phrNFT.tokenCounter()).to.equal(1);
  });

  it("should correctly report the owner of a token", async function () {
    const tokenId = await phrNFT.tokenCounter();

    // Mint the NFT
    await phrNFT.connect(owner).mint(user.address, "encryptedCID123", "A00.0");

    // Validate the owner
    expect(await phrNFT.ownerOf(tokenId)).to.equal(user.address);
  });

  it("should revert if querying the owner of a nonexistent token", async function () {
    const tokenId = 999; // Nonexistent token ID
    await expect(phrNFT.ownerOf(tokenId)).to.be.revertedWith("PHRNFT: owner query for nonexistent token");
  });

  it("should revert if minting to the zero address", async function () {
    const encryptedData = "encryptedCID123";
    const icd10Code = "A00.0";

    // Attempt to mint to the zero address
    await expect(
      phrNFT.connect(owner).mint(ethers.ZeroAddress, encryptedData, icd10Code)
    ).to.be.revertedWith("PHRNFT: mint to the zero address");
  });

  it("should correctly report balanceOf for a user", async function () {
    // Mint two NFTs to the same user
    await phrNFT.connect(owner).mint(user.address, "encryptedCID1", "A00.1");
    await phrNFT.connect(owner).mint(user.address, "encryptedCID2", "A00.2");

    // Validate the balance
    expect(await phrNFT.balanceOf(user.address)).to.equal(2);
  });

  it("should revert if querying balanceOf for the zero address", async function () {
    await expect(phrNFT.balanceOf(ethers.ZeroAddress)).to.be.revertedWith(
      "PHRNFT: balance query for zero address"
    );
  });

  it("should correctly store and retrieve medical records", async function () {
    const tokenId = await phrNFT.tokenCounter();
    const encryptedData = "encryptedCID123";
    const icd10Code = "A00.0";

    // Mint the NFT
    await phrNFT.connect(owner).mint(user.address, encryptedData, icd10Code);

    // Retrieve the medical record
    const record = await phrNFT.getMedicalRecord(tokenId);
    expect(record[0]).to.equal(encryptedData);
    expect(record[1]).to.equal(icd10Code);
  });

  it("should revert if querying medical record for a nonexistent token", async function () {
    const tokenId = 999; // Nonexistent token ID
    await expect(phrNFT.getMedicalRecord(tokenId)).to.be.revertedWith("PHRNFT: token does not exist");
  });
});