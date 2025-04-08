import { ethers } from "ethers";
import ideaABI from "../../../util/IdeaABI.json";
import ideaTokenABI from "../../../util/IdeaTokenABI.json";
import ideaFactoryABI from "../../../util/IdeaFactoryABI.json";
import treasuryABI from "../../../util/TreasuryABI.json";

const ideaTokenAddress = "0x2DfaD8af3d02628376104c02337CA0AEC5147143";
const ideaFactoryAddress = "0x2567170FD1b6efb8a098ac45afaa27F3CB0181fd";
const treasuryAddress = "0x165B3d7787F0D9FE4deb2244fF752028C7650729";

const IDEA_COST = ethers.parseUnits("10", 18);

/**
 * @notice Helper to get a signer from MetaMask
 * @returns an ethers.js Signer instance.
 */
export const getProvider = async () => {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
};

// Helper function to generate the permit signature for createIdeaContract.
export const getCreateIdeaPermit = async (signer, ideaToken, ideaFactory, deadline, chainId) => {
  // Set up the EIP-712 domain.
  const domain = {
    name: "IdeaToken",
    version: "1",
    chainId: chainId,
    verifyingContract: ideaToken.target,
  };

  // Define the types for the Permit signature.
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  // Retrieve the current nonce for the signer.
  const nonceValue = await ideaToken.nonces(signer.address);
  
  // Construct the permit data.
  const permitData = {
    owner: signer.address,
    spender: ideaFactory.target,
    value: IDEA_COST.toString(),
    nonce: Number(nonceValue),
    deadline: deadline,
  };

  // Sign the typed data.
  const sig = await signer.signTypedData(domain, types, permitData);
  // Decompose the signature into its components.
  const { v, r, s } = ethers.Signature.from(sig);
  return { v, r, s };
};

// Helper function to generate the permit signature for stakeTokens.
export const getStakePermit = async (signer, ideaToken, ideaContract, stakeAmount, deadline, chainId) => {
  // Set up the EIP-712 domain for the IdeaToken.
  const domain = {
    name: "IdeaToken",
    version: "1",
    chainId: chainId,
    verifyingContract: ideaToken.target,
  };

  // Define the types for the Permit signature.
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  // Get the current nonce for the signer.
  const nonceValue = await ideaToken.nonces(signer.address);

  // Construct the permit data.
  // Note that for staking, the spender is the Idea contract (which calls stakeTokens).
  const permitData = {
    owner: signer.address,
    spender: ideaContract.target,
    value: stakeAmount.toString(),
    nonce: Number(nonceValue),
    deadline: deadline,
  };

  // Sign the typed data.
  const sig = await signer.signTypedData(domain, types, permitData);
  // Decompose the signature into v, r, s components.
  const { v, r, s } = ethers.Signature.from(sig);
  return { v, r, s };
};
