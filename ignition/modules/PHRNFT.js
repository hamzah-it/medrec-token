// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PHRNFTModule", (m) => {
  // Define the contract deployment
  const phrNFT = m.contract("PHRNFT", []); // No constructor arguments required

  return { phrNFT }; // Return deployed contract
});
