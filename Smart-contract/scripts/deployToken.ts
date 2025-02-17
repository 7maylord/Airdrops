import { ethers, run } from "hardhat";

async function deployToken() {
  // Deploy contract
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Get contract factory
  const MayLordToken = await ethers.getContractFactory("MayLordToken");

  const tokenName = "MayLordToken";
  const tokenSymbol = "MLT";
  const initialSupply = 1000000; 

  const token = await MayLordToken.deploy(tokenName, tokenSymbol, initialSupply);

  console.log("MayLordToken deployed to:", token.getAddress());

  await token.waitForDeployment();

  // Check the balance of the deployer (the owner) to ensure initial minting is successful
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`Deployer's balance (should be initial supply): ${deployerBalance.toString()}`);

  // Verify the contract on BaseScan (Base Sepolia) after deployment
  if (process.env.HARDHAT_NETWORK !== "hardhat") {
    console.log("Verifying contract on BaseScan (Base Sepolia)...");

    await run("verify:verify", {
      address: await token.getAddress(),
      constructorArguments: [tokenName, tokenSymbol, initialSupply],
    });
  }

  console.log("Contract verified successfully on BaseScan!");
}

// Run the main function and handle errors
deployToken()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
