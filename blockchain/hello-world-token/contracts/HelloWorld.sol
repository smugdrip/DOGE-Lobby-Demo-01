// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin's ERC20 implementation
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract HelloWorld is ERC20 {
    
    uint8 private constant DECIMALS = 18;

    // Array to store messages
    string[] public messages;

    // Event emitted when a new message is submitted
    event MessageSubmitted(
        string message,
        uint256 timestamp,
        address indexed sender
    );

    // calls the constructor of the parent ERC20 contract
    constructor() ERC20("HelloWorld", "HLW") {}

    /**
     * @notice Allots 100 tokens to the caller.
     * Tokens are minted on-demand without a pre-deployed supply.
     */
    function allotTokens() external {
        uint256 amount = 100 * (10 ** uint256(DECIMALS));
        _mint(msg.sender, amount);
    }

    /**
     * @notice Submit a message to be stored on-chain.
     * The message is added to the array and an event is emitted.
     * @param _message The message string to store.
     */
    function submitMessage(string calldata _message) external {
        messages.push(_message);
        emit MessageSubmitted(_message, block.timestamp, msg.sender);
    }

    /**
     * @notice Retrieve the latest message submitted.
     * @return The most recent message string.
     */
    function getLatestMessage() external view returns (string memory) {
        require(messages.length > 0, "No messages yet");
        return messages[messages.length - 1];
    }
}
