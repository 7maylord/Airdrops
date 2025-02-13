import { any } from "hardhat/internal/core/params/argumentTypes";
import { ethers } from "hardhat";
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// Add whitelisted addresses and their airdrop amounts
const recipients = [
   "0x6D2Dd04bF065c8A6ee9CeC97588AbB0f967E0df9",
  "0xb4934871aB71D978973f299b59D8Aa2B0C77DdbB"
];

const amount = ethers.parseUnits("1000", 18);

const elements = recipients.map((user) => 
  keccak256(ethers.solidityPacked(["address", "uint256"], [user, amount])));
const merkleTree = new MerkleTree(elements, keccak256, { sortPairs: true });

const root = merkleTree.getHexRoot();
console.log("Merkle Root:", root);

for (const recipient of recipients) {
  const leaf = keccak256(ethers.solidityPacked(["address", "uint256"], [recipient, amount]));
  const proof = merkleTree.getHexProof(leaf);

  console.log(`📝 Proof for ${recipient}: ${proof}`);
}

// console.log("Airdrop Data:", JSON.stringify(proofs, null, 2));
