import { ethers, run } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function deployAirdrop() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contract with account: ${deployer.address}`);

    // Ensure Merkle Root and ERC-20 token address are correct
    const merkleRoot: string = "0x09b91c04b07ecebc08619580dc93d92ffeb834c568759604b723fe1d9daba1d3";
    const mayLordTokenAddress: string = "0x2322cb0D27c573F1909023c5c0bC9aACb4D78B5E";

    // Get contract factory
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");

    // Deploy contract with correct constructor arguments
    const merkleAirdrop = await MerkleAirdrop.deploy(merkleRoot, mayLordTokenAddress);
    await merkleAirdrop.waitForDeployment();

    const contractAddress = await merkleAirdrop.getAddress();
    console.log(`Merkle Airdrop deployed at: ${contractAddress}`);

    // Verify the contract on BaseScan (Base Sepolia) after deployment
    if (process.env.HARDHAT_NETWORK !== "hardhat") {
        console.log("Verifying contract on BaseScan (Base Sepolia)...");

        try {
            await run("verify:verify", {
                address: contractAddress,
                constructorArguments: [merkleRoot, mayLordTokenAddress], // Ensure this matches the constructor
            });
            console.log("Contract verified successfully on BaseScan!");
        } catch (error) {
            console.error(" Verification failed:", error);
        }
    }
}

deployAirdrop()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
