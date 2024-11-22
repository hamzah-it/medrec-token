const hre = require("hardhat");

async function main() {
  // Ganti dengan alamat kontrak Anda yang sudah dideploy
  const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

  // Ambil kontrak PHRNFT
  const PHRNFT = await hre.ethers.getContractAt("PHRNFT", contractAddress);

  // Baca nilai tokenCounter
  const tokenCounter = await PHRNFT.tokenCounter();
  console.log("Token Counter:", tokenCounter.toString());

  // Anda juga bisa memeriksa owner kontrak
  const contractOwner = await PHRNFT.contractOwner();
  console.log("Contract Owner:", contractOwner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
