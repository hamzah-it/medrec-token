// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ClaimOracle {
    // Events
    event ClaimRequested(uint256 indexed tokenId, string data, address requester);
    event ClaimFulfilled(uint256 indexed tokenId, bool claimable, uint256 claimAmount, address owner);

    // Mapping for pending claims
    mapping(uint256 => address) private claimRequesters;
    mapping(uint256 => uint256) private claimAmounts;

    // Fee required to process a claim (in SepoliaETH)
    uint256 public claimFee = 0.01 ether; // Example fee, adjust as needed

    /// @notice Request a claim for a token ID
    /// @param tokenId The token ID for the claim
    /// @param data The encrypted medical data
    function requestClaim(uint256 tokenId, string calldata data) external payable {
        require(msg.value == claimFee, "Insufficient claim fee");
        require(claimRequesters[tokenId] == address(0), "Claim already in progress");

        // Log the request
        claimRequesters[tokenId] = msg.sender;

        emit ClaimRequested(tokenId, data, msg.sender);
    }

    /// @notice Fulfill a claim request
    /// @param tokenId The token ID for the claim
    /// @param claimable Whether the claim is valid
    /// @param claimAmount The amount of SepoliaETH to transfer if valid
    function fulfillClaim(
        uint256 tokenId,
        bool claimable,
        uint256 claimAmount
    ) external {
        address requester = claimRequesters[tokenId];
        require(requester != address(0), "No claim request found");

        // Remove the request from mapping
        delete claimRequesters[tokenId];

        if (claimable) {
            require(address(this).balance >= claimAmount, "Insufficient contract balance");
            (bool success, ) = requester.call{value: claimAmount}("");
            require(success, "Transfer failed");
        }

        emit ClaimFulfilled(tokenId, claimable, claimAmount, requester);
    }

    /// @notice Withdraw contract balance
    /// @param to The address to send the balance to
    /// @param amount The amount to withdraw
    function withdraw(address to, uint256 amount) external {
        require(to != address(0), "Invalid address");
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdraw failed");
    }

    /// @notice Update the claim fee
    /// @param newFee The new fee amount (in SepoliaETH)
    function updateClaimFee(uint256 newFee) external {
        claimFee = newFee;
    }

    // Fallback function to accept ETH
    receive() external payable {}
}
