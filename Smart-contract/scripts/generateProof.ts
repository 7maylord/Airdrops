const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// Add whitelisted addresses and their airdrop amounts
const airdropList = [
  { address: "0x1234...abcd", amount: "1000000000000000000" }, // 1 MayToken
  { address: "0x5678...efgh", amount: "2000000000000000000" }, // 2 MayToken
  { address: "0x9abc...ijkl", amount: "5000000000000000000" }, // 5 MayToken
];

const elements = airdropList.map(entry => keccak256(entry.address + entry.amount));
const merkleTree = new MerkleTree(elements, keccak256, { sortPairs: true });

const root = merkleTree.getHexRoot();
console.log("Merkle Root:", root);

const proofs = airdropList.map(entry => ({
  address: entry.address,
  amount: entry.amount,
  proof: merkleTree.getHexProof(keccak256(entry.address + entry.amount))
}));

console.log("Airdrop Data:", JSON.stringify(proofs, null, 2));
