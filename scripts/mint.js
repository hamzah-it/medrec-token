const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; // Alamat kontrak PHRNFT
  const PHRNFT = await hre.ethers.getContractAt("PHRNFT", contractAddress);

  const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const encryptedData = "0x123abc456def";
  const tokenURI =
    "https://dweb.link/ipfs/QmP3tB84o7M4yda5SwZJWM8gmBio6X98N4yxVB6zV5WxJA";
  const icd10Code = "A00";

  console.log("Minting token...");

  try {
    // Mint token
    const mintTx = await PHRNFT.mint(
      recipient,
      encryptedData,
      tokenURI,
      icd10Code
    );

    // Wait for transaction to be mined
    const receipt = await mintTx.wait();

    console.log("Token minted!");
    console.log("Transaction hash:", mintTx.hash); // Ambil hash dari mintTx

    // Check tokenCounter
    const tokenCounter = await PHRNFT.tokenCounter();
    console.log("Current Token Counter:", tokenCounter.toString());
  } catch (error) {
    console.error("Error during minting:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
