/**
 * Script that will use hardhat-ethers plugin to deploy the smart contracts
 */

async function main() {

  // 1.) Deploy Treasury
  const TreasuryFactory = await ethers.getContractFactory("Treasury");
  const treasury = await TreasuryFactory.deploy();
  await treasury.waitForDeployment();
  console.log("Treasury deployed at:", treasury.target);

  // 2.) Deploy IdeaToken, with Treasury address
  const IdeaTokenFactory = await ethers.getContractFactory("IdeaToken");
  const ideaToken = await IdeaTokenFactory.deploy(treasury);
  await ideaToken.waitForDeployment();
  console.log("IdeaToken deployed at:", ideaToken.target);

  // Set the token in the Treasury (this is required because Treasury is deployed before IdeaToken)
  const setTokenTx = await treasury.setToken(ideaToken);
  await setTokenTx.wait();
  console.log("Treasury token set to IdeaToken.");

  // 3.) Deploy IdeaFactory, with IdeaToken and Treasury
  const IdeaFactoryFactory = await ethers.getContractFactory("IdeaFactory");
  const ideaFactory = await IdeaFactoryFactory.deploy(ideaToken, treasury);
  await ideaFactory.waitForDeployment();
  console.log("IdeaFactory deployed at:", ideaFactory.target);
  
}
 
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });