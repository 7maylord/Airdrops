// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop is Ownable{
    using SafeERC20 for IERC20; // Prevent sending tokens to recipients who can’t receive

    // State Variables
    bytes32 private merkleRoot;
    IERC20 private immutable mayLordToken;

    // Mappings
    mapping(address => bool) public hasClaimed;

    
    // Events
    event AirdropClaimed(address indexed claimer, uint256 amount);
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    event OwnerWithdraw(address indexed to, uint256 amount);

    error NOTWHITELISTED(address _address);
    error ALREADYCLAIMED();
    error INSUFFICIENTBALANCE();

    constructor(bytes32 _merkleRoot, IERC20 _mayLordToken) Ownable(msg.sender) {        
        merkleRoot = _merkleRoot;
        mayLordToken = _mayLordToken;
    }

    function claimAirdrop(uint256 amount, bytes32[] calldata proof) external returns(bool) {
        if (hasClaimed[msg.sender]) {
            revert ALREADYCLAIMED();
        }
        // Verify proof
        bytes32 _leaf = keccak256(abi.encodePacked(msg.sender, amount));

        if(!MerkleProof.verify(proof, merkleRoot, _leaf)){
            revert NOTWHITELISTED(msg.sender);
        }

        hasClaimed[msg.sender] = true;

        mayLordToken.safeTransfer(msg.sender, amount);

        emit AirdropClaimed(msg.sender, amount);

        return true;
    }

    function withdraw(uint256 amount) external onlyOwner {
        
        // Ensure the contract has enough tokens to withdraw
        uint256 contractBalance = mayLordToken.balanceOf(address(this));    
        if (contractBalance < amount) revert INSUFFICIENTBALANCE();

        // Transfer the tokens to the owner
        mayLordToken.safeTransfer(msg.sender, amount);

        // Emit withdraw event
        emit OwnerWithdraw(msg.sender, amount);
    }

    function updateMerkleRoot(bytes32 _newRoot) external onlyOwner {
        // Optional: If you want to update the root later
        merkleRoot = _newRoot;
        emit MerkleRootUpdated(_newRoot);
    }

    function getMerkleRoot() external view returns (bytes32) {
        return merkleRoot;
    }

    function getAirdropToken() external view returns (IERC20) {
        return mayLordToken;
    }
}
