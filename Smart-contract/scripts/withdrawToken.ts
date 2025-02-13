import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Load environment variables
const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY as string;
const RPC_URL = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY_URL as string;
const AIRDROP_CONTRACT = process.env.AIRDROP_CONTRACT_ADDRESS as string;


// ABI for the withdraw function only
const AIRDROP_ABI = ["function withdraw(uint256 amount) external"];

async function withdrawTokens(amount: bigint) {
    const [signer] = await ethers.getSigners();
    console.log(`connected as: ${signer.address}`);

    // Connect to the MerkleAirdrop contract
    const merkleAirdrop = new ethers.Contract(AIRDROP_CONTRACT, AIRDROP_ABI, signer);

    try {
        console.log(` Withdrawing ${ethers.formatEther(amount)} tokens...`);

        const tx = await merkleAirdrop.withdraw(amount);
        await tx.wait();

        console.log(`Tokens withdrawn successfully! TX: ${tx.hash}`);
    } catch (error) {
        console.error("Error withdrawing tokens:", error);
    }
}

// Withdraw 500 tokens
const withdrawAmount = ethers.parseUnits("500", 18);

withdrawTokens(withdrawAmount)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(" Script execution failed:", error);
        process.exit(1);
    });
