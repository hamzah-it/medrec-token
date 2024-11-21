// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC165 {
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
}

interface IERC721 is IERC165 {
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract ERC721 is IERC721 {
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed id
    );

    mapping(uint256 => address) internal _ownerOf;
    mapping(address => uint256) internal _balanceOf;

    function supportsInterface(
        bytes4 interfaceId
    ) external pure returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "owner = zero address");
        return _balanceOf[owner];
    }

    function ownerOf(
        uint256 tokenId
    ) external view override returns (address owner) {
        owner = _ownerOf[tokenId];
        require(owner != address(0), "token doesn't exist");
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "mint to zero address");
        require(_ownerOf[tokenId] == address(0), "already minted");

        _balanceOf[to]++;
        _ownerOf[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) external view virtual override returns (string memory) {}
}

contract PHRNFT is ERC721 {
    struct MedRec {
        string dataHash;
        string icd10Code;
    }

    mapping(uint256 => MedRec) public medRecords;
    mapping(uint256 => string) private _tokenURIs;

    address public contractOwner;
    uint256 public tokenCounter;

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "not contract owner");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
    }

    function mint(
        address to,
        string memory dataHash,
        string memory _tokenURI,
        string memory icd10Code
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter;
        _mint(to, tokenId);
        _tokenURIs[tokenId] = _tokenURI;

        medRecords[tokenId] = MedRec({
            dataHash: dataHash,
            icd10Code: icd10Code
        });

        tokenCounter++;
        return tokenId;
    }

    function getMedicalRecord(uint256 tokenId) public view returns (string memory) {
        return medRecords[tokenId].dataHash;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_ownerOf[tokenId] != address(0), "token doesn't exist");
        return _tokenURIs[tokenId];
    }
}