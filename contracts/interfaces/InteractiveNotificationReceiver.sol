// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;
pragma abicoder v1;

/// @title Interface for interactor which acts between `maker => taker` and `taker => maker` transfers.
interface InteractiveNotificationReceiver {
    /// @notice Callback method that gets called after taker transferred funds to maker but before
    /// the opposite transfer happened
    function notifyFillOrder(
        address taker,
        address asset,
        address underlyingAsset,
        bool isFixedTaker,
        uint256 fixedTokens,
        uint256 variableTokens,
        bytes memory interactiveData
    ) external;
}
