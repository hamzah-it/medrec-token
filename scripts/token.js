const hre = require("hardhat");

async function main() {
    const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; // Ganti dengan alamat kontrak
    const PHRNFT = await hre.ethers.getContractAt("PHRNFT", contractAddress);

    const tokenId = 0; // Ganti dengan ID token yang ingin Anda lihat

    // Mendapatkan data rekam medis (encryptedData)
    const encryptedData = await PHRNFT.getMedicalRecord(tokenId);
    console.log(`Encrypted Data for Token ${tokenId}:`, encryptedData);

    // Mendapatkan URI metadata token
    const tokenURI = await PHRNFT.tokenURI(tokenId);
    console.log(`Token URI for Token ${tokenId}:`, tokenURI);

    const icd10Code = (await PHRNFT.medRecords(tokenId)).icd10Code;
    console.log(`ICD-10 Code for Token ${tokenId}:`, icd10Code);

    const owner = await PHRNFT.ownerOf(tokenId);
    console.log(`Owner of Token ${tokenId}:`, owner);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
