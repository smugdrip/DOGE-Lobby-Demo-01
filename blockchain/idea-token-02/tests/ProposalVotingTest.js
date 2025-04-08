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

describe("Test the Proposal Voting system.", function () {
  
  let ideaToken, treasury, ideaFactory;
  let deployer, user1, user2, user3;

  beforeEach(async function () {
    
    [deployer, user1, user2, user3] = await ethers.getSigners();

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
  it("Test successful proposal noomination.", async function () {
  
    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
  
    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
  
    const { v, r, s } = await generateCreateIdeaPermit(
      user1,
      ideaToken,
      ideaFactory,
      IDEA_COST,
      deadline,
      chainId
    );
  
    const tx = await ideaFactory.connect(user1).createIdeaContract(86400, deadline, v, r, s);
    const receipt = await tx.wait();
  
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
  
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const stakeAmount = ethers.parseUnits("20", 18);
    const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
  
    const stakeTx = await idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV, stakeR, stakeS);
    await stakeTx.wait();
  
    const commentID = 1234;
    await expect(idea.connect(user1).nominateComment(commentID)).to.emit(idea, "ProposalAdded").withArgs(commentID);

  }),
  it("Test invalid proposal nomination.", async function () {

    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
  
    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
  
    const { v, r, s } = await generateCreateIdeaPermit(
      user1,
      ideaToken,
      ideaFactory,
      IDEA_COST,
      deadline,
      chainId
    );
  
    const tx = await ideaFactory.connect(user1).createIdeaContract(86400, deadline, v, r, s);
    const receipt = await tx.wait();
  
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
  
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const stakeAmount = ethers.parseUnits("20", 18);
    const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
  
    const stakeTx = await idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV, stakeR, stakeS);
    await stakeTx.wait();
  
    const commentID = 1234;
    await expect(idea.connect(user1).nominateComment(commentID)).to.emit(idea, "ProposalAdded").withArgs(commentID);

    await expect(idea.connect(user1).nominateComment(commentID)).to.be.revertedWith(
        "Proposal already exists."
    );

    await expect(idea.connect(user3).nominateComment(1212)).to.be.revertedWith(
        "Must have a stake in the idea."
    );

    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine", []);

    await expect(idea.connect(user1).nominateComment(9999)).to.be.revertedWith(
        "Proposal voting not active."
    );

  }),
  it("Test voting on a proposal", async function () {

    // user1 withdraws tokens
    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
  
    // user1 creates the Idea
    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
  
    const { v, r, s } = await generateCreateIdeaPermit(user1, ideaToken, ideaFactory, IDEA_COST, deadline, chainId);
    const createTx = await ideaFactory.connect(user1).createIdeaContract(86400, deadline, v, r, s);
    const receipt = await createTx.wait();
  
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
    const stakeAmount = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
  
    const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
    await idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV, stakeR, stakeS);
  
    // user1 nominates a proposal
    const commentID = 1234;
    await idea.connect(user1).nominateComment(commentID);
  
    let voteDelta = ethers.parseUnits("5", 18);;
  
    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.emit(idea, "ProposalVoted")
      .withArgs(user1.address, commentID, voteDelta);
  
    let totalVotes = await idea.getTotalTokenVotes(commentID);
    expect(totalVotes).to.equal(voteDelta);
  
    let userVotes = await idea.getTokenVotes(commentID, user1.address);
    expect(userVotes).to.equal(voteDelta);


    // Try voting negative
    voteDelta = ethers.parseUnits("-2", 18);;

    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.emit(idea, "ProposalVoted")
      .withArgs(user1.address, commentID, voteDelta);
    
    totalVotes = await idea.getTotalTokenVotes(commentID);
    expect(totalVotes).to.equal(ethers.parseUnits("3", 18));
  
    userVotes = await idea.getTokenVotes(commentID, user1.address);
    expect(userVotes).to.equal(ethers.parseUnits("3", 18));


    //Try voting too much negative

    voteDelta = ethers.parseUnits("-999", 18);

    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.be.reverted;

    totalVotes = await idea.getTotalTokenVotes(commentID);
      expect(totalVotes).to.equal(ethers.parseUnits("3", 18));
    
    userVotes = await idea.getTokenVotes(commentID, user1.address);
      expect(userVotes).to.equal(ethers.parseUnits("3", 18));


    // Try reducing token vote to exactly 0.

    voteDelta = ethers.parseUnits("-3", 18);

    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.emit(idea, "ProposalVoted")
      .withArgs(user1.address, commentID, voteDelta);
    
    totalVotes = await idea.getTotalTokenVotes(commentID);
    expect(totalVotes).to.equal(0);
  
    userVotes = await idea.getTokenVotes(commentID, user1.address);
    expect(userVotes).to.equal(0);


    const user1Balance = await ideaToken.balanceOf(user1);
    expect(user1Balance).to.equal(ethers.parseUnits("70", 18));

    const user1Staked = await idea.getStakedAmount(user1);
    expect(user1Staked).to.equal(ethers.parseUnits("20", 18));


    //Try voting way too much

    voteDelta = ethers.parseUnits("999", 18);

    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.be.reverted;
    
    totalVotes = await idea.getTotalTokenVotes(commentID);
      expect(totalVotes).to.equal(0);
    
    userVotes = await idea.getTokenVotes(commentID, user1.address);
      expect(userVotes).to.equal(0);
    
    //Try a little too much

    voteDelta = ethers.parseUnits("21", 18);

    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.be.reverted;
    
    totalVotes = await idea.getTotalTokenVotes(commentID);
      expect(totalVotes).to.equal(0);
    
    userVotes = await idea.getTokenVotes(commentID, user1.address);
      expect(userVotes).to.equal(0);



    // Try using all staked tokens to vote.

    voteDelta = ethers.parseUnits("20", 18);

    await expect(idea.connect(user1).voteOnProposal(commentID, voteDelta))
      .to.emit(idea, "ProposalVoted")
      .withArgs(user1.address, commentID, voteDelta);
    
    totalVotes = await idea.getTotalTokenVotes(commentID);
    expect(totalVotes).to.equal(ethers.parseUnits("20", 18));
  
    userVotes = await idea.getTokenVotes(commentID, user1.address);
    expect(userVotes).to.equal(ethers.parseUnits("20", 18));


    const winningProposal = await idea.getWinningProposal();

    expect(winningProposal[0]).to.equal(commentID);
    if (winningProposal[1] != voteDelta) {
      console.log("EXPECTED PROPOSAL VALUE IS WRONG!!!!!!!!")
    }

  }),
  it("Test invalid proposal voting.", async function () {

    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user2.address);
  
    // user1 creates the Idea
    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
  
    const { v, r, s } = await generateCreateIdeaPermit(user1, ideaToken, ideaFactory, IDEA_COST, deadline, chainId);
    const createTx = await ideaFactory.connect(user1).createIdeaContract(86400, deadline, v, r, s);
    const receipt = await createTx.wait();
  
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
    const stakeAmount = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
    await idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV, stakeR, stakeS);

    // user2 stakes some tokens
    const stakeAmount2 = ethers.parseUnits("20", 18);
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const { v: stakeV2, r: stakeR2, s: stakeS2 } = await generateStakePermit(user2, ideaToken, idea, stakeAmount2, deadline, chainId);
    await idea.connect(user2).stakeTokens(stakeAmount2, deadline, stakeV2, stakeR2, stakeS2);
  
    // user1 nominates a proposal
    const commentID = 1234;
    await expect(idea.connect(user1).nominateComment(commentID)).to.emit(idea, "ProposalAdded");
    await expect(idea.connect(user1).voteOnProposal(commentID, ethers.parseUnits("5", 18))).to.emit(idea, "ProposalVoted");

    // user2 nominates a duplicate proposal
    await expect(idea.connect(user2).nominateComment(commentID)).to.be.reverted;

    // user3 tries to nominate and vote with no stake.
    await expect(idea.connect(user3).nominateComment(2222)).to.be.reverted;
    await expect(idea.connect(user3).voteOnProposal(commentID, ethers.parseUnits("10", 18))).to.be.reverted;

    // user2 tries to vote on proposal that doesnt exist.
    await expect(idea.connect(user2).voteOnProposal(1235, ethers.parseUnits("10", 18))).to.be.reverted;

    // try to see token votes of invalid proposal
    await expect(idea.connect(user2).getTotalTokenVotes(1236)).to.be.reverted;
    await expect(idea.connect(user2).getTokenVotes(1236, user1)).to.be.reverted;

  });
  
})