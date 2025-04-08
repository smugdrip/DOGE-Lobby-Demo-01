// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract IdeaToken is ERC20, ERC20Permit {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10 ** 18;

    /**
     * @notice Constructor that mints the initial supply to the Treasury.
     * @param treasury The address of the Treasury contract that will receive the tokens.
     */
    constructor(address treasury) ERC20("IdeaToken", "IDEA") ERC20Permit("IdeaToken") {
        _mint(treasury, INITIAL_SUPPLY);
    }
}
