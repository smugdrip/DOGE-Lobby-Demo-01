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

describe("Test Staking to Ideas.", function () {
  
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
  it("Test creating an Idea with IdeaFactory.", async function () {

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const currentBlock = await ethers.provider.getBlock("latest");
    const deadline = currentBlock.timestamp + 3600;

    // Generate the permit signature using our helper function.
    const { v, r, s } = await generateCreateIdeaPermit(user1, ideaToken, ideaFactory, IDEA_COST, deadline, chainId);

    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);
    await treasury.withdraw(ethers.parseUnits("100", 18), user2.address);

    // Check initial balances.
    const user1Balance = await ideaToken.balanceOf(user1);
    const user2Balance = await ideaToken.balanceOf(user2);
    const treasuryBalance = await ideaToken.balanceOf(treasury);
    // Expected: user1 and user2 have 100 tokens each.
    expect(user1Balance).to.equal(ethers.parseUnits("100", 18));
    expect(user2Balance).to.equal(ethers.parseUnits("100", 18));
    // Treasury should have initial supply (1,000,000 tokens) minus 200 tokens withdrawn.
    const expectedTreasuryBalance = ethers.parseUnits("999800", 18);
    expect(treasuryBalance).to.equal(expectedTreasuryBalance);

    // Create the Idea contract.
    const tx = await ideaFactory
      .connect(user1)
      .createIdeaContract(86400, deadline, v, r, s);

    // Now, expect that the event IdeaCreated is emitted.
    await expect(tx)
      .to.emit(ideaFactory, "IdeaCreated")
      .withArgs(user1.address, anyValue);
    
    // Wait for the transaction receipt.
    const receipt = await tx.wait();
    
    // Manually parse the logs to find the IdeaCreated event.
    let ideaAddress;
    for (const log of receipt.logs) {
      try {
        // Attempt to parse the log using the IdeaFactory interface.
        const parsedLog = ideaFactory.interface.parseLog(log);
        if (parsedLog.name === "IdeaCreated") {
          ideaAddress = parsedLog.args.ideaAddress;
          break;
        }
      } catch (e) {
        // Ignore logs that do not belong to IdeaFactory.
      }
    }
    
    // check that the ideaAddress is a valid address.
    expect(ideaAddress).to.properAddress;

    // After creation, user1's balance should drop by 10 tokens.
    const user1BalanceAfter = await ideaToken.balanceOf(user1);
    expect(user1BalanceAfter).to.equal(ethers.parseUnits("90", 18));
    
    // Treasury receives the upfront cost, so its balance increases by 10 tokens.
    const treasuryBalanceAfter = await ideaToken.balanceOf(treasury);
    expect(treasuryBalanceAfter).to.equal(ethers.parseUnits("999810", 18));

    // Get the Idea contract instance.
    const ideaContract = await ethers.getContractAt("Idea", ideaAddress);
    
    // Test that getTotalStaked() returns 0 initially.
    const totalStakedInitial = await ideaContract.getTotalStaked();
    expect(totalStakedInitial).to.equal(0);
    
    // Test that getOwnerAddress() returns user1's address.
    const ideaOwner = await ideaContract.getOwnerAddress();
    expect(ideaOwner).to.equal(user1);

  }),
  it("Test creating and staking tokens to an idea", async function () {
    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address);

    let chainId = (await ethers.provider.getNetwork()).chainId;
    let currentBlock = await ethers.provider.getBlock("latest");
    let deadline = currentBlock.timestamp + 3600;
    const { v, r, s } = await generateCreateIdeaPermit(user1, ideaToken, ideaFactory, IDEA_COST, deadline, chainId);
  
    const tx = await ideaFactory.connect(user1).createIdeaContract(86400, deadline, v, r, s);
    await expect(tx).to.emit(ideaFactory, "IdeaCreated").withArgs(user1.address, anyValue);
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
    expect(ideaAddress).to.properAddress;
  
    const idea = await ethers.getContractAt("Idea", ideaAddress);
  
    chainId = (await ethers.provider.getNetwork()).chainId;
    currentBlock = await ethers.provider.getBlock("latest");
    deadline = currentBlock.timestamp + 3600;
    const stakeAmount = ethers.parseUnits("20", 18);
    const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(user1, ideaToken, idea, stakeAmount, deadline, chainId);
  
    const stakeTx = await idea.connect(user1).stakeTokens(stakeAmount, deadline, stakeV, stakeR, stakeS);
    await stakeTx.wait();
  
    const user1BalanceAfter = await ideaToken.balanceOf(user1);
    expect(user1BalanceAfter).to.equal(ethers.parseUnits("70", 18));
  
    const treasuryBalanceAfter = await ideaToken.balanceOf(treasury);
    expect(treasuryBalanceAfter).to.equal(ethers.parseUnits("999910", 18));
  

  }),
  it("Test invalid staking.", async function () {
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
  
    async function stakeWithPermit(staker, stakingAmount) {
      chainId = (await ethers.provider.getNetwork()).chainId;
      currentBlock = await ethers.provider.getBlock("latest");
      deadline = currentBlock.timestamp + 3600;
  
      const { v: stakeV, r: stakeR, s: stakeS } = await generateStakePermit(
        staker,
        ideaToken,
        idea,
        stakingAmount,
        deadline,
        chainId
      );
  
      return idea.connect(staker).stakeTokens(stakingAmount, deadline, stakeV, stakeR, stakeS);
    }

    await expect(stakeWithPermit(user1, 0)).to.be.revertedWith(
      "Must stake more than 0 tokens."
    );
  
    const bigStakeAmount = ethers.parseUnits("9999999", 18);

    await expect(stakeWithPermit(user1, bigStakeAmount)).to.be.reverted
  
    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine", []);
    await expect(stakeWithPermit(user1, ethers.parseUnits("10", 18))).to.be.revertedWith(
      "Staking not active"
    );
  });
  

});
