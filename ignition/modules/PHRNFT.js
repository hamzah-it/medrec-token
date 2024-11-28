const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PHRNFTModule", (m) => {
  const claimOracleAddress = "0x368A2D078e507e71bABDAb114aBDD750ff03e953"; // Alamat ClaimOracle

  const phrNFT = m.contract("PHRNFT", [claimOracleAddress]);

  return { phrNFT };
});
