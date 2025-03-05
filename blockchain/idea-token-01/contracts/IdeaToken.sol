// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import OpenZeppelin's ERC20 implementation.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Construct the IdeaToken as a ERC20 token so it inherits default functionality
// Deploy initial tokens to the Treasury contract's address
contract IdeaToken is ERC20 {
    
    // 1 million dollars
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18;

    /**
     * @notice Constructor that mints the initial supply to the Treasury.
     * @param treasury The address of the Treasury contract that will receive the tokens.
     */
    constructor(address treasury) ERC20("IdeaToken", "IDEA") {
        _mint(treasury, INITIAL_SUPPLY);
    }
}
