// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PHRNFT
 * @dev ERC721 NFT for Personal Health Records (PHR) with associated metadata.
 */
contract PHRNFT is ERC721, Ownable {
    /// @dev Structure to store medical record metadata
    struct MedRec {
        string encryptedData; // Encrypted medical data (e.g., IPFS hash)
        string icd10Code;     // ICD-10 diagnosis code
    }

    /// @dev Mapping from token ID to medical records
    mapping(uint256 => MedRec) private _medRecords;

    /// @dev Counter for token IDs
    uint256 private _tokenCounter;

    /**
     * @dev Constructor to initialize the NFT collection with name and symbol.
     */
    constructor() ERC721("Personal Health Record NFT", "PHRNFT") {}

    /**
     * @notice Mint a new token with associated medical record metadata.
     * @param to Address to receive the token.
     * @param encryptedData Encrypted medical data stored off-chain (e.g., IPFS).
     * @param icd10Code ICD-10 diagnosis code associated with the record.
     * @return tokenId The ID of the minted token.
     */
    function mint(
        address to,
        string memory encryptedData,
        string memory icd10Code
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "PHRNFT: mint to the zero address");

        uint256 tokenId = _tokenCounter;

        // Mint the token to the recipient
        _safeMint(to, tokenId);

        // Store medical record metadata
        _medRecords[tokenId] = MedRec({
            encryptedData: encryptedData,
            icd10Code: icd10Code
        });

        // Increment the token ID counter
        _tokenCounter++;

        return tokenId;
    }

    /**
     * @notice Retrieve medical record metadata for a specific token ID.
     * @param tokenId The ID of the token to query.
     * @return encryptedData The encrypted medical data.
     * @return icd10Code The ICD-10 diagnosis code.
     */
    function getMedicalRecord(
        uint256 tokenId
    ) external view returns (string memory encryptedData, string memory icd10Code) {
        require(_exists(tokenId), "PHRNFT: token does not exist");
        MedRec memory record = _medRecords[tokenId];
        return (record.encryptedData, record.icd10Code);
    }
}