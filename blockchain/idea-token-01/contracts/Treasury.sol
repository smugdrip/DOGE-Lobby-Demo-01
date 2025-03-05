// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdeaToken.sol";

// Manage the storage of IdeaTokens send to DOGE Lobby as payment
contract Treasury {
    
    IdeaToken public ideaToken;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * Set the address for the IdeaToken contract
     * Required because this contract must be deployed first, because the idea 
     * token constructor mints to this address.
     * @param _ideaToken the address of the IdeaToken contract after deployment
     */
    function setToken(IdeaToken _ideaToken) public {
        require(msg.sender == owner, "Only owner can set token");
        require(address(ideaToken) == address(0), "Token already set");
        ideaToken = _ideaToken;
    }

    /**
     * @notice Deposits tokens into the treasury.
     * @param amount The amount of tokens to deposit.
     */
    function deposit(uint256 amount) public {
        // Transfer tokens from the caller to the treasury.
        require(address(ideaToken) != address(0), "Token not set");
        require(ideaToken.transferFrom(msg.sender, address(this), amount), "Treasury: deposit failed");
    }

    /**
     * @notice Withdraws tokens from the treasury to a destination address.
     * @param amount The amount of tokens to withdraw.
     * @param destination The address to receive the tokens.
     */
    function withdraw(uint256 amount, address destination) public {
        require(address(ideaToken) != address(0), "Token not set");
        require(msg.sender == owner, "Treasury: only owner can withdraw");
        require(ideaToken.transfer(destination, amount), "Treasury: withdrawal failed");
    }
}
