// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC721 {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);
}

interface IClaimOracle {
    function requestClaim(
        uint256 tokenId,
        string memory icd10Code
    ) external payable returns (bytes32);
}

contract PHRNFT is IERC721 {
    struct MedRec {
        string encryptedData; // Encrypted CID that stores phr.json
        string icd10Code;
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => MedRec) private _medRecords;

    uint256 private _tokenCounter;

    address public immutable claimOracle;

    event ClaimProcessed(uint256 indexed tokenId, uint256 claimAmount, address owner);

    constructor(address _claimOracle) {
        claimOracle = _claimOracle;
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

    function requestClaim(uint256 tokenId) public payable {
        require(_exists(tokenId), "PHRNFT: token does not exist");

        MedRec memory record = _medRecords[tokenId];

        // Call ClaimOracle contract to request claim
        IClaimOracle(claimOracle).requestClaim{value: msg.value}(
            tokenId,
            record.icd10Code
        );
    }

    function processClaim(
        uint256 tokenId,
        bool claimable,
        uint256 claimAmount
    ) external {
        require(msg.sender == claimOracle, "PHRNFT: Only oracle can process");
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