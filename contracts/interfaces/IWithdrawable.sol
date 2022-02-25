// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;
pragma abicoder v1;

interface IWithdrawable {
    function withdraw(uint256 wad) external;
}
