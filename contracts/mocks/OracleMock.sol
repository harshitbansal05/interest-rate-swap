// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;
pragma abicoder v1;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV2V3Interface.sol";

/// @title Mock oracle that always returns specified token price
contract OracleMock is AggregatorV2V3Interface {
    int256 private immutable _answer;

    constructor(int256 answer) {
        _answer = answer;
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function description() external pure returns (string memory) {
        return "AggregatorMock";
    }

    function version() external pure returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        require(_roundId == 0, "No data present");
        return latestRoundData();
    }

    function latestRoundData()
        public
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        // solhint-disable-next-line not-rely-on-time
        return (0, _answer, block.timestamp - 100, block.timestamp - 100, 0);
    }

    function latestAnswer() public view returns (int256) {
        return _answer;
    }

    function latestTimestamp() public view returns (uint256) {
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp - 100;
    }

    function latestRound() external pure returns (uint256) {
        return 0;
    }

    function getAnswer(uint256 roundId) external view returns (int256) {
        require(roundId == 0, "No data present");
        return latestAnswer();
    }

    function getTimestamp(uint256 roundId) external view returns (uint256) {
        require(roundId == 0, "No data present");
        return latestTimestamp();
    }

    function getAverageAccruedAPYBetweenTimestamps(
        address, /* asset */
        address, /* underlyingAsset */
        uint256, /* startTimestamp */
        uint256 /* endTimestamp */
    ) external view returns (int256) {
        return _answer;
    }
}
