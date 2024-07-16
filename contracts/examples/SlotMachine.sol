// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import {INativeVRF} from "../interfaces/INativeVRF.sol";

contract SlotMachine {
    INativeVRF public nativeVRF;
    uint256 public spinFee = 0.01 ether;
    uint256 public rewardMultiplier = 10;
    uint256 public constant luckPosibility = 10;
    address public owner;

    mapping(uint256 => address) public spinRequests;
    mapping(address => uint256) public pendingRewards;

    event SpinResult(
        address indexed player,
        uint256 indexed requestId,
        uint256 randomResult,
        bool won
    );

    event SpinRequested(address indexed player, uint256 indexed requestId);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(owner == msg.sender, "Caller is not the owner");
        _;
    }

    constructor(address nativeVRFAddress) {
        nativeVRF = INativeVRF(nativeVRFAddress);
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier validRequestIds(uint256[] memory requestIds) {
        require(requestIds.length > 0, "No request IDs provided");
        uint256 latestFulfillId = nativeVRF.latestFulfillId();
        require(
            requestIds[requestIds.length - 1] <= latestFulfillId,
            "Random result not available for the last request ID"
        );
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function getSpinResult(uint256 requestId) external view returns (bool won) {
        uint256 randomResult = nativeVRF.randomResults(requestId);
        return randomResult % luckPosibility == 0;
    }

    function spin(uint256 numSpins) external payable {
        require(numSpins > 0, "Must request at least one spin");
        require(msg.value >= spinFee * numSpins, "Insufficient spin fee");

        uint256[] memory requestIds = nativeVRF.requestRandom{value: msg.value}(
            numSpins
        );

        for (uint256 i = 0; i < numSpins; i++) {
            spinRequests[requestIds[i]] = msg.sender;
            emit SpinRequested(msg.sender, requestIds[i]);
        }
    }

    function fulfillSpins(
        uint256[] memory requestIds
    ) external validRequestIds(requestIds) {
        for (uint256 i = 0; i < requestIds.length; i++) {
            uint256 requestId = requestIds[i];
            uint256 randomResult = nativeVRF.randomResults(requestId);
            address player = spinRequests[requestId];
            require(player != address(0), "Invalid requestId");
            require(randomResult > 0, "Random result not available");

            bool won = randomResult % luckPosibility == 0; // 10% chance to win
            if (won) {
                uint256 reward = spinFee * rewardMultiplier;
                pendingRewards[player] += reward;
            }

            emit SpinResult(player, requestId, randomResult, won);
        }
    }

    function claimReward() external {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        pendingRewards[msg.sender] = 0;
        payable(msg.sender).transfer(reward);
    }

    function isResultAvailable(uint256 requestId) external view returns (bool) {
        return requestId <= nativeVRF.latestFulfillId();
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(
            amount <= address(this).balance,
            "Insufficient balance in contract"
        );
        payable(owner).transfer(amount);
    }

    receive() external payable {}
}
