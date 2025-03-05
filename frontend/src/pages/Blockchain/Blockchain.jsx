import React, { useState } from "react";
import {
  createIdea,
  stakeTokens,
  endStaking,
  withdrawFromTreasury,
  getIdeaTokenBalance
} from "./BlockchainFunctions";

function Blockchain() {
  const [account, setAccount] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // For creating a new Idea
  const [username, setUsername] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [createdIdeaAddress, setCreatedIdeaAddress] = useState("");

  // For staking
  const [stakeUser, setStakeUser] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [ideaAddressToStake, setIdeaAddressToStake] = useState("");

  // For ending staking
  const [ideaAddressToEnd, setIdeaAddressToEnd] = useState("");

  // For withdrawing from treasury
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDestination, setWithdrawDestination] = useState("");

  // For checking token balance
  const [ideaTokenBalance, setIdeaTokenBalance] = useState("");

  /**
   * Connects the user’s wallet if not already connected.
   */
  const connectWallet = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    if (!window.ethereum) {
      alert("Please install MetaMask!");
      setIsConnecting(false);
      return;
    }

    try {
      let accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length === 0) {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
      }
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Create Idea
   */
  const handleCreateIdea = async () => {
    if (!username || !timeLimit) {
      alert("Please enter a username and time limit in seconds.");
      return;
    }
    setTxStatus("Creating new Idea...");
    try {
      const ideaAddr = await createIdea(username, parseInt(timeLimit, 10));
      setCreatedIdeaAddress(ideaAddr);
      setTxStatus(`New Idea created at: ${ideaAddr}`);
    } catch (error) {
      console.error("Error creating idea:", error);
      setTxStatus("Error creating idea: " + error.message);
    }
  };

  /**
   * Stake Tokens
   */
  const handleStakeTokens = async () => {
    if (!ideaAddressToStake || !stakeUser || !stakeAmount) {
      alert("Please enter an Idea address, your username, and stake amount.");
      return;
    }
    setTxStatus("Staking tokens...");
    try {
      await stakeTokens(ideaAddressToStake, stakeUser, stakeAmount);
      setTxStatus(`Successfully staked ${stakeAmount} tokens!`);
    } catch (error) {
      console.error("Error staking tokens:", error);
      setTxStatus("Error staking tokens: " + error.message);
    }
  };

  /**
   * End Staking
   */
  const handleEndStaking = async () => {
    if (!ideaAddressToEnd) {
      alert("Please enter an Idea contract address to end staking.");
      return;
    }
    setTxStatus("Ending staking...");
    try {
      await endStaking(ideaAddressToEnd);
      setTxStatus("Staking ended successfully!");
    } catch (error) {
      console.error("Error ending staking:", error);
      setTxStatus("Error ending staking: " + error.message);
    }
  };

  /**
   * Withdraw from Treasury
   */
  const handleWithdrawFromTreasury = async () => {
    if (!withdrawAmount || !withdrawDestination) {
      alert("Enter a withdraw amount and destination address.");
      return;
    }
    setTxStatus("Withdrawing from treasury...");
    try {
      await withdrawFromTreasury(withdrawAmount, withdrawDestination);
      setTxStatus(`Withdrew ${withdrawAmount} tokens to ${withdrawDestination}`);
    } catch (error) {
      console.error("Error withdrawing from treasury:", error);
      setTxStatus("Error: " + error.message);
    }
  };

  /**
   * Check Idea Token Balance (for the connected account)
   */
  const handleCheckBalance = async () => {
    if (!account) {
      alert("Connect your wallet first!");
      return;
    }
    setTxStatus("Checking IdeaToken balance...");
    try {
      const bal = await getIdeaTokenBalance(account);
      setIdeaTokenBalance(bal);
      setTxStatus(`Balance fetched: ${bal} tokens`);
    } catch (error) {
      console.error("Error checking balance:", error);
      setTxStatus("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <hr />

      <p>
        make sure to add the token to your metamask wallet:
      </p>

      <p><strong>Idea Token Address: 0xcCd66F1f7d1d49CFc9fe3be694B945Fc72F0cf2E</strong></p>
      
      <hr />
      <button onClick={connectWallet} disabled={isConnecting}>
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      <p><strong>Connected account:</strong> {account || "None"}</p>
      <p><strong>Transaction Status:</strong> {txStatus || "Idle"}</p>

      <hr />

      {/* CREATE IDEA */}
      <h3>Create a New Idea</h3>
      <div>
        <label>Username: </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. Alice"
        />
      </div>
      <div>
        <label>Time Limit (seconds): </label>
        <input
          type="number"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="e.g. 3600"
        />
      </div>
      <button onClick={handleCreateIdea} disabled={!account}>
        Create Idea
      </button>
      {createdIdeaAddress && <p>New Idea Address: {createdIdeaAddress}</p>}

      <hr />

      {/* STAKE TOKENS */}
      <h3>Stake Tokens on an Idea</h3>
      <div>
        <label>Idea Contract Address: </label>
        <input
          value={ideaAddressToStake}
          onChange={(e) => setIdeaAddressToStake(e.target.value)}
          placeholder="0x123..."
        />
      </div>
      <div>
        <label>Your Username: </label>
        <input
          value={stakeUser}
          onChange={(e) => setStakeUser(e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div>
        <label>Amount to Stake: </label>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <button onClick={handleStakeTokens} disabled={!account}>
        Stake Tokens
      </button>

      <hr />

      {/* END STAKING */}
      <h3>End Staking</h3>
      <div>
        <label>Idea Contract Address: </label>
        <input
          value={ideaAddressToEnd}
          onChange={(e) => setIdeaAddressToEnd(e.target.value)}
          placeholder="0x123..."
        />
      </div>
      <button onClick={handleEndStaking} disabled={!account}>
        End Staking
      </button>

      <hr />

      {/* WITHDRAW FROM TREASURY */}
      <h3>Withdraw from Treasury</h3>
      <p>(Only the treasury owner can do this.)</p>
      <div>
        <label>Amount: </label>
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="e.g. 50"
        />
      </div>
      <div>
        <label>Destination Address: </label>
        <input
          value={withdrawDestination}
          onChange={(e) => setWithdrawDestination(e.target.value)}
          placeholder="0xABC..."
        />
      </div>
      <button onClick={handleWithdrawFromTreasury} disabled={!account}>
        Withdraw
      </button>

      <hr />

      {/* CHECK BALANCE */}
      <h3>Check My IdeaToken Balance</h3>
      <button onClick={handleCheckBalance} disabled={!account}>
        Check Balance
      </button>
      {ideaTokenBalance && (
        <p>Your IdeaToken balance: {ideaTokenBalance}</p>
      )}
    </div>
  );
}

export default Blockchain;
