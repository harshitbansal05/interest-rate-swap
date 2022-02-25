// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;
pragma abicoder v1;

/// @title Library with gas efficient alternatives to `abi.decode`
library ArgumentsDecoder {
    function decodeUint256(bytes memory data) internal pure returns (uint256) {
        uint256 value;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            value := mload(add(data, 0x20))
        }
        return value;
    }

    function decodeInt256(bytes memory data) internal pure returns (int256) {
        int256 value;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            value := mload(add(data, 0x20))
        }
        return value;
    }

    function decodeBool(bytes memory data) internal pure returns (bool) {
        bool value;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            value := eq(mload(add(data, 0x20)), 1)
        }
        return value;
    }

    function decodeTargetAndCalldata(bytes memory data)
        internal
        pure
        returns (address, bytes memory)
    {
        address target;
        bytes memory args;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            target := mload(add(data, 0x14))
            args := add(data, 0x14)
            mstore(args, sub(mload(data), 0x14))
        }
        return (target, args);
    }

    function decodeTargetAndData(bytes calldata data)
        internal
        pure
        returns (address, bytes calldata)
    {
        address target;
        bytes calldata args;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            target := shr(96, calldataload(data.offset))
        }
        args = data[20:];
        return (target, args);
    }
}
