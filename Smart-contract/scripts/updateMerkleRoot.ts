import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Load environment variables
const AIRDROP_CONTRACT_ADDRESS: string = "0x2322cb0D27c573F1909023c5c0bC9aACb4D78B5E";

// ABI of the MerkleAirdrop contract (provided ABI)
const AIRDROP_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_newRoot",
        "type": "bytes32"
      }
    ],
    "name": "updateMerkleRoot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

async function updateMerkleRoot() {
  const [signer] = await ethers.getSigners();
  console.log(`Connected as: ${signer.address}`);

  // Connect to the MerkleAirdrop contract
  const merkleAirdrop = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI, signer);

  // Add New Merkle Root
  const newMerkleRoot = "0x3a3b0dff3e9d8d90aa486c648ba7b1b7bbe898e1c7a4bbd69564e1c4ec2ab956";

  try {
    console.log(`Updating Merkle Root to: ${newMerkleRoot}`);

    // Send the transaction to update the Merkle root
    const tx = await merkleAirdrop.updateMerkleRoot(newMerkleRoot);
    await tx.wait(); 
    console.log(`Merkle Root updated successfully! TX: ${tx.hash}`);
  } catch (error) {
    console.error("Error updating Merkle Root:", error);
  }
}

updateMerkleRoot()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
});
