// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./OrderMixin.sol";
import "./mocks/OracleMock.sol";

/// @title 1inch Limit Order Protocol v2
contract LimitOrderProtocol is
    EIP712("IRS Limit Order Protocol", "1"),
    OrderMixin
{
    // solhint-disable-next-line
    constructor(OracleMock _oracle) OrderMixin(_oracle) {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
