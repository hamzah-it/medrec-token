const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ClaimOracleModule", (m) => {
  // Deploy the ClaimOracle contract
  const claimOracle = m.contract("ClaimOracle");

  return { claimOracle };
});