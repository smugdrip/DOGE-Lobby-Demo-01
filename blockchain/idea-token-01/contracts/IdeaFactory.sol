// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IdeaToken.sol";
import "./Idea.sol";
import "./Treasury.sol";

contract IdeaFactory {
    // Reference to the IdeaToken contract.
    IdeaToken public ideaToken;
    // Reference to the Treasury contract.
    Treasury public treasury;
    // Array to keep track of all deployed IdeaContracts.
    Idea[] public deployedIdeas;
    // Upfront cost defined as 10 tokens (with 18 decimals).
    uint256 public constant IDEA_COST = 10 * 10 ** 18;

    // Event emitted when a new IdeaContract is created.
    event IdeaCreated(string username, address staker, address ideaAddress);

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

    /**
     * @notice Creates a new IdeaContract after collecting an upfront cost from the caller.
     * @param username A string representing the staker's username.
     * @return The address of the newly deployed IdeaContract.
     *
     * Requirements:
     * - The caller must have approved the IdeaFactory to spend at least `ideaCost` tokens.
     */
    function createIdeaContract(string memory username, uint256 timeLimit) public returns (Idea) {
        // Transfer the upfront cost from the user to the Treasury.
        require(
            ideaToken.transferFrom(msg.sender, address(treasury), IDEA_COST),
            "IdeaFactory: Upfront cost transfer failed"
        );

        // Create a new IdeaContract with the caller as the owner.
        Idea newIdea = new Idea(msg.sender, ideaToken, username, timeLimit);

        // Add the new IdeaContract to the array of deployed contracts.
        deployedIdeas.push(newIdea);

        // Emit an event with the provided username, the caller's address, and the new IdeaContract address.
        emit IdeaCreated(username, msg.sender, address(newIdea));

        return newIdea;
    }
}
