// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdeaToken.sol";

contract Idea {
    
    // Reference to the IdeaToken (ERC-20) contract.
    IdeaToken public ideaToken;
    
    // The address that created the idea.
    address public owner;

    // Username of the idea creator.
    string public ownerUsername;

    // Mapping to track staked amounts for each user.
    mapping(address => Staker) public stakers;

    // Total amount staked to this idea.
    uint256 public totalStaked;

    // Timestamp when staking ends.
    uint256 public stakingEndTime;

    // Event emitted when a user stakes tokens.
    event Staked(string username, address indexed staker, uint256 amount);
    // Event emitted when staking is ended and tokens are transferred to the owner.
    event StakingEnded(address indexed owner, uint256 amount);

    // Represent stakers
    struct Staker { 
        string username; 
        uint256 amount; 
    }

    /**
     * @notice Constructor sets the owner, the IdeaToken reference, the creator's username, and the staking duration.
     * @param _owner The address of the idea creator.
     * @param _ideaToken The IdeaToken contract address.
     * @param _username The username of the idea creator.
     * @param _stakingDuration The duration (in seconds) that staking is allowed.
     */
    constructor(address _owner, IdeaToken _ideaToken, string memory _username, uint256 _stakingDuration) {
        owner = _owner;
        ideaToken = _ideaToken;
        ownerUsername = _username;
        stakingEndTime = block.timestamp + _stakingDuration;
    }

    /**
     * @notice Allows a user to stake tokens.
     * @param username A string representing the staker's username.
     * @param amount The amount of tokens to stake.
     */
    function stakeTokens(string memory username, uint256 amount) public {
        
        require(block.timestamp < stakingEndTime, "Staking period has expired");
        require(amount > 0, "Stake amount must be greater than zero");

        // Transfer tokens from the staker to this contract.
        require(
            ideaToken.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        // Record the staked amount for the staker.
        stakers[msg.sender].amount += amount;

        totalStaked += amount;

        // Emit the staking event.
        emit Staked(username, msg.sender, amount);
    }

    /**
     * @notice Returns the staked token amount for a given user or 0 if the user doesnt exist.
     * @param user The address of the user.
     * @return The amount of tokens the user has staked.
     */
    function getStakedAmount(address user) public view returns (uint256) {
        return stakers[user].amount;
    }

    /**
     * @notice Returns the total staked tokens.
     * @return uint256 total amount staked so far.
     * 
     */
    function getTotalStaked() public view returns (uint256) {
        return totalStaked;
    }
     /**
      * @notice returns the owners blockchain address
      * @return address address of owners blockchain address
      */
    function getOwnerAddress() public view returns (address) {
        return owner;
    }

    /**
     * @notice Ends the staking period and transfers all staked tokens to the idea creator.
     *
     * Requirements:
     * - Only the owner can call this function.
     * - The staking period must have ended (time limit reached).
     * - Staking must not have already ended.
     */
    function endStaking() public {
        
        require(msg.sender == owner, "Only owner can end staking");
        require(block.timestamp >= stakingEndTime, "Staking period not ended yet");

        // Get the total token balance held by this contract.
        uint256 balance = ideaToken.balanceOf(address(this));

        // Transfer all tokens to the idea creator.
        require(
            ideaToken.transfer(owner, balance),
            "Transfer to owner failed"
        );

        // Emit the staking ended event.
        emit StakingEnded(owner, balance);
    }

}
