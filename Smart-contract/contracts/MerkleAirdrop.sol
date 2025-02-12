// SPDX-License-Identifier: MIT
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
    event AirdropClaimed(address indexed account, uint256 amount);
    event MerkleRootUpdated(bytes32 newMerkleRoot);

    error NOTWHITELISTED(address _address);
    error ALREADYCLAIMED();

    constructor(bytes32 _merkleRoot, IERC20 _mayLordToken) Ownable(msg.sender) {        
        merkleRoot = _merkleRoot;
        mayLordToken = _mayLordToken;
    }

    function claimAirdrop(address account, uint256 amount, bytes32[] calldata proof) external returns(bool) {
        if (hasClaimed[account]) {
            revert ALREADYCLAIMED();
        }
        // Verify proof
        bytes32 _leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));

        if(!MerkleProof.verify(proof, merkleRoot, _leaf)){
            revert NOTWHITELISTED(msg.sender);
        }

        hasClaimed[msg.sender] = true;

        emit AirdropClaimed(msg.sender, amount);

        mayLordToken.safeTransfer(msg.sender, amount);

        return true;
    }

    function updateMerkleRoot(bytes32 _newRoot) external onlyOwner {
        // Optional: If you want to update the root later
        merkleRoot = _newRoot;
    }

    function getMerkleRoot() external view returns (bytes32) {
        return merkleRoot;
    }

    function getAirdropToken() external view returns (IERC20) {
        return mayLordToken;
    }
}
