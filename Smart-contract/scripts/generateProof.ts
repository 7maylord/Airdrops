const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// Add whitelisted addresses and their airdrop amounts
const airdropList = [
  { address: "0x6D2Dd04bF065c8A6ee9CeC97588AbB0f967E0df9", amount: "100000000000000000000" }, // 1 MayToken
  { address: "0xb4934871aB71D978973f299b59D8Aa2B0C77DdbB", amount: "200000000000000000000" }, // 2 MayToken
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
