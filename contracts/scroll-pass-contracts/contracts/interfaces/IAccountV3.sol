// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IAccountV3 {
    function bridgeEthBalance(
        uint256 _txnAmount,
        uint256 _gasLimit
    ) external payable;

    function withdrawETH(uint256 _amount, uint256 _gasLimit) external;

    function getETHGateway() external view returns (address);
}
