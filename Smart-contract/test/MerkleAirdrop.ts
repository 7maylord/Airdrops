import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("MerkleAirdrop", function () {
  let merkleAirdrop: Contract;
  let token: Contract;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  
  let merkleRoot: string;
  let proofs: Array<{ address: string; amount: any; proof: string[] }>;

  async function deployMerkleAirdrop() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    const airdropList = [
      { address: user1.address, amount: ethers.parseEther("5") },
      { address: user2.address, amount: ethers.parseEther("5") },
      { address: user3.address, amount: ethers.parseEther("5") },
    ];
    
    // Deploy ERC20 token
    const Token = await ethers.getContractFactory("MayLordToken");
    const token = await Token.deploy("MayLordToken", "MLT", hre.ethers.parseEther("1000"));
    await token.waitForDeployment();

    // Create Merkle Tree
    const elements = airdropList.map((entry) =>
      keccak256(hre.ethers.solidityPacked(["address", "uint256"], [entry.address, entry.amount]))
    );
    const tree = new MerkleTree(elements, keccak256, { sortPairs: true });
    const merkleRoot = tree.getHexRoot();

    const proofs = airdropList.map((entry) => {
      const leaf = keccak256(hre.ethers.solidityPacked(["address", "uint256"], [entry.address, entry.amount]));
      return {
        address: entry.address,
        amount: entry.amount,
        proof: tree.getHexProof(leaf),
      };
    });

    // Deploy Airdrop Contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.deploy(merkleRoot, token.getAddress());
    await merkleAirdrop.waitForDeployment();

    // Transfer tokens to contract for airdrop
    await token.transfer(merkleAirdrop.getAddress(), ethers.parseEther("150"));

    return { merkleAirdrop, token, owner, user1, user2, user3, merkleRoot, proofs };
  }

  describe("Deployment", function () {
    it("should deploy with the correct owner", async function () {
      const { merkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);
      expect(await merkleAirdrop.owner()).to.equal(owner.address);
    });

    it("should initialize with the correct Merkle root", async function () {
      const { merkleAirdrop, merkleRoot } = await loadFixture(deployMerkleAirdrop);
      expect(await merkleAirdrop.getMerkleRoot()).to.equal(merkleRoot);
    });

    it("should set the correct airdrop token", async function () {
      const { merkleAirdrop, token } = await loadFixture(deployMerkleAirdrop);
      expect(await merkleAirdrop.getAirdropToken()).to.equal(await token.getAddress());
    });

    it("should receive tokens for airdrop", async function () {
      const { merkleAirdrop, token } = await loadFixture(deployMerkleAirdrop);
      expect(await token.balanceOf(merkleAirdrop.getAddress())).to.equal(ethers.parseEther("150"));
    });
  });

  describe("Claim Airdrop", function () {
    it("should allow eligible users to claim tokens", async function () {
      const { merkleAirdrop, token, user1, proofs } = await loadFixture(deployMerkleAirdrop);
      const proofData = proofs.find(p => p.address === user1.address)!;
      
      await expect(merkleAirdrop.connect(user1).claimAirdrop(proofData.amount, proofData.proof))
        .to.emit(merkleAirdrop, "AirdropClaimed")
        .withArgs(user1.address, proofData.amount);

      expect(await token.balanceOf(user1.address)).to.equal(proofData.amount);
    });

    it("should prevent double claims", async function () {
      const { merkleAirdrop, user1, proofs } = await loadFixture(deployMerkleAirdrop);
      const proofData = proofs.find(p => p.address === user1.address)!;

      await merkleAirdrop.connect(user1).claimAirdrop(proofData.amount, proofData.proof);

      await expect(merkleAirdrop.connect(user1).claimAirdrop(proofData.amount, proofData.proof))
        .to.be.revertedWithCustomError(merkleAirdrop, "ALREADYCLAIMED");
    });

    it("should reject claims with invalid proof", async function () {
      const { merkleAirdrop, user1 } = await loadFixture(deployMerkleAirdrop);
      const invalidProof = ["0x" + "0".repeat(64)];

      await expect(merkleAirdrop.connect(user1).claimAirdrop(ethers.parseEther("5"), invalidProof))
        .to.be.revertedWithCustomError(merkleAirdrop, "NOTWHITELISTED");
    });
  });

  describe("Withdraw Funds", function () {
    it("should allow the owner to withdraw leftover tokens", async function () {
      const { merkleAirdrop, token, owner } = await loadFixture(deployMerkleAirdrop);

      const initialOwnerBalance = await token.balanceOf(owner.address);
      const contractBalance = await token.balanceOf(merkleAirdrop.getAddress());

      await expect(merkleAirdrop.withdraw(contractBalance))
        .to.emit(merkleAirdrop, "OwnerWithdraw")
        .withArgs(owner.address, contractBalance);

      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance + contractBalance);
    });
    
    it("should prevent non-owners from withdrawing", async function () {
      const { merkleAirdrop, user1 } = await loadFixture(deployMerkleAirdrop);
      await expect(merkleAirdrop.connect(user1).withdraw(ethers.parseEther("5"))).to.be.revertedWithCustomError(merkleAirdrop,"OwnableUnauthorizedAccount");
    });
  });

  describe("Update Merkle Root", function () {
    it("should allow the owner to update the Merkle root", async function () {
      const { merkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);

      const newMerkleRoot = "0x" + keccak256("new root").toString("hex");
      await expect(merkleAirdrop.updateMerkleRoot(newMerkleRoot))
        .to.emit(merkleAirdrop, "MerkleRootUpdated")
        .withArgs(newMerkleRoot);

      expect(await merkleAirdrop.getMerkleRoot()).to.equal(newMerkleRoot);
    });

    it("should prevent non-owners from updating the Merkle root", async function () {
      const { merkleAirdrop, user1 } = await loadFixture(deployMerkleAirdrop);
      const newMerkleRoot = "0x" + keccak256("new root").toString("hex");

      await expect(merkleAirdrop.connect(user1).updateMerkleRoot(newMerkleRoot))
        .to.be.revertedWithCustomError(merkleAirdrop,"OwnableUnauthorizedAccount");
    });
  });
});
