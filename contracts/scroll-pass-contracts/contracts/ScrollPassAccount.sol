// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccountV3.sol"; // tokenbound base account contract

import "./interfaces/IL1GatewayRouter.sol";
import "./interfaces/IL2GasOracle.sol";

/**
 * @title Tokenbound ERC-6551 Account Implementation
 * @dev Implementation of an account contract with ERC-6551 compliance, capable of bridging Ether balances and handling gas reimbursements.
 *
 * @notice KEY CORE CONTRACTS (for reference during testing):
 *   ADMIN = <SHOULD MATCH THE APPROPRIATE NFT CONTRACT> ; // NFT ADMIN Contract (CHANGES)
 *   PAYMASTER = 0xA2d937F18e9E7fC8d295EcAeBb10Acbd5e77e9eC; // Test Funding
 *
 *   L1ROUTER = 0x13FBE0D0e5552b8c9c4AE9e2435F38f37355998a; // SEPOLIA (proxy)
 *   L2ORACLE = 0x247969F4fad93a33d4826046bc3eAE0D36BdE548; // SEPOLIA (proxy)
 *   L1ROUTER = 0xF8B1378579659D8F7EE5f3C929c2f3E332E41Fd6; // MAINNET (proxy)
 *   L2ORACLE = 0x987e300fDfb06093859358522a79098848C33852; // MAINNET (proxy)
 */
contract ScrollPassAccount is AccountV3 {
    /**
     * @dev Emitted when Ether is reimbursed to a specified address.
     * @param to Address receiving the reimbursement.
     * @param amount Amount of Ether reimbursed.
     */
    event ReimbursedEther(address to, uint256 amount);

    constructor(
        address entryPoint_,
        address multicallForwarder,
        address erc6551Registry,
        address _guardian
    ) AccountV3(entryPoint_, multicallForwarder, erc6551Registry, _guardian) {}

    /**
     * @dev Bridges the Ether balance of the contract to another address, reimbursing gas costs.
     * @param _adminGasFee Gas limit for the bridging transaction.
     * @dev key contracts, for reference:
     */
    function bridgeEthBalance(
        uint _bridgeGasLimit,
        uint _adminGasFee // already subsidised if applicable
    ) external payable {
        // verify caller + balance to be bridged
        require(
            msg.sender == 0x6960ef55C6509b7d7E13A85580ef4F7839FB90c0, // NFT ADMIN Contract
            "TBA: Not Scroll NFT Admin Contract!"
        );
        require(address(this).balance > 0, "TBA: Not enough ETH!");

        // add 1% txn fee
        uint serviceFee = (address(this).balance * 1) / 100;

        // transfer PAYMASTER gas + fee
        (bool sent, ) = 0xA2d937F18e9E7fC8d295EcAeBb10Acbd5e77e9eC.call{
            value: _adminGasFee + serviceFee
        }("");
        require(sent, "TBA: Failed to reimburse gas and fee!");

        emit ReimbursedEther(
            0xA2d937F18e9E7fC8d295EcAeBb10Acbd5e77e9eC,
            _adminGasFee + serviceFee
        );

        // initiate bridge instances
        IL1GatewayRouter l1GatewayRouter = IL1GatewayRouter(
            0x13FBE0D0e5552b8c9c4AE9e2435F38f37355998a // sepolia (proxy)
        );
        IL2GasOracle l2GasOracle = IL2GasOracle(
            0x247969F4fad93a33d4826046bc3eAE0D36BdE548 // sepolia (proxy)
        );

        // interact with bridge
        uint256 bridgeFee = _bridgeGasLimit * l2GasOracle.l2BaseFee();
        uint256 amountToReceive = address(this).balance - bridgeFee;
        l1GatewayRouter.depositETH{value: address(this).balance}(
            owner(),
            amountToReceive,
            _bridgeGasLimit
        );

        // return any remaining ETH dust to Owner
        if (address(this).balance > 0) {
            uint repayment = address(this).balance;
            (bool sent2, ) = owner().call{value: repayment}("");
            require(sent2, "Failed to reimburse Owner!");
            emit ReimbursedEther(owner(), repayment);
        }
    }
}
