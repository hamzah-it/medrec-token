const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; // Ganti dengan alamat kontrak Anda
  const PHRNFT = await hre.ethers.getContractAt("PHRNFT", contractAddress);

  const ownerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Ganti dengan address yang ingin diperiksa

  // Ambil semua log Transfer
  const transferEvents = await PHRNFT.queryFilter("Transfer");
  const ownedTokens = [];

  transferEvents.forEach((event) => {
    const { from, to, id } = event.args;

    // Jika token di-transfer ke ownerAddress, tambahkan ke daftar
    if (to === ownerAddress) {
      ownedTokens.push(id.toString());
    }

    // Jika token di-transfer dari ownerAddress, hapus dari daftar
    if (from === ownerAddress) {
      const index = ownedTokens.indexOf(id.toString());
      if (index > -1) {
        ownedTokens.splice(index, 1);
      }
    }
  });

  console.log(`Tokens owned by ${ownerAddress}:`, ownedTokens);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
