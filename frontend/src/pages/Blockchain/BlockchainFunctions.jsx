import { ethers } from "ethers";
import ideaABI from "../../../util/IdeaABI.json";
import ideaTokenABI from "../../../util/IdeaTokenABI.json";
import ideaFactoryABI from "../../../util/IdeaFactoryABI.json";
import treasuryABI from "../../../util/TreasuryABI.json";

import {
  getProvider,
  getCreateIdeaPermit,
  getStakePermit
} from "./BlockchainHelpers";

const ideaTokenAddress = "0x2DfaD8af3d02628376104c02337CA0AEC5147143";
const ideaFactoryAddress = "0x2567170FD1b6efb8a098ac45afaa27F3CB0181fd";
const treasuryAddress = "0x165B3d7787F0D9FE4deb2244fF752028C7650729";

/**
 * @notice Creates a new Idea contract by calling the IdeaFactory.
 * @param {number} ideaDuration - Duration (in seconds) for the staking period.
 * @returns {Promise<string>} - The newly deployed Idea contract address.
 */
export const createIdea = async (ideaDuration) => {
  // get the signer and contracts
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const ideaFactory = new ethers.Contract(
    ideaFactoryAddress,
    ideaFactoryABI,
    signer
  );
  const ideaToken = new ethers.Contract(
    ideaTokenAddress,
    ideaTokenABI,
    signer
  );
  // generate permit and create idea
  const chainId = (await provider.getNetwork()).chainId;
  const currentBlock = await provider.getBlock("latest");
  const deadline = currentBlock.timestamp + 3600;
  const { v, r, s } = await getCreateIdeaPermit(signer, ideaToken, ideaFactory, deadline, chainId);
  const tx = await ideaFactory.createIdeaContract(ideaDuration, deadline, v, r, s);
  const receipt = await tx.wait();
  // find the idea address and return
  let ideaAddress;
  for (const log of receipt.logs) {
    try {
      const parsedLog = ideaFactory.interface.parseLog(log);
      if (parsedLog.name === "IdeaCreated") {
        ideaAddress = parsedLog.args.ideaAddress;
        break;
      }
    } catch (err) {
      console.log(err);
    }
  }
  console.log("New Idea address:", ideaAddress);
  return ideaAddress;
};


/**
 * @notice Stakes tokens into a specified Idea contract.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {string|number} amount - The number of tokens to stake.
 */
export const stakeTokens = async (ideaAddress, amount) => {
  // get signer and contracts
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const idea = new ethers.Contract(ideaAddress, ideaABI, signer);
  const ideaToken = new ethers.Contract(ideaTokenAddress, ideaTokenABI, signer);
  // create permit and stake tokens
  const chainId = (await provider.getNetwork()).chainId;
  const currentBlock = await provider.getBlock("latest");
  const deadline = currentBlock.timestamp + 3600;
  const stakeAmount = ethers.parseUnits(amount.toString(), 18);
  const { v, r, s } = await getStakePermit(signer, ideaToken, idea, stakeAmount, deadline, chainId);
  // Now call stakeTokens
  const tx = await idea.stakeTokens(stakeAmount, deadline, v, r, s);
  await tx.wait();
  console.log(`Staked ${amount} tokens to Idea at: ${ideaAddress}`);
};

/**
 * @notice Cast a vote on the idea's status: End (0), Cancel (1), or Extend (2).
 * @dev Must have staked tokens and be allowed to vote at this time.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {number} statusOption - The numeric value of the enum (0=End, 1=Cancel, 2=Extend).
 * @returns {object} Transaction receipt once the transaction is mined.
 */
export const voteOnStatus = async (ideaAddress, statusOption) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, signer);
  const tx = await ideaContract.voteOnStatus(statusOption);
  const receipt = await tx.wait();
  return receipt;
};

/**
 * @notice Start a Status Vote on the Idea contract if conditions are met.
 * @dev This closes Proposal voting and opens a Status Vote.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {object} Transaction receipt once the transaction is mined.
 */
export const startStatusVote = async (ideaAddress) => {
  const provider = await getProvider();;
  const signer = await provider.getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, signer);

  const tx = await ideaContract.startStatusVote();
  const receipt = await tx.wait();
  return receipt;
};

/**
 * Withdraw tokens from the treasury (only owner can do this).
 * @param {string|number} amount - The number of tokens to withdraw.
 * @param {string} destination - The address to receive the tokens.
 */
export const withdrawFromTreasury = async (amount, destination) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const treasuryContract = new ethers.Contract(treasuryAddress, treasuryABI, signer);

  const parsedAmount = ethers.parseUnits(amount.toString(), 18);

  const tx = await treasuryContract.withdraw(parsedAmount, destination);
  await tx.wait();
  console.log(`Withdrew ${amount} tokens to ${destination}`);
};

/**
 * @notice Lets the owner of the Idea contract withdraw all remaining tokens when the idea has ended.
 * @dev Only the contract owner can call this, and only if the idea has ended.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {object} Transaction receipt once the transaction is mined.
 */
export const ownerWithdraw = async (ideaAddress) => {
  const provider = await getProvider();;
  const signer = await provider.getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, signer);

  const tx = await ideaContract.ownerWithdraw();
  const receipt = await tx.wait();
  return receipt;
};

/**
 * @notice Withdraw staked tokens from the Idea contract if eligible.
 * @dev Requires a signature (transaction).
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {object} Transaction receipt once the transaction is mined.
 */
export const withdrawStake = async (ideaAddress) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, signer);

  const tx = await ideaContract.withdrawStake();
  const receipt = await tx.wait();
  return receipt;
};

/**
 * @notice Nominate a comment with the specified ID as a proposal in the Idea contract.
 * @dev This requires a transaction signature, so users will be prompted to confirm.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {number | string | bigint} commentID - The unique ID for the comment (int128 in Solidity).
 * @returns {object} The transaction receipt once the transaction is mined.
 */
export const nominateComment = async (ideaAddress, commentID) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, signer);
  const tx = await ideaContract.nominateComment(commentID);
  const receipt = await tx.wait();
  return receipt;
};

/**
 * @notice Vote on an existing proposal with the specified comment ID.
 * @dev User must have staked tokens and be allowed to vote. This requires a transaction signature.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {number | string | bigint} commentID - The unique ID of the proposal/comment.
 * @param {number | string | bigint} voteDelta - The number of tokens to add (or remove, if negative) from this proposal.
 * @returns {object} The transaction receipt once the transaction is mined.
 */
export const voteOnProposal = async (ideaAddress, commentID, voteDelta) => {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, signer);
  const tx = await ideaContract.voteOnProposal(
    commentID, 
    ethers.parseUnits(voteDelta.toString(), 18)
  );
  const receipt = await tx.wait();
  return receipt;
};

/**
 * Gets the IdeaToken balance of a specific address (like the connected wallet).
 * @param {string} userAddress - The wallet address to query.
 * @returns {string} The token balance (as a human-readable string).
 */
export const getTokenBalance = async (userAddress) => {
  const provider = await getProvider();
  const ideaTokenContract = new ethers.Contract(ideaTokenAddress, ideaTokenABI, provider);

  const balanceBN = await ideaTokenContract.balanceOf(userAddress);

  return ethers.formatUnits(balanceBN, 18);
};

/**
 * @notice Retrieves the total staked amount for a specific Idea contract.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {string} The total staked amount (as a human-readable string).
 */
export const getTotalStaked = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  const stakedAmountBN = await ideaContract.getTotalStaked();
  return ethers.formatUnits(stakedAmountBN, 18);
};

/**
 * @notice Checks if the idea is active (not canceled, not ended, and current time < end time).
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {boolean} True if active, else false.
 */
export const getIdeaState = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  
  const ideaState = await ideaContract.getIdeaState();
  return ideaState; // returns a boolean
};

/**
 * @notice Retrieves the start/end times, duration, and status threshold of an Idea.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {object} An object containing { startTime, endTime, duration, statusThreshold } (as numbers).
 */
export const getIdeaTimes = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  
  const [startTime, endTime, duration, statusThreshold] = await ideaContract.getIdeaTimes();
  return {
    startTime: Number(startTime),
    endTime: Number(endTime),
    duration: Number(duration),
    statusThreshold: Number(statusThreshold),
  };
};

/**
 * @notice Retrieves current status vote data.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {object} An object containing endVotes, cancelVotes, extendVotes, extensionCount, thresholdTime.
 */
export const getStatusVoteData = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  
  const [endVotesBN, cancelVotesBN, extendVotesBN, extensionCount, thresholdTime] =
    await ideaContract.getStatusVoteData();

  return {
    endVotes: ethers.formatUnits(endVotesBN, 18),
    cancelVotes: ethers.formatUnits(cancelVotesBN, 18),
    extendVotes: ethers.formatUnits(extendVotesBN, 18),
    extensionCount: Number(extensionCount),
    thresholdTime: Number(thresholdTime),
  };
};

/**
 * @notice Checks whether proposal voting is active.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {boolean} True if active, else false.
 */
export const getProposalVoteStatus = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  
  return await ideaContract.getProposalVoteStatus();
};

/**
 * @notice Checks whether status voting is active.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {boolean} True if active, else false.
 */
export const getStatusVoteStatus = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  
  return await ideaContract.getStatusVoteStatus();
};

/**
 * @notice Retrieves the current winning status (end, cancel, extend, etc.).
 *         Note: This usually returns an enum, which in Solidity is represented as a uint.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {number} The enum value of the winning status.
 */
export const getWinningStatus = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  const winningStatus = await ideaContract.getWinningStatus();
  return Number(winningStatus);
};

/**
 * @notice Retrieves how many times the Idea has been extended.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {number} The extension count as a regular JS number.
 */
export const getExtensionCount = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  const extensionCount = await ideaContract.getExtensionCount();
  return Number(extensionCount);
};

/**
 * @notice Retrieves the staked amount for a specific staker on an Idea.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {string} stakerAddress - The address of the staker.
 * @returns {string} The staked amount (formatted as a string).
 */
export const getStakedAmount = async (ideaAddress, stakerAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  const stakedAmountBN = await ideaContract.getStakedAmount(stakerAddress);
  return ethers.formatUnits(stakedAmountBN, 18);
};

/**
 * @notice Retrieves the total token votes for a given proposal comment ID.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {number} commentID - The ID of the proposal comment.
 * @returns {string} The total token votes for that proposal (formatted).
 */
export const getTotalTokenVotes = async (ideaAddress, commentID) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  const totalVotesBN = await ideaContract.getTotalTokenVotes(commentID);
  return ethers.formatUnits(totalVotesBN, 18);
};

/**
 * @notice Retrieves how many token votes a particular staker has given to a proposal.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @param {number} commentID - The ID of the proposal comment.
 * @param {string} stakerAddress - The address of the staker.
 * @returns {string} The token votes by that staker for the proposal (formatted).
 */
export const getTokenVotes = async (ideaAddress, commentID, stakerAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  const tokenVotesBN = await ideaContract.getTokenVotes(commentID, stakerAddress);
  return ethers.formatUnits(tokenVotesBN, 18);
};

/**
 * @notice Retrieves the owner address of the Idea contract.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {string} The owner address.
 */
export const getOwnerAddress = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);
  return await ideaContract.getOwnerAddress();
};

/**
 * @notice Retrieves the winning proposal’s ID and total token votes.
 * @param {string} ideaAddress - The address of the Idea contract.
 * @returns {object} An object containing { winningCommentID, winningVoteCount } as strings.
 */
export const getWinningProposal = async (ideaAddress) => {
  const provider = await getProvider();
  const ideaContract = new ethers.Contract(ideaAddress, ideaABI, provider);

  const [commentIDBN, tokenVoteCountBN] = await ideaContract.getWinningProposal();
  return {
    winningCommentID: commentIDBN.toString(),
    winningVoteCount: ethers.formatUnits(tokenVoteCountBN, 18),
  };
};
