// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IdeaToken.sol";
import "./Idea.sol";
import "./Treasury.sol";

contract IdeaFactory {
    
    // Reference to the IdeaToken + Treasury contract.
    IdeaToken public ideaToken;
    Treasury public treasury;

    uint256 public constant IDEA_COST = 10 * 10 ** 18;

    event IdeaCreated(address staker, address ideaAddress);

    /**
     * @notice Constructor initializes the IdeaFactory with references to the IdeaToken and Treasury contracts,
     *         as well as the upfront cost required to post an idea.
     * @param _ideaToken The address of the deployed IdeaToken contract.
     * @param _treasury The address of the deployed Treasury contract.
     */
    constructor(IdeaToken _ideaToken, Treasury _treasury) {
        ideaToken = _ideaToken;
        treasury = _treasury;
    }

    function createIdeaContract(
        uint256 timeLimit, 
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public returns (Idea) {
        
        // Use the permit function so the user can sign an off-chain approval
        ideaToken.permit(msg.sender, address(this), IDEA_COST, deadline, v, r, s);
        
        // Transfer the upfront cost from the user to the Treasury.
        require(
            ideaToken.transferFrom(msg.sender, address(treasury), IDEA_COST),
            "IdeaFactory: Upfront cost transfer failed"
        );

        // Create a new Idea contract with the caller as the owner.
        Idea newIdea = new Idea(msg.sender, ideaToken, timeLimit);

        emit IdeaCreated(msg.sender, address(newIdea));

        return newIdea;
    }

}
