// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

interface IERC721 {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);
}

contract PHRNFT is IERC721, ChainlinkClient {
    using Chainlink for Chainlink.Request;

    struct MedRec {
        string encryptedData; // Encrypted medical data (e.g., IPFS hash)
        string icd10Code; // ICD-10 diagnosis code
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => MedRec) private _medRecords;

    uint256 private _tokenCounter;

    // Chainlink variables
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    event ClaimProcessed(uint256 indexed tokenId, uint256 claimAmount, address owner);

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _link) {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        _setChainlinkToken(_link);
    }

    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "PHRNFT: balance query for zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "PHRNFT: owner query for nonexistent token");
        return owner;
    }

    function mint(
        address to,
        string calldata encryptedData,
        string calldata icd10Code
    ) external returns (uint256) {
        require(to != address(0), "PHRNFT: mint to the zero address");

        uint256 tokenId = _tokenCounter;
        _owners[tokenId] = to;
        _balances[to]++;
        _medRecords[tokenId] = MedRec(encryptedData, icd10Code);

        emit Transfer(address(0), to, tokenId);

        unchecked {
            _tokenCounter++;
        }

        return tokenId;
    }

    function getMedicalRecord(
        uint256 tokenId
    ) external view returns (string memory, string memory) {
        require(_exists(tokenId), "PHRNFT: token does not exist");
        MedRec memory record = _medRecords[tokenId];
        return (record.encryptedData, record.icd10Code);
    }

    function requestClaim(uint256 tokenId) public returns (bytes32 requestId) {
        require(_exists(tokenId), "PHRNFT: token does not exist");

        MedRec memory record = _medRecords[tokenId];
        Chainlink.Request memory request = _buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillClaim.selector
        );

        // Pass icd10Code and tokenId to the oracle
        request._add("icd10Code", record.icd10Code);
        request._addUint("tokenId", tokenId);

        // Send request to Chainlink Oracle
        return _sendChainlinkRequestTo(oracle, request, fee);
    }

    function fulfillClaim(
        bytes32 _requestId,
        uint256 tokenId,
        bool claimable,
        uint256 claimAmount
    ) public recordChainlinkFulfillment(_requestId) {
        require(_exists(tokenId), "PHRNFT: token does not exist");
        require(claimable, "PHRNFT: Claim is not valid");

        address owner = _owners[tokenId];
        (bool success, ) = owner.call{value: claimAmount}("");
        require(success, "PHRNFT: Transfer failed");

        emit ClaimProcessed(tokenId, claimAmount, owner);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(IERC721).interfaceId;
    }

    function tokenCounter() external view returns (uint256) {
        return _tokenCounter;
    }

    receive() external payable {}
}