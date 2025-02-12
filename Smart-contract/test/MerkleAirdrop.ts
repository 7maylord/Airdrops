import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, utils } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

describe("MerkleAirdrop Deployment", function () {
  let merkleAirdrop: Contract;
  let token: Contract;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;
  
  let merkleRoot: string;
  let proofs: Array<{ address: string; amount: any; proof: string[] }>;

  // Fixture for reusable setup
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
    const elements = airdropList.map((entry) => {
      return keccak256(utils.solidityPack(["address", "uint256"], [entry.address, entry.amount]));
    });

    const tree = new MerkleTree(elements, keccak256, { sortPairs: true });
    const merkleRoot = tree.getHexRoot();

    const proofs = airdropList.map((entry) => {
      const leaf = keccak256(utils.solidityPack(["address", "uint256"], [entry.address, entry.amount]));
      return {
        address: entry.address,
        amount: entry.amount,
        proof: tree.getHexProof(leaf),
      };
    });

    // Deploy the MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.deploy(merkleRoot, token.getAddress());
    await merkleAirdrop.waitForDeployment();

    // Transfer tokens to contract for airdrop
    await token.transfer(merkleAirdrop.getAddress(),utils.parseUnits("10", 18));

    return { merkleAirdrop, token, owner, user1, user2, user3, merkleRoot, proofs };
  }

  describe("Contract Deployment", function () {
    it("should deploy the contract and set the correct owner", async function () {
      const { merkleAirdrop, owner } = await loadFixture(deployMerkleAirdrop);
      const contractOwner = await merkleAirdrop.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("should set the correct initial Merkle root", async function () {
      const { merkleAirdrop, merkleRoot } = await await loadFixture(deployMerkleAirdrop);
      const currentMerkleRoot = await merkleAirdrop.getMerkleRoot();
      expect(currentMerkleRoot).to.equal(merkleRoot);
    });

    it("should set the correct token address in the contract", async function () {
      const { merkleAirdrop, token } = await await loadFixture(deployMerkleAirdrop);
      const contractTokenAddress = await merkleAirdrop.getAirdropToken();
      expect(contractTokenAddress).to.equal(token.getAddress());
    });

    it("should transfer tokens to the contract", async function () {
      const { token, merkleAirdrop } = await await loadFixture(deployMerkleAirdrop);;
      const contractBalance = await token.balanceOf(merkleAirdrop.getAddress());
      expect(contractBalance).to.equal(utils.parseUnits("10", 18));  // 10 tokens
    });

    it("should have the correct contract address", async function () {
      const { merkleAirdrop } = await await loadFixture(deployMerkleAirdrop);;
      const contractAddress = merkleAirdrop.getAddress()
      expect(contractAddress).to.properAddress;
    });
  });




  
});

