import { ethers, run } from "hardhat";

async function deployToken() {
  // Deploy contract
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Get contract factory
  const MayLordToken = await ethers.getContractFactory("MayLordToken");

  // Set initial parameters for the contract
  const tokenName = "MayLordToken";
  const tokenSymbol = "MLT";
  const initialSupply = 1000000; // Adjust initial supply as needed

  // Deploy the contract with the constructor arguments
  const token = await MayLordToken.deploy(tokenName, tokenSymbol, initialSupply);

  console.log("MayLordToken deployed to:", token.address);

  // Wait for the contract to be mined
  await token.deployed();

  // Check the balance of the deployer (the owner) to ensure initial minting is successful
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`Deployer's balance (should be initial supply): ${deployerBalance.toString()}`);

  // Verify the contract on BaseScan (Base Sepolia) after deployment
  if (process.env.HARDHAT_NETWORK !== "hardhat") {
    console.log("Verifying contract on BaseScan (Base Sepolia)...");

    // Verify contract on BaseScan (Sepolia)
    await run("verify:verify", {
      address: token.address,
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
