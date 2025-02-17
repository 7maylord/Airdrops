import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "hardhat";
import { keccak256, solidityPacked, isBytesLike } from "ethers";

async function deployToken(): Promise<any> {
    console.log('\n========Deploying Token Contract========');
    const signer = await ethers.getSigners();
    
    const _name = "MayLordToken";
    const _symbol = "MLT";
    const _initialSupply = ethers.parseUnits("1000000", 18);  

    const tokenContract = await ethers.deployContract("MayLordToken", [_name, _symbol, _initialSupply]);
    await tokenContract.waitForDeployment();

    console.log(`\nTOKEN DEPLOYED AT: ${tokenContract.target}`);
    return tokenContract;
}


async function deployAirdrop(_root: string, _tokenInstance: any): Promise<any> {
    console.log('\n========Deploying Airdrop Contract========');
    const signer = await ethers.getSigners();
    const airdropContract = await ethers.deployContract("MerkleAirdrop", [_root, _tokenInstance.target]);
    await airdropContract.waitForDeployment();

    console.log(`Airdrop deployed at: ${airdropContract.target}`);
    return airdropContract;
}

async function claimAirdrop(address: string, _airdropInstance: any, _tokenInstance: any, addresses: any[], merkleTree: any): Promise<void> {
    console.log(`\nCLAIMING AIRDROP FOR USER: ${address}`);
    
    // Finding the user index in the airdrop list
    const index = addresses.findIndex((entry: any) => entry[0] === address);
    if (index === -1) {
        console.error('Address not found in airdrop list!');
        return;
    }

    const proof = await merkleTree.getProof(index);
    const amount = ethers.parseEther("0.1");

    if (!Array.isArray(proof) || proof.some(p => !isBytesLike(p))) {
        console.error("Invalid Merkle proof format.");
        return;
    }

    try {
        const tx = await _airdropInstance.claimAirdrop(amount, proof);
        await tx.wait();
        const balance = await _tokenInstance.balanceOf(address);
        console.log("\n======CLAIM SUCCESSFUL======");
        console.log(`NEW BALANCE: ${ethers.formatEther(balance)} tokens`);
    } catch (error) {
        console.error('Error during claim:', error);
    }
}

async function updateMerkleRoot(_airdropInstance: any, newRoot: string): Promise<void> {
    console.log('\n========Updating Merkle Root========');
    const signer = await ethers.getSigners();
    try {
        await _airdropInstance.connect(signer).updateMerkleRoot(newRoot);
        console.log(`MERKLE ROOT updated to: ${newRoot}`);
    } catch (error) {
        console.error('Error updating Merkle root:', error);
    }
}

async function generateMerkleRoot(addresses: [string, number][]): Promise<any> {
    console.log('\n========Generating Merkle Root========');
    const elements = addresses.map((entry) => [
        keccak256(solidityPacked(["address", "uint256"], [entry[0], entry[1]]))
    ]);

    const merkleTree = StandardMerkleTree.of(elements, ["bytes32"]);
    const root = merkleTree.root;

    console.log(`Generated Merkle Root: ${root}\n`);

    console.log("Addresses and Proofs:");
    for (let i = 0; i < addresses.length; i++) {
        const [address, amount] = addresses[i];
        const proof = merkleTree.getProof(elements[i]);

        console.log(`Address: ${address}, Amount: ${amount}`);
        console.log(`Proof: ${JSON.stringify(proof, null, 2)}\n`);
    }
    return { root, merkleTree };
}

async function main() {
    try {
        console.log('======Starting deployments (Token and Airdrop Contracts)======');
        
        const [addr1, addr2, addr3, addr4, addr5, addr6 ] = await ethers.getSigners(); 
        
        // Validate that the addresses are correctly fetched
        if (!addr1.address || !addr2.address || !addr3.address || !addr4.address || !addr5.address || !addr6.address) {
            console.error("Invalid addresses detected.");
            return;
        }

        // Airdrop list with valid addresses and amounts
        const addresses = [
            [addr1.address, ethers.parseEther("0.1").toString()],
            [addr2.address, ethers.parseEther("0.1").toString()],
            [addr3.address, ethers.parseEther("0.1").toString()],
            [addr4.address, ethers.parseEther("0.1").toString()],
            [addr5.address, ethers.parseEther("0.1").toString()],
            [addr6.address, ethers.parseEther("0.1").toString()],
        ];

        // Deploy the Token contract
        const _tokenInstance = await deployToken();
        
        // Generate Merkle Root and Proofs
        const { root, merkleTree } = await generateMerkleRoot(addresses);
        
        // Deploy the Airdrop contract
        const _airdropInstance = await deployAirdrop(root, _tokenInstance);

        // Claim Airdrop for user1
        await claimAirdrop(addr1.address, _airdropInstance, _tokenInstance, addresses, merkleTree);

        console.log('\nAirdrop Interactions completed successfully');
    } catch (error) {
        console.error('\nError in deployment or claiming process:', error);
        process.exit(1);
    }
}


main();
