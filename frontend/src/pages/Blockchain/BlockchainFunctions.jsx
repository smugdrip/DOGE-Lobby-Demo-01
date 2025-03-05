import { ethers } from "ethers";
import ideaABI from "../../../util/IdeaABI.json";
import ideaTokenABI from "../../../util/IdeaTokenABI.json";
import ideaFactoryABI from "../../../util/IdeaFactoryABI.json";
import treasuryABI from "../../../util/TreasuryABI.json"

const ideaTokenAddress = "0xcCd66F1f7d1d49CFc9fe3be694B945Fc72F0cf2E"
const ideaFactoryAddress = "0x040d5Ea14DDd49f5cc5Bc02829eEb80286026f38"
const treasuryAddress = "0xEb02047e16c809267F78ef4e3e72906Eedc46675"

/**
 * @notice Helper to get a signer from MetaMask (or another injected provider).
 * @returns an ethers.js Signer instance.
 */
const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
};

/**
 * @notice Creates a new Idea contract by calling the IdeaFactory.
 * @param {string} username - The idea creator's username.
 * @param {number} timeLimit - Duration (in seconds) for the staking period.
 * @returns {Promise<string>} - The newly deployed Idea contract address.
 */
export const createIdea = async (username, timeLimit) => {
  const signer = await getSigner();
  const factoryContract = new ethers.Contract(
    ideaFactoryAddress,
    ideaFactoryABI.abi,
    signer
  );

  await approveTokensCreate(10, signer);

  // Call createIdeaContract on the factory
  const tx = await factoryContract.createIdeaContract(username, timeLimit);
  const receipt = await tx.wait();

  let ideaAddress;

  // parse the logs created by IdeaFactory during the transaction.
  for (const log of receipt.logs) {
    try {
      const parsedLog = factoryContract.interface.parseLog(log);
      if (parsedLog.name === "IdeaCreated") {
        ideaAddress = parsedLog.args.ideaAddress;
        break;
      }
    } catch (err) {
      // If parseLog fails, it's a log for a different event or contract. Ignore.
    }
  }

  console.log("New Idea address:", ideaAddress);
  return ideaAddress;
};

/**
 * @notice Stakes tokens into a specified Idea contract.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {string} username - The staker’s username.
 * @param {string|number} amount - The number of tokens to stake.
 */
export const stakeTokens = async (ideaAddress, username, amount) => {
  const signer = await getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI.abi, signer);
  
  await approveTokensStake(amount, signer, ideaAddress);

  // Now call stakeTokens
  const tx = await ideaContract.stakeTokens(username, ethers.parseUnits(amount.toString(), 18));
  await tx.wait();

  console.log(`Staked ${amount} tokens to Idea at: ${ideaAddress}`);
};

/**
 * @notice Ends the staking period for a specified Idea contract 
 * and transfers all staked tokens to the idea owner.
 * @param {string} ideaAddress - The address of the Idea contract.
 */
export const endStaking = async (ideaAddress) => {
  const signer = await getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI.abi, signer);

  const tx = await ideaContract.endStaking();
  await tx.wait();

  console.log("Staking ended for idea:", ideaAddress);
};

/**
 * Withdraw tokens from the treasury (only owner can do this).
 * @param {string|number} amount - The number of tokens to withdraw.
 * @param {string} destination - The address to receive the tokens.
 */
export const withdrawFromTreasury = async (amount, destination) => {
  const signer = await getSigner();
  const treasuryContract = new ethers.Contract(treasuryAddress, treasuryABI.abi, signer);

  // The user must be the owner (the contract enforces it).
  // Convert amount to Wei if your token has 18 decimals:
  const parsedAmount = ethers.parseUnits(amount.toString(), 18);

  const tx = await treasuryContract.withdraw(parsedAmount, destination);
  await tx.wait();
  console.log(`Withdrew ${amount} tokens to ${destination}`);
};

/**
 * Gets the IdeaToken balance of a specific address (like the connected wallet).
 * @param {string} userAddress - The wallet address to query.
 * @returns {string} The token balance (as a human-readable string).
 */
export const getIdeaTokenBalance = async (userAddress) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const ideaTokenContract = new ethers.Contract(ideaTokenAddress, ideaTokenABI.abi, provider);

  const balanceBN = await ideaTokenContract.balanceOf(userAddress);
  // Convert from BigNumber (Wei) to string with 18 decimals
  return ethers.formatUnits(balanceBN, 18);
};

/**
 * Approve an amount of tokens to be sent from the users wallet
 * Call before staking or posting an idea.
 * @param {string|number} amountToApprove 
 * @param {*} signer 
 */
export const approveTokensCreate = async (amountToApprove, signer) => {

  // Connect to your IdeaToken
  const tokenContract = new ethers.Contract(ideaTokenAddress, ideaTokenABI.abi, signer);

  // Convert user input (e.g. "10") to a BigInt with 18 decimals
  const amount = ethers.parseUnits(amountToApprove.toString(), 18);

  // Approve the factory to spend that amount on your behalf
  const tx = await tokenContract.approve(ideaFactoryAddress, amount);
  await tx.wait();
  console.log(`Approved ${amountToApprove} tokens for IdeaFactory!`);
};

/**
 * Approve an amount of tokens to be sent from the users wallet
 * Call before staking or posting an idea.
 * @param {string|number} amountToApprove 
 * @param {*} signer 
 */
export const approveTokensStake = async (amountToApprove, signer, ideaAddress) => {

  // Connect to your IdeaToken
  const tokenContract = new ethers.Contract(ideaTokenAddress, ideaTokenABI.abi, signer);

  // Convert user input (e.g. "10") to a BigInt with 18 decimals
  const amount = ethers.parseUnits(amountToApprove.toString(), 18);

  // Approve the factory to spend that amount on your behalf
  const tx = await tokenContract.approve(ideaAddress, amount);
  await tx.wait();
  console.log(`Approved ${amountToApprove} tokens for IdeaFactory!`);
};
