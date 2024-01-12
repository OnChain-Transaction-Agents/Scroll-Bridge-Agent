// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccountV3.sol"; // tokenbound base account contract

import "./interfaces/IL1GatewayRouter.sol";
import "./interfaces/IL2GasOracle.sol";

/**
 * @title Tokenbound ERC-6551 Account Implementation
 * @dev Implementation of an account contract with ERC-6551 compliance, capable of bridging Ether balances and handling gas reimbursements.
 */
contract ScrollPassAccount is AccountV3 {
    /**
     * @dev Emitted when Ether is reimbursed to a specified address.
     * @param to Address receiving the reimbursement.
     * @param amount Amount of Ether reimbursed.
     * @param gasUsed Gas used for the transaction.
     * @param gasPrice Price of gas at the time of transaction.
     */
    event ReimbursedEther(
        address to,
        uint256 amount,
        uint256 gasUsed,
        uint256 gasPrice
    );

    constructor(
        address entryPoint_,
        address multicallForwarder,
        address erc6551Registry,
        address _guardian
    ) AccountV3(entryPoint_, multicallForwarder, erc6551Registry, _guardian) {}

    /**
     * @dev Bridges the Ether balance of the contract to another address, reimbursing gas costs.
     * @param _bridgeGasLimit Gas limit for the bridging transaction.
     * @param _tbaGasUsed Gas used by the transaction.
     */
    function bridgeEthBalance(
        uint256 _bridgeGasLimit,
        uint256 _tbaGasUsed
    ) external payable {
        // address ADMIN = 0x16b90303e179C4D77ECd2C28a2AB2d0c3E0bAfC7; // hard coded;
        // address PAYMASTER = 0xC723db325AFD24bed1Bf0cC112E7EF3919bf36c7; // stack too deep
        address L1ROUTER = 0x13FBE0D0e5552b8c9c4AE9e2435F38f37355998a;
        address L2ORACLE = 0x247969F4fad93a33d4826046bc3eAE0D36BdE548;

        // check if ADMIN calling + value sent
        require(
            msg.sender == 0x16b90303e179C4D77ECd2C28a2AB2d0c3E0bAfC7,
            "Not Scroller Admin Contract!"
        );
        require(address(this).balance > 0, "Not enough ETH!");

        // reimburse the PAYMASTER gas for this call
        uint256 adminGasReimbursement = _tbaGasUsed * tx.gasprice;
        (bool sent, ) = 0xC723db325AFD24bed1Bf0cC112E7EF3919bf36c7.call{
            value: adminGasReimbursement
        }("");
        require(sent, "Failed to reimburse Admin Contract!");

        // initiate bridge instances
        IL1GatewayRouter l1GatewayRouter = IL1GatewayRouter(L1ROUTER);
        IL2GasOracle l2GasOracle = IL2GasOracle(L2ORACLE);

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
            emit ReimbursedEther(owner(), repayment, 0, 0);
        }
    }
}
