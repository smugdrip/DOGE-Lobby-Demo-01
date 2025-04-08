import React, { useState } from "react";
import { getTokenVotes, createIdea, getTotalTokenVotes, getWinningProposal, nominateComment, stakeTokens, voteOnProposal, withdrawFromTreasury, getStakedAmount, getTotalStaked, getStatusVoteData, voteOnStatus, startStatusVote } from "./BlockchainFunctions"; 

function Blockchain() {
  // MetaMask connection
  const [account, setAccount] = useState("");
  const [isTransacting, setIsTransacting] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // Creating a new Idea
  const [ideaDuration, setIdeaDuration] = useState(""); // e.g. seconds
  const [createdIdeaAddress, setCreatedIdeaAddress] = useState("");

  // Viewing staked amount and total balance
  const [stakedAmountView, setStakedAmountView] = useState("");
  const [stakedAmountViewAdd, setStakedAmountViewAdd] = useState("");
  const [totalStakedAmount, setTotalStakedAmount] = useState("");

  // Staking to an existing Idea
  const [ideaAddressToStake, setIdeaAddressToStake] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");

  // Withdraw amount
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Nominate ID and Address
  const [nominateID, setNominateID] = useState("");
  const [nominateAdd, setNominateAdd] = useState("");

  // Nominate ID and Address
  const [pVoteID, setPVoteID] = useState("");
  const [pVoteAdd, setPVoteAdd] = useState("");
  const [pVoteAmount, setPVoteAmount] = useState("");

  // View proposal vote
  const [pVoteViewAdd, setPVoteViewAdd] = useState("");
  const [pVoteViewID, setPVoteViewID] = useState("");
  const [totalVotes, setTotalVotes] = useState("");
  const [userVotes, setUserVotes] = useState("");
  const [winningProposalID, setWinningProposalID] = useState("");
  const [winningProposalVotes, setWinningProposalVotes] = useState("");

  const [statusVoteDataIdea, setStatusVoteDataIdea] = useState("");
  const [statusVoteDataResult, setStatusVoteDataResult] = useState(null);
  const [voteStatusIdea, setVoteStatusIdea] = useState("");
  const [voteStatusOption, setVoteStatusOption] = useState("");
  const [startStatusVoteIdea, setStartStatusVoteIdea] = useState("");

  const connectWallet = async () => {
    if (isTransacting) return;
    setIsTransacting(true);
    setTxStatus("Connecting wallet...");

    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or another web3 wallet!");
        return;
      }

      let accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length === 0) {
        // If no accounts, prompt to connect
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
      }

      setAccount(accounts[0]);
      setTxStatus("Wallet connected!");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setTxStatus("Error connecting wallet: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleCreateIdea = async () => {
    if (isTransacting) return;
    if (!ideaDuration) {
      alert("Please enter a duration in seconds for the Idea.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Creating Idea...");

    try {
      const parsedDuration = parseInt(ideaDuration, 10);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        throw new Error("Invalid idea duration.");
      }

      const newIdeaAddr = await createIdea(parsedDuration);
      setCreatedIdeaAddress(newIdeaAddr);
      setTxStatus(`New Idea created at: ${newIdeaAddr}`);
    } catch (error) {
      console.error("Error creating idea:", error);
      setTxStatus("Error creating idea: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleStakeTokens = async () => {
    if (isTransacting) return;
    if (!ideaAddressToStake || !stakeAmount) {
      alert("Please enter an Idea address and a stake amount.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Staking tokens...");

    try {
      await stakeTokens(ideaAddressToStake, stakeAmount);
      setTxStatus(`Successfully staked ${stakeAmount} tokens to ${ideaAddressToStake}`);
    } catch (error) {
      console.error("Error staking tokens:", error);
      setTxStatus("Error staking tokens: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleWithdrawFromTreasury = async () => {
    if (isTransacting) return;
    if (!withdrawAmount) {
      alert("Please enter an amount to withdraw.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Withdrawing tokens...");

    try {
      await withdrawFromTreasury(withdrawAmount, account);
      setTxStatus(`Successfully withdrew ${withdrawAmount} tokens to ${account}`);
    } catch (error) {
      console.error("Error staking tokens:", error);
      setTxStatus("Error staking tokens: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleNominate = async () => {
    if (isTransacting) return;
    if (!nominateAdd || !nominateID) {
      alert("Please enter address and ID.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Nominating comment...");

    try {
      await nominateComment(nominateAdd, nominateID);
      setTxStatus(`Successfully nominated comment: ${nominateID}.`);
    } catch (error) {
      console.error("Error nominating:", error);
      setTxStatus("Error nominating:" + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handlePVote = async () => {
    if (isTransacting) return;
    if (!pVoteAdd || !pVoteID) {
      alert("Please enter address and ID.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Voting on comment...");

    try {
      await voteOnProposal(pVoteAdd, pVoteID, pVoteAmount);
      setTxStatus(`Successfully voted ${pVoteAmount} onto comment: ${nominateID}.`);
    } catch (error) {
      console.error("Error nominating:", error);
      setTxStatus("Error nominating:" + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleViewPVote = async () => {
    if (isTransacting) return;
  
    if (!pVoteViewAdd || !pVoteViewID) {
      alert("Please enter both the Idea address and Comment ID.");
      return;
    }
  
    setIsTransacting(true);
    setTxStatus("Retrieving proposal vote info...");
  
    try {
      const total = await getTotalTokenVotes(pVoteViewAdd, pVoteViewID);
      const user = await getTokenVotes(pVoteViewAdd, pVoteViewID, account);
      const top = await getWinningProposal(pVoteViewAdd);
  
      setTotalVotes(total);
      setUserVotes(user);
      setWinningProposalID(top.winningCommentID);
      setWinningProposalVotes(top.winningVoteCount);
  
      setTxStatus("Successfully retrieved proposal vote info.");
    } catch (error) {
      console.error("Error viewing:", error);
      setTxStatus("Error viewing: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleGetStakedAmount = async () => {
    if (isTransacting) return;
    if (!stakedAmountViewAdd) {
      alert("Please enter address.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Getting staked amount");

    try {
      const amount = await getStakedAmount(stakedAmountViewAdd, account);
      const total = await getTotalStaked(stakedAmountViewAdd);

      setStakedAmountView(amount);
      setTotalStakedAmount(total);

      setTxStatus(`Successfully got staked amount.`);
    } catch (error) {
      console.error("Error viewing:", error);
      setTxStatus("Error viewing:" + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleGetStatusVoteData = async () => {
    if (isTransacting) return;

    if (!statusVoteDataIdea) {
      alert("Please enter the Idea address.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Retrieving status vote data...");

    try {
      const data = await getStatusVoteData(statusVoteDataIdea);
      setStatusVoteDataResult(data);
      setTxStatus("Status vote data retrieved successfully.");
    } catch (error) {
      console.error("Error in getStatusVoteData:", error);
      setTxStatus("Error retrieving status vote data: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleVoteOnStatus = async () => {
    if (isTransacting) return;

    if (!voteStatusIdea) {
      alert("Please enter the Idea address.");
      return;
    }
    // statusOption must be a number. Typically: 0=End, 1=Cancel, 2=Extend
    const parsedOption = parseInt(voteStatusOption, 10);
    if (isNaN(parsedOption) || parsedOption < 0 || parsedOption > 2) {
      alert("Invalid status option. Must be 0 (End), 1 (Cancel), or 2 (Extend).");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Casting status vote transaction...");

    try {
      const receipt = await voteOnStatus(voteStatusIdea, parsedOption);
      setTxStatus(`Status vote cast. Tx hash: ${receipt.transactionHash}`);
    } catch (error) {
      console.error("Error in voteOnStatus:", error);
      setTxStatus("Error voting on status: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  const handleStartStatusVote = async () => {
    if (isTransacting) return;

    if (!startStatusVoteIdea) {
      alert("Please enter the Idea address.");
      return;
    }

    setIsTransacting(true);
    setTxStatus("Starting status vote transaction...");

    try {
      const receipt = await startStatusVote(startStatusVoteIdea);
      setTxStatus(`Status vote started. Tx hash: ${receipt.transactionHash}`);
    } catch (error) {
      console.error("Error in startStatusVote:", error);
      setTxStatus("Error starting status vote: " + error.message);
    } finally {
      setIsTransacting(false);
    }
  };

  return (

    <div style={{ padding: "1rem" }}>
      <h1><strong>Blockchain Demo</strong></h1>
      <hr />
      <h2>IDEA Token Address</h2>
      <p>
        Add it to your MetaMask wallet after connection to Sepolia
      </p>
      <p>
        0x2DfaD8af3d02628376104c02337CA0AEC5147143
      </p>
      <h3>Existing Idea Address for Testing</h3>
      <p>
        0x1a995172e966F75ffaF4023B76622FB9F6bf7806
      </p>
      <hr />
      <h3>
        <strong>MetaMask Transaction Status:</strong> {txStatus || "Idle"}
      </h3>

      {/* Connect Wallet */}
      <hr />
      <p>
        <strong>Connected Account:</strong> {account || "None"}<br />
      </p>
      <button onClick={connectWallet} disabled={isTransacting || account}>
        {isTransacting ? "Connecting..." : "Connect Wallet"}
      </button>
      <hr />

      {/* Withdraw tokens */}
      <h3>Get Tokens From Treasury</h3>
      <p>Withdraw some tokens from the treasury.</p>
      <div>
        <label>Amount to withdraw:&nbsp;</label>
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />
      </div>
      <button onClick={handleWithdrawFromTreasury} disabled={!account || isTransacting}>
        Withdraw
      </button>
      <hr />

      {/* Create Idea */}
      <h3>Create a New Idea</h3>
      <p>This will deploy a new Idea contract with the specified duration.</p>
      <div>
        <label>Idea Duration (seconds):&nbsp;</label>
        <input
          type="number"
          value={ideaDuration}
          onChange={(e) => setIdeaDuration(e.target.value)}
          placeholder="e.g. 3600"
        />
      </div>
      <button onClick={handleCreateIdea} disabled={!account || isTransacting}>
        Create Idea
      </button>
      {createdIdeaAddress && (
        <p>New Idea Address: <strong>{createdIdeaAddress}</strong></p>
      )}

      <p></p>

      {/* Stake Tokens */}
      <h3>Stake Tokens To Idea</h3>
      <p>Stake tokens into an existing Idea contract you already created.</p>
      <div>
        <label>Idea Contract Address:&nbsp;</label>
        <input
          value={ideaAddressToStake}
          onChange={(e) => setIdeaAddressToStake(e.target.value)}
          placeholder="0x123..."
        />
      </div>
      <div>
        <label>Amount to Stake:&nbsp;</label>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <button onClick={handleStakeTokens} disabled={!account || isTransacting}>
        Stake Tokens
      </button>

      <p>

      </p>
      {/* View staked amount*/}
      <h3>
        View staked amount
      </h3>
      <p>
        Get the amount of tokens you staked to a specific idea address.
      </p>
      <div>
        <label>Idea address&nbsp;</label>
        <input
          type="text"
          value={stakedAmountViewAdd}
          onChange={(e) => setStakedAmountViewAdd(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <button onClick={handleGetStakedAmount} disabled={!account || isTransacting}>
        View Amount Staked
      </button>
      {stakedAmountView && (
        <div>

          <p>Your Staked Amount: <strong>{stakedAmountView}</strong></p>
          <p>Total Staked Amount: <strong>{totalStakedAmount}</strong></p>
        </div>
      )}


      <hr />

      {/* Nominate Comment */}
      <h2>Proposal Voting</h2>
      <hr />
      <h4>Nominate a comment to become a proposal</h4>
      <p>Provide a commentID of a comment you'd like to nominate.</p>
      <div>
        <label>Idea Contract Address:&nbsp;</label>
        <input
          value={nominateAdd}
          onChange={(e) => setNominateAdd(e.target.value)}
          placeholder="0x123..."
        />
      </div>
      <div>
        <label>Comment ID:&nbsp;</label>
        <input
          type="number"
          value={nominateID}
          onChange={(e) => setNominateID(e.target.value)}
          placeholder="e.g. 12345"
        />
      </div>
      <button onClick={handleNominate} disabled={!account || isTransacting}>
        Nominate
      </button>

      <p></p>

      {/* Vote on a Nominated Comment (Proposal) */}
      <h4>Vote in the Proposal Vote</h4>
      <p>Choose a proposal and decide how many token votes you want to allot to it.</p>
      <div>
        <label>Idea Contract Address:&nbsp;</label>
        <input
          value={pVoteAdd}
          onChange={(e) => setPVoteAdd(e.target.value)}
          placeholder="0x123..."
        />
      </div>
      <div>
        <label>Comment ID&nbsp;</label>
        <input
          type="number"
          value={pVoteID}
          onChange={(e) => setPVoteID(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <div>
        <label>Amount to vote:&nbsp;</label>
        <input
          type="number"
          value={pVoteAmount}
          onChange={(e) => setPVoteAmount(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <button onClick={handlePVote} disabled={!account || isTransacting}>
        Vote
      </button>

      <p>
      </p>

      {/* View data of the proposal vote + single comment*/}
      <h4>View the Proposal Vote Data</h4>
      <p>See current state of the proposal vote for a specific proposal</p>
      <div>
        <label>Idea Contract Address:&nbsp;</label>
        <input
          value={pVoteViewAdd}
          onChange={(e) => setPVoteViewAdd(e.target.value)}
          placeholder="0x123..."
        />
      </div>
      <div>
        <label>Comment ID&nbsp;</label>
        <input
          type="number"
          value={pVoteViewID}
          onChange={(e) => setPVoteViewID(e.target.value)}
          placeholder="e.g. 10"
        />
      </div>
      <button onClick={handleViewPVote} disabled={!account || isTransacting}>
        View Data
      </button>
      {totalVotes && (
        <div>
          <p>Total votes: <strong>{totalVotes}</strong></p>
          <p>Your votes: <strong>{userVotes}</strong></p>
          <p>Winning Proposal ID: <strong>{winningProposalID}</strong></p>
          <p>Winning Proposal Votes: <strong>{winningProposalVotes}</strong></p>
        </div>
      )}

      <hr />

      <h2>Status Voting</h2>

      <hr />

      {/* 1) getStatusVoteData */}
      <h4>Get Status Vote Data</h4>
      <p>View the current state of the status vote.</p>
      <div>
        <label>Idea Contract Address</label>
        <input
          type="text"
          placeholder="0x123..."
          value={statusVoteDataIdea}
          onChange={(e) => setStatusVoteDataIdea(e.target.value)}
        />

      </div>

      <button onClick={handleGetStatusVoteData} disabled={isTransacting}>
        Get Status Vote Data
      </button>

      {statusVoteDataResult && (
        <div>
          <p>End Votes: {statusVoteDataResult.endVotes}</p>
          <p>Cancel Votes: {statusVoteDataResult.cancelVotes}</p>
          <p>Extend Votes: {statusVoteDataResult.extendVotes}</p>
          <p>Extension Count: {statusVoteDataResult.extensionCount}</p>
          <p>Threshold Time: {statusVoteDataResult.thresholdTime}</p>
        </div>
      )}

      <hr />

      {/* 2) voteOnStatus */}
      <h4>Vote on Status (0=End, 1=Cancel, 2=Extend)</h4>
      <input
        type="text"
        placeholder="Idea Address"
        value={voteStatusIdea}
        onChange={(e) => setVoteStatusIdea(e.target.value)}
      />
      <input
        type="number"
        placeholder="Status Option"
        value={voteStatusOption}
        onChange={(e) => setVoteStatusOption(e.target.value)}
      />
      <button onClick={handleVoteOnStatus} disabled={isTransacting || !account}>
        Cast Status Vote
      </button>

      <hr />

      {/* 3) startStatusVote */}
      <h4>Start Status Vote</h4>
      <input
        type="text"
        placeholder="Idea Address"
        value={startStatusVoteIdea}
        onChange={(e) => setStartStatusVoteIdea(e.target.value)}
      />
      <button onClick={handleStartStatusVote} disabled={isTransacting || !account}>
        Start Status Vote
      </button>

    </div>
  );
}

export default Blockchain;
