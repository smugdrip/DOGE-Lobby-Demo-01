const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

it("should store a submitted message and emit an event", async function () {
  // Get the deployer (first signer)
  const [owner] = await ethers.getSigners();

  // Deploy the contract
  const HelloWorldFactory = await ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorldFactory.deploy();
  await helloWorld.waitForDeployment();

  // Define a message to submit
  const message = "Hello, Blockchain!";

  // Submit the message and check that the event is emitted with the correct parameters.
  await expect(helloWorld.submitMessage(message))
    .to.emit(helloWorld, "MessageSubmitted")
    .withArgs(message, anyValue, owner.address); // anyValue stands for the dynamic timestamp

  // Retrieve the latest message from the contract
  const latestMessage = await helloWorld.getLatestMessage();
  expect(latestMessage).to.equal(message);
});

it("should store multiple messages in the array", async function () {
  const [owner] = await ethers.getSigners();

  // Deploy the contract
  const HelloWorldFactory = await ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorldFactory.deploy();
  await helloWorld.waitForDeployment();

  // Submit multiple messages
  const messages = ["First message", "Second message", "Third message"];
  for (const msg of messages) {
    await helloWorld.submitMessage(msg);
  }

  // The latest message should be the last one submitted
  const latestMessage = await helloWorld.getLatestMessage();
  expect(latestMessage).to.equal(messages[messages.length - 1]);
});
