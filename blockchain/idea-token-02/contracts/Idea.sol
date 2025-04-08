// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IdeaToken.sol";

/**
 * @title Idea
 * @notice Manages an Idea with staking, voting, and governance.
 * 
 */
contract Idea {

    enum StatusOption { 
        End,    // 0
        Cancel, // 1
        Extend  // 2
    }

    struct HasVoted {
        bool hasVoted0;
        bool hasVoted1; 
        bool hasVoted2; 
        bool hasVoted3; 
    }

    struct StatusVoteData {
        int128 endVotes;
        int128 cancelVotes;
        int128 extendVotes;
        StatusOption winningStatus;
        int128 winningStatusVoteCount;
        int16 extensionCount;
        uint256 thresholdTime;

    }

    struct ProposalView {
        int128 commentID;
        int128 tokenVoteCount;
    }

    struct ProposalVoteData {
        Proposal[] proposals;
        mapping(int128 => int128) proposalIndexes;
        ProposalView winningProposal;
    }

    struct Proposal {
        int128 commentID;
        int128 tokenVoteCount;
        mapping(address => int128) tokenVotesPerStaker;
    }

    struct Staker {
        int128 amountStaked;
        bool canceledStake;
        int128 totalTokenVotes;
        HasVoted hasVoted;
    }
    
    error TimeExpired(string, uint256);
    error InvalidProposalVote(string, int128);
    error InvalidStatusVote(string, int128);

    event Staked(address indexed staker, int128 amount);
    event ProposalAdded(int128 commentID);
    event StatusVoteStarted(string msg);
    event StatusVoted(address indexed voter, StatusOption option, int128 newVoteCount);
    event StatusVoteEnded(StatusOption winningOption, uint256 finalTime);
    event ProposalVoted(address voter, int128 commentID, int128 voteDelta);
    event IdeaExtended(uint256 extensionLength);

    IdeaToken private ideaToken;
    address private ownerAddress;
    mapping(address => Staker) private stakers;
    int128 private totalStaked;
    uint256 private ideaDuration;
    uint256 private ideaStartTime;
    uint256 private ideaEndTime;
    bool private ideaCanceled;
    bool private ideaEnded;
    
    bool private statusVoteActive;
    StatusVoteData private statusVote;
    
    bool private proposalVoteActive;
    ProposalVoteData private proposalVote;

    /**
     * @dev Constructor
     */
    constructor(address _ownerAddress, IdeaToken _ideaToken, uint256 _ideaDuration) {
        ownerAddress = _ownerAddress;
        ideaToken = _ideaToken;
        ideaDuration = _ideaDuration;
        ideaStartTime = block.timestamp;
        ideaEndTime   = block.timestamp + _ideaDuration;
        statusVote.thresholdTime = ideaStartTime + (_ideaDuration * 80) / 100;
        statusVote.extensionCount = -1;
        proposalVoteActive = true;
        statusVoteActive = false;
        ideaCanceled = false;
        ideaEnded = false;
        totalStaked = 0;
    }
    
    /**
     * @notice Stake tokens to the idea.
     *         The idea must be active (not ended or canceled).
     *         This version uses ERC-2612 permit to set token allowance in one transaction.
     * @param amount The amount of tokens to stake.
     * @param deadline The timestamp until which the permit is valid.
     * @param v The recovery byte of the permit signature.
     * @param r Half of the permit signature.
     * @param s Half of the permit signature.
     */
    function stakeTokens(uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        
        require(!ideaEnded && !ideaCanceled && !statusVoteActive && block.timestamp < ideaEndTime, "Staking not active");
        require(amount > 0, "Must stake more than 0 tokens.");
        require(!stakers[msg.sender].canceledStake, "Stake already canceled");

        ideaToken.permit(msg.sender, address(this), amount, deadline, v, r, s);

        require(
            ideaToken.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        int128 sAmount = int128(uint128(amount));

        stakers[msg.sender].amountStaked += sAmount;
        totalStaked += sAmount;

        emit Staked(msg.sender, sAmount);
    }


    /**
     * @notice Withdraw staked tokens.
     *         - If the idea is canceled, any staker may withdraw.
     *         - If the idea is active, only stakers who have opted out (canceledStake = true)
     *           via voting Cancel can withdraw.
     */
    function withdrawStake() external {
        
        int128 amount = stakers[msg.sender].amountStaked;
        require(amount > 0, "No stake to withdraw");

        if (!ideaCanceled) {
            require(stakers[msg.sender].canceledStake, "Not eligible for withdrawal");
        }

        stakers[msg.sender].amountStaked = 0;
        stakers[msg.sender].canceledStake = true;
        totalStaked = totalStaked - amount;

        uint256 tAmount = uint256(uint128(amount));

        require(ideaToken.transfer(msg.sender, tAmount),"Transfer failed");
    }

    /**
     * function so the idea creator can get the tokens after the idea ends.
     * Only works if the idea has ended after a status vote.
     */
    function ownerWithdraw() external {
        
        require(msg.sender == ownerAddress, "only owner can call this.");
        require(ideaEnded && block.timestamp > ideaEndTime, "idea hasnt ended.");

        uint256 tAmount = uint256(uint128(totalStaked));

        require(ideaToken.transfer(ownerAddress, tAmount), "Transfer to owner failed");

        totalStaked = 0;

    }

    /**
     * @notice Start a Status Vote.
     *         Conditions:
     *           - The idea must be active.
     *           - The current time must be past the threshold (last 20% of duration).
     *           - Proposal voting is locked.
     */
    function startStatusVote() external {

        require(!ideaCanceled && !ideaEnded && !statusVoteActive && block.timestamp < ideaEndTime, "Cannot create Status Vote.");

        require(stakers[msg.sender].amountStaked > 0 && !stakers[msg.sender].canceledStake, "Must have a stake to start status vote.");

        require(block.timestamp >= statusVote.thresholdTime, "Wait before starting Status Vote.");

        proposalVoteActive = false;
        statusVoteActive = true;

        statusVote.endVotes = 0;
        statusVote.cancelVotes = 0;
        statusVote.extendVotes = 0;
        statusVote.winningStatus = StatusOption.Extend;
        statusVote.winningStatusVoteCount = 0;

        statusVote.extensionCount += 1;

        emit StatusVoteStarted("Status vote started");
    }

    /**
     * @notice Cast a vote on the idea's status: End, Cancel, or Extend.
     */
    function voteOnStatus(StatusOption option) external {
        
        require(!ideaCanceled && !ideaEnded &&  block.timestamp > statusVote.thresholdTime && block.timestamp < ideaEndTime, "Cannot vote on Status Vote.");

        require(statusVoteActive, "Please start the status vote.");
        
        require(stakers[msg.sender].amountStaked > 0 && !stakers[msg.sender].canceledStake, "Must have stake to vote");

        int16 extPeriod = statusVote.extensionCount;

        if (extPeriod == 0) {
            require(!stakers[msg.sender].hasVoted.hasVoted0);
            stakers[msg.sender].hasVoted.hasVoted0 = true;
        } else if (extPeriod == 1) {
            require(!stakers[msg.sender].hasVoted.hasVoted1);
            stakers[msg.sender].hasVoted.hasVoted1 = true;
        } else if (extPeriod == 2) {
            require(!stakers[msg.sender].hasVoted.hasVoted2);
            stakers[msg.sender].hasVoted.hasVoted2 = true;
        } else if (extPeriod == 3) {
            require(!stakers[msg.sender].hasVoted.hasVoted3);
            stakers[msg.sender].hasVoted.hasVoted3 = true;
        } else {
            revert InvalidStatusVote("Invalid vote period", 4);
        }
        
        if (option == StatusOption.End) {
            statusVote.endVotes += 1;
            if (statusVote.endVotes > statusVote.winningStatusVoteCount) {
                statusVote.winningStatus = StatusOption.End;
                statusVote.winningStatusVoteCount = statusVote.endVotes;
            }
            emit StatusVoted(msg.sender, option, statusVote.endVotes);
        } else if (option == StatusOption.Cancel) {
            statusVote.cancelVotes += 1;
            if (statusVote.cancelVotes > statusVote.winningStatusVoteCount) {
                statusVote.winningStatus = StatusOption.Cancel;
                statusVote.winningStatusVoteCount = statusVote.cancelVotes;
            }
            stakers[msg.sender].canceledStake = true;
            emit StatusVoted(msg.sender, option, statusVote.cancelVotes);
        } else if (option == StatusOption.Extend) {
            statusVote.extendVotes += 1;
            if (statusVote.extendVotes > statusVote.winningStatusVoteCount) {
                statusVote.winningStatus = StatusOption.Extend;
                statusVote.winningStatusVoteCount = statusVote.extendVotes;
            }
            emit StatusVoted(msg.sender, option, statusVote.extendVotes);
        } else {
            revert InvalidStatusVote("Invalid vote opion", 1);
        }
    }

    /**
     * @dev Extend the idea.
     *      - 1st extension: 50% of ideaDuration.
     *      - 2nd extension: 35% of ideaDuration.
     *      - 3rd extension: 20% of ideaDuration.
     *      - 4th extension: Cancels the idea.
     *      Updates the threshold for the next status vote and reopens proposal voting.
     */
    function extendIdea() internal {
        
        if (statusVote.extensionCount >= 3) {
            ideaCanceled = true;
            return;
        }

        uint256 extensionPeriod;
        if (statusVote.extensionCount == 0) {
            extensionPeriod = (ideaDuration * 75) / 100;
        } else if (statusVote.extensionCount == 1) {
            extensionPeriod = (ideaDuration * 50) / 100;
        } else if (statusVote.extensionCount == 2) {
            extensionPeriod = (ideaDuration * 25) / 100;
        }
        statusVote.extensionCount += 1;

        ideaEndTime += extensionPeriod;
        // Set the new threshold to 80% of the extension period remaining.
        statusVote.thresholdTime = ideaEndTime - ((extensionPeriod * 20) / 100);
        proposalVoteActive = true;
        statusVoteActive = false;

        statusVote.cancelVotes = 0;
        statusVote.endVotes = 0;
        statusVote.extendVotes = 0;
        statusVote.winningStatus = StatusOption.Extend;
        statusVote.winningStatusVoteCount = 0;

        emit IdeaExtended(extensionPeriod);

    }

    /**
     * @notice Try to end the active Status Vote.
     */
    function endStatusVote() external {
        
        require(statusVoteActive, "No active status vote.");
        require(block.timestamp > ideaEndTime, "Status vote still ongoing.");

        statusVoteActive = false;

        int128 nonCanceledVotes = statusVote.endVotes + statusVote.extendVotes;

        if ( nonCanceledVotes == 0) {
            ideaCanceled = true;
            emit StatusVoteEnded(statusVote.winningStatus, block.timestamp);
            return;
        }

        // decide if enough voters voted to end the idea.
        bool canEnd = false;
        if ( nonCanceledVotes == 1 && statusVote.endVotes == 1 ) {
            canEnd = true;
        } else if (nonCanceledVotes == 2 && statusVote.endVotes >= 1) {
            canEnd = true;
        } else if (nonCanceledVotes == 3 && statusVote.endVotes >= 2) {
            canEnd = true;
        } else if (nonCanceledVotes >= 4 && ((statusVote.endVotes * 100) / nonCanceledVotes) >= 75) {
            canEnd = true;
        }

        
        if (canEnd) {
            ideaEnded = true;
        } else if (nonCanceledVotes > 0) {
            extendIdea();
        } else {
            ideaCanceled = true;
        }

        emit StatusVoteEnded(statusVote.winningStatus, block.timestamp);
    }

    /**
     * Nominate a comment with the specified ID as a proposal in the vote.
     * The nominated comment can be voted on in voteOnProposal
     * @param commentID the unique id for this comment.
     * 
     */
    function nominateComment(int128 commentID) external {
        
        require(
            proposalVoteActive && !statusVoteActive && !ideaCanceled && !ideaEnded && block.timestamp < ideaEndTime,
            "Proposal voting not active."
        );

        require(
            stakers[msg.sender].amountStaked > 0 && !stakers[msg.sender].canceledStake,
            "Must have a stake in the idea."
        );

        // If the index is 0, we assume its unique
        require(proposalVote.proposalIndexes[commentID] == 0, "Proposal already exists.");

        proposalVote.proposals.push();

        // get the actual index
        uint256 newIndex = proposalVote.proposals.length - 1;

        // store the index in the index mapping as index + 1, in case its 0.
        proposalVote.proposalIndexes[commentID] = int128(int256(newIndex + 1));

        // store the proposal at the actual index in the list
        Proposal storage newProposal = proposalVote.proposals[newIndex];
        newProposal.commentID = commentID;
        newProposal.tokenVoteCount = 0;

        emit ProposalAdded(commentID);
    }

    /**
     * Vote on a specified proposal
     * Maximum total votes is the number of staked tokens.
     * Vote can be spread accross multiple proposls.
     */
    function voteOnProposal(int128 commentID, int128 voteDelta) external {
        
        require(
            stakers[msg.sender].amountStaked > 0 && !stakers[msg.sender].canceledStake,
            "Must have a stake in the idea."
        );

        require(
            proposalVoteActive && !statusVoteActive && !ideaCanceled && !ideaEnded && block.timestamp < ideaEndTime && block.timestamp < statusVote.thresholdTime,
            "Proposal voting not active."
        );

        int128 idxPlusOne = proposalVote.proposalIndexes[commentID];
        require(idxPlusOne != 0, "Proposal does not exist.");

        uint256 idx = uint128(idxPlusOne - 1);

        int128 totalVotes = stakers[msg.sender].totalTokenVotes;
        int128 currentVotes = proposalVote.proposals[idx].tokenVotesPerStaker[msg.sender];
        int128 stakedAmount = stakers[msg.sender].amountStaked;

        if (totalVotes + voteDelta > stakedAmount) {
            revert InvalidProposalVote("Token vote exceeds staked amount.", totalVotes + voteDelta);
        } else if (currentVotes + voteDelta < 0) {
            revert InvalidProposalVote("Token vote below 0.", totalVotes + voteDelta);
        } else {
            proposalVote.proposals[idx].tokenVotesPerStaker[msg.sender] += voteDelta;
            stakers[msg.sender].totalTokenVotes += voteDelta;
            proposalVote.proposals[idx].tokenVoteCount += voteDelta;
        }

        // Check if its a new winner
        if (proposalVote.proposals[idx].tokenVoteCount >= proposalVote.winningProposal.tokenVoteCount) {
            
            proposalVote.winningProposal = ProposalView({
                commentID: commentID,
                tokenVoteCount: proposalVote.proposals[idx].tokenVoteCount
            });
            
        }

        emit ProposalVoted(msg.sender, commentID, voteDelta);
    }

    function getIdeaState() external view returns (bool) {
        return (!ideaCanceled && !ideaEnded && block.timestamp < ideaEndTime);
    }

    function getTotalStaked() external view returns (int128) {
        return totalStaked;
    }

    function getIdeaTimes() external view returns (uint256 startTime, uint256 endTime, uint256 duration, uint256 statusThreshold) {
        return (ideaStartTime, ideaEndTime, ideaDuration, statusVote.thresholdTime);
    }

    function getStatusVoteData() external view returns (
            int128 endVotes,
            int128 cancelVotes,
            int128 extendVotes,
            int16 extensionCount,
            uint256 thresholdTime
        )
    {
        return (
            statusVote.endVotes,
            statusVote.cancelVotes,
            statusVote.extendVotes,
            statusVote.extensionCount,
            statusVote.thresholdTime
        );
    }

    function getProposalVoteStatus() external view returns (bool) {
        return proposalVoteActive;
    }

    function getStatusVoteStatus() external view returns (bool) {
        return statusVoteActive;
    }

    function getWinningStatus() external view returns (StatusOption) {
        return statusVote.winningStatus;
    }

    function getExtensionCount() external view returns (int16) {
        return statusVote.extensionCount;
    }

    function getStakedAmount(address stakerAddress) external view returns (int128) {
        return stakers[stakerAddress].amountStaked;
    }

    function getTotalTokenVotes(int128 commentID) external view returns (int128) {
        int128 indexPlus1 = proposalVote.proposalIndexes[commentID];
        if (indexPlus1 <= 0) {
            revert("Proposal does not exist with that ID.");
        }
        uint256 idx = uint256(uint128(indexPlus1 - 1));
        return proposalVote.proposals[idx].tokenVoteCount;
    }

    function getTokenVotes(int128 commentID, address stakerAddress) external view returns (int128) {
        int128 indexPlus1 = proposalVote.proposalIndexes[commentID];
        if (indexPlus1 <= 0) {
            revert("Proposal does not exist with that ID.");
        }
        uint256 idx = uint256(uint128(indexPlus1 - 1));
        return proposalVote.proposals[idx].tokenVotesPerStaker[stakerAddress];
    }

    function getOwnerAddress() external view returns (address) {
        return ownerAddress;
    }

    function getWinningProposal() external view returns (int128, int128) {
        return (
            proposalVote.winningProposal.commentID,
            proposalVote.winningProposal.tokenVoteCount
        );
    }

}
