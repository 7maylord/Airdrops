import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Load environment variables
const PRIVATE_KEY = process.env.ACCOUNT_PRIVATE_KEY as string;
const RPC_URL = process.env.ALCHEMY_BASE_SEPOLIA_API_KEY_URL as string;
const AIRDROP_CONTRACT = process.env.AIRDROP_CONTRACT_ADDRESS as string;

// ABI of the MerkleAirdrop contract (only needed functions)
const airdropABI = [
    "function claimAirdrop(uint256 amount, bytes32[] calldata proof) external",
    "function claimed(address) view returns (bool)"
];

// Add wallet address and merkle proof
const userAddress = "0xUserAddressHere";  // Replace with actual user address
const claimAmount = ethers.parseUnits("1", 18); // Example: 1 MayLordToken (in wei)

const userProof: string[] = [
    "0xabc123...",
];

async function claimAirdrop() {
    if (!PRIVATE_KEY || !RPC_URL || !AIRDROP_CONTRACT) {
        console.error("Missing environment variables. Check your .env file.");
        return;
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(AIRDROP_CONTRACT, airdropABI, wallet);

    try {
        // Check if the user has already claimed the airdrop
        const alreadyClaimed = await contract.claimed(userAddress);
        if (alreadyClaimed) {
            console.log("Airdrop already claimed!");
            return;
        }

        console.log(`Claiming ${ethers.formatUnits(claimAmount, 18)} MayToken for ${userAddress}...`);

        const tx = await contract.claimAirdrop(claimAmount, userProof);
        await tx.wait();

        console.log(`Airdrop claimed successfully! Tx: ${tx.hash}`);
    } catch (error) {
        console.error("Error claiming airdrop:", error);
    }
}

// Run the script
claimAirdrop()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
