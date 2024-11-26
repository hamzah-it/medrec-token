const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { encodeBytes32String, parseEther, ZeroAddress } = require("ethers");

module.exports = buildModule("PHRNFTModule", (m) => {
  // Dummy oracle configuration
  const oracleAddress = ZeroAddress; // Replace with actual oracle address if available
  const jobId = encodeBytes32String("testJob"); // Correct encoding for Ethers v6
  const fee = parseEther("0.1"); // Fee in LINK tokens
  const linkTokenAddress = ZeroAddress; // Replace with actual LINK token address

  // Deploy the PHRNFT contract with constructor arguments
  const phrNFT = m.contract("PHRNFT", [oracleAddress, jobId, fee, linkTokenAddress]);

  return { phrNFT };
});
