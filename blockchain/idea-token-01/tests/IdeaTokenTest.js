const { expect } = require("chai");
//hardhat ethers:
// npm install --save-dev ethers @nomicfoundation/hardhat-ethers
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


describe("Idea System Tests", function () {
  
  let ideaToken, treasury, ideaFactory, treasuryBad;
  let deployer, user1, user2, user3;

  beforeEach(async function () {
    
    [deployer, user1, user2, user3] = await ethers.getSigners();

    // Deploy Treasury, passing the IdeaToken address.
    const TreasuryFactory = await ethers.getContractFactory("Treasury");
    treasury = await TreasuryFactory.deploy({ gasLimit: 5_000_000 });
    await treasury.waitForDeployment();
    
    treasuryBad = await TreasuryFactory.deploy({ gasLimit: 5_000_000 });
    await treasuryBad.waitForDeployment();

    
    // Deploy IdeaToken (using OpenZeppelin's ERC20, assume _mint is public for testing)
    const IdeaTokenFactory = await ethers.getContractFactory("IdeaToken");
    ideaToken = await IdeaTokenFactory.deploy(treasury,{ gasLimit: 5_000_000 } );
    await ideaToken.waitForDeployment();

    await treasury.setToken(ideaToken,{ gasLimit: 5_000_000 });

    // For testing purposes, mint tokens to user1 and user2.
    await treasury.withdraw(ethers.parseUnits("100", 18), user1.address,{ gasLimit: 5_000_000 });
    await treasury.withdraw(ethers.parseUnits("100", 18), user2.address,{ gasLimit: 5_000_000 } );

    // Deploy IdeaFactory with references to IdeaToken, Treasury, and the upfront cost.
    const IdeaFactoryFactory = await ethers.getContractFactory("IdeaFactory");
    ideaFactory = await IdeaFactoryFactory.deploy(ideaToken, treasury, { gasLimit: 5_000_000 });
    await ideaFactory.waitForDeployment();
  });

  it("test creating a post and staking to it", async function () {

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

    // The IdeaFactory charges an upfront cost of 10 tokens (transferred from user1 to treasury).
    await ideaToken.connect(user1).approve(ideaFactory, ethers.parseUnits("10", 18),{ gasLimit: 5_000_000 });
    // Then, user1 calls createIdeaContract on the IdeaFactory.
    // This call should emit the IdeaCreated event.
    const tx = await ideaFactory.connect(user1).createIdeaContract("user1", 1000, { gasLimit: 5_000_000 });

    // Now, expect that the event IdeaCreated is emitted.
    await expect(tx)
      .to.emit(ideaFactory, "IdeaCreated")
      .withArgs("user1", user1.address, anyValue);
    
    // Wait for the transaction receipt.
    const receipt = await tx.wait();
    
    // Extract the ideaAddress from the event by waiting for the receipt.
    // (Here we assume the IdeaCreated event is the first emitted event.)
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
    
    // user1 attempts to call endStaking before time expires; this should revert.
    await expect(ideaContract.connect(user1).endStaking({ gasLimit: 5_000_000 }))
         .to.be.revertedWith("Staking period not ended yet");
    
    // user2 stakes 1 token to the idea.
    await ideaToken.connect(user2).approve(ideaContract.target, ethers.parseUnits("1", 18), { gasLimit: 5_000_000 });
    await ideaContract.connect(user2).stakeTokens("user2", ethers.parseUnits("1", 18), { gasLimit: 5_000_000 });
    
    // Check that total staked is now 1 token.
    const totalStakedAfter = await ideaContract.getTotalStaked();
    expect(totalStakedAfter).to.equal(ethers.parseUnits("1", 18));
    
    // And getStakedAmount for user2 equals 1 token.
    const user2Staked = await ideaContract.getStakedAmount(user2);
    expect(user2Staked).to.equal(ethers.parseUnits("1", 18));
    
  }),
  it("should reject staking after period ends and allow owner to withdraw staked tokens", async function () {
    // Create an idea with a short staking duration (e.g., 10 seconds).
    await ideaToken.connect(user1).approve(ideaFactory, ethers.parseUnits("10", 18),{ gasLimit: 5_000_000 });
    const tx = await ideaFactory.connect(user1).createIdeaContract("user1", 10, { gasLimit: 5_000_000 });
    const receipt = await tx.wait();
  
    // Extract the Idea contract address from the IdeaCreated event.
    let ideaAddress;
    for (const log of receipt.logs) {
      try {
        const parsedLog = ideaFactory.interface.parseLog(log);
        if (parsedLog.name === "IdeaCreated") {
          ideaAddress = parsedLog.args.ideaAddress;
          break;
        }
      } catch (e) {
        // Ignore logs that are not from IdeaFactory.
      }
    }
    expect(ideaAddress).to.properAddress;
    const ideaContract = await ethers.getContractAt("Idea", ideaAddress);
  
    // user2 stakes 2 tokens before the staking period expires.
    await ideaToken.connect(user2).approve(ideaContract, ethers.parseUnits("2", 18), { gasLimit: 5_000_000 });
    await ideaContract.connect(user2).stakeTokens("user2", ethers.parseUnits("2", 18),{ gasLimit: 5_000_000 });
  
    // Fast-forward time by 20 seconds to exceed the staking end time.
    await ethers.provider.send("evm_increaseTime", [20]);
    await ethers.provider.send("evm_mine", []);
  
    // user3 attempts to stake after the staking period; expect revert.
    await ideaToken.connect(user3).approve(ideaContract, ethers.parseUnits("1", 18), { gasLimit: 5_000_000 });
    await expect(
      ideaContract.connect(user3).stakeTokens("user3", ethers.parseUnits("1", 18),{ gasLimit: 5_000_000 })
    ).to.be.revertedWith("Staking period has expired");
  
    // Now, the idea owner ends staking.
    await expect(ideaContract.connect(user1).endStaking({ gasLimit: 5_000_000 }))
      .to.emit(ideaContract, "StakingEnded");
  
    // Confirm that all staked tokens (2 tokens) are transferred to the idea owner.
    const contractBalance = await ideaToken.balanceOf(ideaContract);
    expect(contractBalance).to.equal(0);
  
    // user1 originally paid 10 tokens to create the idea, so initial balance was 100 - 10 = 90.
    // After withdrawing the 2 staked tokens, their balance should now be 92 tokens.
    const ownerBalance = await ideaToken.balanceOf(user1);
    expect(ownerBalance).to.equal(ethers.parseUnits("92", 18));
  }),
  it("should reject stakes made with invalid conditions", async function () {

    // user 1 creates the Idea contract
    await ideaToken.connect(user1).approve(ideaFactory, ethers.parseUnits("10", 18), { gasLimit: 5_000_000 });
    const tx = await ideaFactory.connect(user1).createIdeaContract("user1", 10, { gasLimit: 5_000_000 });

    const receipt = await tx.wait();
  
    // Extract the Idea contract address from the IdeaCreated event.
    let ideaAddress;
    for (const log of receipt.logs) {
      try {
        const parsedLog = ideaFactory.interface.parseLog(log);
        if (parsedLog.name === "IdeaCreated") {
          ideaAddress = parsedLog.args.ideaAddress;
          break;
        }
      } catch (e) {
        // Ignore logs that are not from IdeaFactory.
      }
    }
    expect(ideaAddress).to.properAddress;
    const ideaContract = await ethers.getContractAt("Idea", ideaAddress);
    
    // user2 stakes 0 tokens (invalid)
    await ideaToken.connect(user2).approve(ideaContract, ethers.parseUnits("10", 18), { gasLimit: 5_000_000 });
    await expect(
      ideaContract.connect(user2).stakeTokens("user2", ethers.parseUnits("0", 18), { gasLimit: 5_000_000 })
    ).to.be.revertedWith("Stake amount must be greater than zero");

    //try to stake without any tokens
    await ideaToken.connect(user3).approve(ideaContract, ethers.parseUnits("10", 18), { gasLimit: 5_000_000 });
    await expect(
      ideaContract.connect(user3).stakeTokens("user3", ethers.parseUnits("10", 18), { gasLimit: 5_000_000 })
    ).to.be.reverted

    // try to end staking from a non-owner address
    await expect(ideaContract.connect(user2).endStaking({ gasLimit: 5_000_000 }))
         .to.be.revertedWith("Only owner can end staking");
    
    
  }),
  it("treasury testing", async function () {
    // try to set token from non-ownder address:
    await expect(treasuryBad.connect(user1).setToken(ideaToken,{ gasLimit: 5_000_000 }))
      .to.be.revertedWith("Only owner can set token");

    // try to deposit/withdraw w/o token set
    await expect(treasuryBad.connect(user1).deposit(ethers.parseUnits("10", 18),{ gasLimit: 5_000_000 }))
      .to.be.revertedWith("Token not set");
    await expect(treasuryBad.withdraw(ethers.parseUnits("10", 18),user1.address, { gasLimit: 5_000_000 }))
      .to.be.revertedWith("Token not set");

    //set the token
    await treasuryBad.setToken(ideaToken,{ gasLimit: 5_000_000 });

    // try to deposit/withdraw with token set

    // first check balance before
    let user1Balance = await ideaToken.balanceOf(user1);
    expect(user1Balance).to.equal(ethers.parseUnits("100", 18));

    // deposit into treasury
    await ideaToken.connect(user1).approve(treasuryBad, ethers.parseUnits("10", 18), { gasLimit: 5_000_000 });
    await treasuryBad.connect(user1).deposit(ethers.parseUnits("10", 18),{ gasLimit: 5_000_000 })
    
    // check balance again
    user1Balance = await ideaToken.balanceOf(user1);
    expect(user1Balance).to.equal(ethers.parseUnits("90", 18));
    
    // test withdraw
    await treasuryBad.withdraw(ethers.parseUnits("1", 18),user1.address, { gasLimit: 5_000_000 });

    // check balance again
    user1Balance = await ideaToken.balanceOf(user1);
    expect(user1Balance).to.equal(ethers.parseUnits("91", 18));

    // test setting token twice
    await expect(treasuryBad.setToken(ideaToken,{ gasLimit: 5_000_000 }))
      .to.be.revertedWith("Token already set");
    
    // test withdraw from bad acccount
    await expect(treasuryBad.connect(user1).withdraw(ethers.parseUnits("1", 18),user1.address, { gasLimit: 5_000_000 }))
      .to.be.revertedWith("Treasury: only owner can withdraw");
    
    //test withdrawing too much
    await expect(treasuryBad.withdraw(ethers.parseUnits("2000000", 18),user1.address, { gasLimit: 5_000_000 }))
      .to.be.reverted

    // test depositing too much
    await ideaToken.connect(user1).approve(treasuryBad, ethers.parseUnits("10", 18), { gasLimit: 5_000_000 });
    await expect(treasuryBad.connect(user1).deposit(ethers.parseUnits("20", 18),{ gasLimit: 5_000_000 }))
      .to.be.reverted


  }),
  it("invalid idea factory", async function () {
    await ideaToken.connect(user3).approve(ideaFactory, ethers.parseUnits("10", 18),{ gasLimit: 5_000_000 });
    // Then, user1 calls createIdeaContract on the IdeaFactory.
    // This call should emit the IdeaCreated event.
    await expect(ideaFactory.connect(user3).createIdeaContract("user3", 1000, { gasLimit: 5_000_000 }))
      .to.be.reverted
  });

});
