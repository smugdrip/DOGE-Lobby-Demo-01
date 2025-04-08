const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const IDEA_COST = ethers.parseUnits("10", 18);

// Helper function to generate the permit signature for createIdeaContract.
async function generateCreateIdeaPermit(signer, ideaToken, ideaFactory, ideaCost, deadline, chainId) {
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
    value: ideaCost.toString(),
    nonce: Number(nonceValue),
    deadline: deadline,
  };

  // Sign the typed data.
  const sig = await signer.signTypedData(domain, types, permitData);
  // Decompose the signature into its components.
  const { v, r, s } = ethers.Signature.from(sig);
  return { v, r, s };
}

// Helper function to generate the permit signature for stakeTokens.
async function generateStakePermit(signer, ideaToken, ideaContract, stakeAmount, deadline, chainId) {
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
}

describe("Test the Status Voting system.", function () {
  
  let ideaToken, treasury, ideaFactory;
  let deployer, user1, user2, user3, user4, user5;

  beforeEach(async function () {
    
    [deployer, user1, user2, user3, user4, user5] = await ethers.getSigners();

    // Deploy Treasury
    const TreasuryFactory = await ethers.getContractFactory("Treasury");
    treasury = await TreasuryFactory.deploy();
    await treasury.waitForDeployment();

    // Deploy IdeaToken
    const IdeaTokenFactory = await ethers.getContractFactory("IdeaToken");
    ideaToken = await IdeaTokenFactory.deploy(treasury);
    await ideaToken.waitForDeployment();
    await treasury.setToken(ideaToken);

    // Deploy IdeaFactory
    const IdeaFactoryFactory = await ethers.getContractFactory("IdeaFactory");
    ideaFactory = await IdeaFactoryFactory.deploy(ideaToken, treasury);
    await ideaFactory.waitForDeployment();

  });
  it("Test normal ending status vote.", async function () {

    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user2.address);
  
    // user1 creates the Idea
    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
    const { v, r, s } = await generateCreateIdeaPermit(user1, ideaToken, ideaFactory, IDEA_COST, deadline, chainId);
    const ideaDuration = 86400;
    const createTx = await ideaFactory.connect(user1).createIdeaContract(ideaDuration, deadline, v, r, s);
    const receipt = await createTx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const ideaStartTime = block.timestamp;
    let ideaAddress;
    for (const log of receipt.logs) {
      try {
        const parsedLog = ideaFactory.interface.parseLog(log);
        if (parsedLog.name === "IdeaCreated") {
          ideaAddress = parsedLog.args.ideaAddress;
          break;
        }
      } catch (e) {}
    }
    const idea = await ethers.getContractAt("Idea", ideaAddress);

    let ideaState = await idea.connect(user1).getIdeaState();
    expect(ideaState).to.equal(true);
  
    // user1 stakes some tokens
    let stakeAmount = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    let { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
    await idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV, stakeR, stakeS);
    await idea.connect(user1).nominateComment(12345);

    await expect(idea.connect(user1).ownerWithdraw()).to.be.reverted;
    await expect(idea.connect(user2).ownerWithdraw()).to.be.reverted;

    // user2 stakes some tokens
    const stakeAmount2 = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV2, r: stakeR2, s: stakeS2 } = await generateStakePermit(user2, ideaToken, idea, stakeAmount2, deadline, chainId);
    await idea.connect(user2).stakeTokens(stakeAmount2, deadline, stakeV2, stakeR2, stakeS2);
    await idea.connect(user2).voteOnProposal(12345, ethers.parseUnits("10", 18));

    let extCount = await idea.connect(user1).getExtensionCount();
    expect(extCount).to.equal(-1);
    let winningStatus = await idea.connect(user1).getWinningStatus();
    expect(winningStatus).to.equal(0);
    let statusStatus = await idea.connect(user1).getStatusVoteStatus();
    expect(statusStatus).to.equal(false);
    let proposalStatus = await idea.connect(user1).getProposalVoteStatus();
    expect(proposalStatus).to.equal(true);

    ideaState = await idea.connect(user1).getIdeaState();
    expect(ideaState).to.equal(true);

    await expect(idea.connect(user1).startStatusVote()).to.be.reverted;

    await ethers.provider.send("evm_increaseTime", [69120]);
    await ethers.provider.send("evm_mine", []);

    ideaState = await idea.connect(user1).getIdeaState();
    expect(ideaState).to.equal(true);

    await expect(idea.connect(user3).startStatusVote()).to.be.reverted;
  
    // Now, start the status vote.
    await idea.connect(user1).startStatusVote();

    ideaState = await idea.connect(user1).getIdeaState();
    expect(ideaState).to.equal(true);
      
    // Check that status vote is now active.
    let statusStatusAfter = await idea.connect(user1).getStatusVoteStatus();
    expect(statusStatusAfter).to.equal(true);
  
    // Check that proposal vote is now inactive.
    let proposalStatusAfter = await idea.connect(user1).getProposalVoteStatus();
    expect(proposalStatusAfter).to.equal(false);
  
    // Check winning status.
    let winningStatusAfter = await idea.connect(user1).getWinningStatus();
    expect(winningStatusAfter).to.equal(2);
  
    // Check that the extension count has incremented from -1 to 0.
    let extCountAfter = await idea.connect(user1).getExtensionCount();
    expect(extCountAfter).to.equal(0);

    // check the timing
    let expectedThresholdTime = ideaStartTime + Math.floor((ideaDuration * 80) / 100);
    let [endVotes, cancelVotes, extendVotes, extensionCount, thresholdTime] = await idea.getStatusVoteData();
    expect(thresholdTime).to.equal(expectedThresholdTime);
    expect(endVotes).to.equal(0);
    expect(cancelVotes).to.equal(0);
    expect(extendVotes).to.equal(0);
    expect(extensionCount).to.equal(0);
    let ideaTimes = await idea.connect(user1).getIdeaTimes();
    expect(ideaTimes).to.deep.equal([
        BigInt(ideaStartTime),
        BigInt(ideaStartTime + ideaDuration),
        BigInt(ideaDuration),
        BigInt(expectedThresholdTime)
    ]);
    
    //try proposal voting
    await expect(idea.connect(user1).nominateComment(12346)).to.be.reverted;
    await expect(idea.connect(user2).voteOnProposal(12345, ethers.parseUnits("10", 18))).to.be.reverted;

    //user2 + user 1 votes to end
    await expect(idea.connect(user1).voteOnStatus(0)).to.emit(idea, "StatusVoted" );

    [endVotes, cancelVotes, extendVotes, extensionCount, thresholdTime] = await idea.getStatusVoteData();
    expect(thresholdTime).to.equal(expectedThresholdTime);
    expect(endVotes).to.equal(1);
    expect(cancelVotes).to.equal(0);
    expect(extendVotes).to.equal(0);
    expect(extensionCount).to.equal(0);

    winningStatusAfter = await idea.connect(user1).getWinningStatus();
    expect(winningStatusAfter).to.equal(0);

    await expect(idea.connect(user2).voteOnStatus(0)).to.emit(idea, "StatusVoted" );

    [endVotes, cancelVotes, extendVotes, extensionCount, thresholdTime] = await idea.getStatusVoteData();
    expect(thresholdTime).to.equal(expectedThresholdTime);
    expect(endVotes).to.equal(2);
    expect(cancelVotes).to.equal(0);
    expect(extendVotes).to.equal(0);
    expect(extensionCount).to.equal(0);

    winningStatusAfter = await idea.connect(user1).getWinningStatus();
    expect(winningStatusAfter).to.equal(0);

    await expect(idea.connect(user3).voteOnStatus(0)).to.be.reverted;


    await treasury.withdraw(ethers.parseUnits("100", 18), user3.address);

    // user3 tries to stake some tokens
    const stakeAmount3 = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV3, r: stakeR3, s: stakeS3 } = await generateStakePermit(user3, ideaToken, idea, stakeAmount, deadline, chainId);
    await expect(idea.connect(user3).stakeTokens(stakeAmount3, deadline, stakeV3, stakeR3, stakeS3)).to.be.reverted;

    await expect(idea.connect(user1).voteOnStatus(1)).to.be.reverted;
    await expect(idea.connect(user1).voteOnStatus(0)).to.be.reverted;

    await ethers.provider.send("evm_increaseTime", [69120]);
    await ethers.provider.send("evm_mine", []);

    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    let { v: stakeV0, r: stakeR0, s: stakeS0 } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
    await expect(idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV0, stakeR0, stakeS0)).to.be.reverted;
    
    await idea.connect(user1).endStatusVote();

    const ideaState1 = await idea.connect(user1).getIdeaState();
    expect(ideaState1).to.equal(false);

    let tStake = await idea.connect(user2).getTotalStaked();
    expect(tStake).to.equal(ethers.parseUnits("40",18))

    await idea.connect(user1).ownerWithdraw();

    const user1Balance = await ideaToken.balanceOf(user1);
    expect(user1Balance).to.equal(ethers.parseUnits("110", 18));


  }),
  it("Test Extend x2  then cancel status vote.", async function () {

    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user2.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user3.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user4.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user5.address);
  
    // user1 creates the Idea
    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
    const { v, r, s } = await generateCreateIdeaPermit(user1, ideaToken, ideaFactory, IDEA_COST, deadline, chainId);
    const ideaDuration = 86400;
    const createTx = await ideaFactory.connect(user1).createIdeaContract(ideaDuration, deadline, v, r, s);
    const receipt = await createTx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const ideaStartTime = block.timestamp;
    let ideaAddress;
    for (const log of receipt.logs) {
      try {
        const parsedLog = ideaFactory.interface.parseLog(log);
        if (parsedLog.name === "IdeaCreated") {
          ideaAddress = parsedLog.args.ideaAddress;
          break;
        }
      } catch (e) {}
    }
    const idea = await ethers.getContractAt("Idea", ideaAddress);
  
    // user1 stakes some tokens
    let stakeAmount1 = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount1, deadline, chainId);
    await idea.connect(user1).stakeTokens(stakeAmount1, deadline, stakeV, stakeR, stakeS);

    let staked = await idea.connect(user1).getTotalStaked();
    expect(staked).to.equal(ethers.parseUnits("20", 18));

    // user2 stakes some tokens
    const stakeAmount2 = ethers.parseUnits("50", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV2, r: stakeR2, s: stakeS2 } = await generateStakePermit(user2, ideaToken, idea, stakeAmount2, deadline, chainId);
    await idea.connect(user2).stakeTokens(stakeAmount2, deadline, stakeV2, stakeR2, stakeS2);
    
    staked = await idea.connect(user2).getTotalStaked();
    expect(staked).to.equal(ethers.parseUnits("70", 18));

    // user3 stakes some tokens
    const stakeAmount3 = ethers.parseUnits("70", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV3, r: stakeR3, s: stakeS3 } = await generateStakePermit(user3, ideaToken, idea, stakeAmount3, deadline, chainId);
    await idea.connect(user3).stakeTokens(stakeAmount3, deadline, stakeV3, stakeR3, stakeS3);

    staked = await idea.connect(user2).getTotalStaked();
    expect(staked).to.equal(ethers.parseUnits("140", 18));

    // user4 stakes some tokens
    const stakeAmount4 = ethers.parseUnits("70", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV4, r: stakeR4, s: stakeS4 } = await generateStakePermit(user4, ideaToken, idea, stakeAmount4, deadline, chainId);
    await idea.connect(user4).stakeTokens(stakeAmount4, deadline, stakeV4, stakeR4, stakeS4);

    staked = await idea.connect(user2).getTotalStaked();
    expect(staked).to.equal(ethers.parseUnits("210", 18));

    await ethers.provider.send("evm_increaseTime", [69120]);
    await ethers.provider.send("evm_mine", []);

    await idea.connect(user1).startStatusVote();

    await idea.connect(user1).voteOnStatus(2);
    await idea.connect(user2).voteOnStatus(2);
    await idea.connect(user3).voteOnStatus(0);

    let statusVoteData = await idea.connect(user1).getStatusVoteData();
    expect(statusVoteData.endVotes).to.equal(1);
    expect(statusVoteData.cancelVotes).to.equal(0);
    expect(statusVoteData.extendVotes).to.equal(2);

    await ethers.provider.send("evm_increaseTime", [17280]);
    await ethers.provider.send("evm_mine", []);

    let status = await idea.connect(user1).getStatusVoteStatus();
    expect(status).to.equal(true);
    statusVoteData = await idea.connect(user1).getStatusVoteData();
    expect(statusVoteData.endVotes).to.equal(1);
    expect(statusVoteData.cancelVotes).to.equal(0);
    expect(statusVoteData.extendVotes).to.equal(2);

    await expect(idea.connect(user1).voteOnStatus(2)).to.be.reverted;
    await expect(idea.connect(user4).voteOnStatus(2)).to.be.reverted;

    await idea.connect(user1).endStatusVote();

    let ideaState = await idea.connect(user1).getIdeaState();
    
    expect(ideaState).to.equal(true);

    statusVoteData = await idea.connect(user1).getStatusVoteData();
    expect(statusVoteData.endVotes).to.equal(0);
    expect(statusVoteData.cancelVotes).to.equal(0);
    expect(statusVoteData.extendVotes).to.equal(0);

    let winner = await idea.connect(user1).getWinningStatus();
    expect(winner).to.equal(2);


    let extensionPeriod = (ideaDuration * 75) / 100;
    let newStatusThresh = (ideaStartTime + ideaDuration) + (extensionPeriod * 80) / 100;
    let ideaTimes = await idea.connect(user1).getIdeaTimes();
    expect(ideaTimes).to.deep.equal([
        BigInt(ideaStartTime),
        BigInt(ideaStartTime + ideaDuration + extensionPeriod),
        BigInt(ideaDuration),
        BigInt(newStatusThresh)
    ]);


    await ethers.provider.send("evm_increaseTime", [((extensionPeriod * 80) / 100)]);
    await ethers.provider.send("evm_mine", []);

    await idea.connect(user1).startStatusVote();

    await idea.connect(user1).voteOnStatus(1);
    await idea.connect(user2).voteOnStatus(1);
    await idea.connect(user3).voteOnStatus(1);
    await idea.connect(user4).voteOnStatus(1);

    await expect(idea.connect(user4).voteOnStatus(1)).to.be.reverted;

    statusVoteData = await idea.connect(user1).getStatusVoteData();
    expect(statusVoteData.endVotes).to.equal(0);
    expect(statusVoteData.cancelVotes).to.equal(4);
    expect(statusVoteData.extendVotes).to.equal(0);

    await ethers.provider.send("evm_increaseTime", [((extensionPeriod * 20) / 100)]);
    await ethers.provider.send("evm_mine", []);

    status = await idea.connect(user1).getStatusVoteStatus();
    expect(status).to.equal(true);
    statusVoteData = await idea.connect(user1).getStatusVoteData();
    expect(statusVoteData.endVotes).to.equal(0);
    expect(statusVoteData.cancelVotes).to.equal(4);
    expect(statusVoteData.extendVotes).to.equal(0);

    await idea.connect(user1).endStatusVote();

    ideaState = await idea.connect(user1).getIdeaState();
    
    expect(ideaState).to.equal(false);



    await idea.connect(user1).withdrawStake();
    await idea.connect(user2).withdrawStake();
    await idea.connect(user3).withdrawStake();
    await idea.connect(user4).withdrawStake();


    staked = await idea.connect(user1).getTotalStaked();
    
    expect(staked).to.equal(0);


  });

});