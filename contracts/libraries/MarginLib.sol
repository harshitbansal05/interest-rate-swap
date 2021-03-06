// SPDX-License-Identifier: BSD-4-Clause
/*
 * ABDK Math 64.64 Smart Contract Library.  Copyright © 2019 by ABDK Consulting.
 * Author: Mikhail Vladimirov <mikhail.vladimirov@gmail.com>
 */
pragma solidity ^0.8.0;

import "../mocks/OracleMock.sol";

/**
 * Smart contract library of mathematical functions operating with signed
 * 64.64-bit fixed point numbers.  Signed 64.64-bit fixed point number is
 * basically a simple fraction whose numerator is signed 128-bit integer and
 * denominator is 2^64.  As long as denominator is always the same, there is no
 * need to store it, thus in Solidity signed 64.64-bit fixed point numbers are
 * represented by int128 type holding only the numerator.
 */
library MarginLib {
    /*
     * Minimum value signed 64.64-bit fixed point number may have.
     */
    int128 private constant _MIN64X64 = -0x80000000000000000000000000000000;

    /*
     * Maximum value signed 64.64-bit fixed point number may have.
     */
    int128 private constant _MAX64X64 = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    /*
     * Log e with base 2 in signed 64.64-bit fixed point format.
     */
    int128 private constant _LOG2E = 0x000000000000000171547652B83A2E3E;

    /*
     * 1 / 2 in signed 64.64-bit fixed point format.
     */
    int128 private constant _ONEBYTWO = 0x00000000000000008000000000000000;

    /*
     * 1 / 100 in signed 64.64-bit fixed point format.
     */
    int128 private constant _ONEBYHUNDRED = 0x0000000000000000028F5C28F5C28F5C;

    struct AssetInfo {
        address asset;
        address underlyingAsset;
        int128 alpha;
        int128 beta;
        int128 sigma;
        int128 lowerBoundMul;
        int128 upperBoundMul;
    }

    struct OrderInfo {
        bytes32 orderHash;
        uint256 beginTimestamp;
        uint256 endTimestamp;
        bool isOrderDefaulted;
        int128 term;
        uint256 fixedTokens;
        uint256 variableTokens;
        bool forFixedTaker;
    }

    /**
     * Calculate x + y.  Revert on overflow.
     *
     * @param x signed 64.64-bit fixed point number
     * @param y signed 64.64-bit fixed point number
     * @return signed 64.64-bit fixed point number
     */
    function _add(int128 x, int128 y) private pure returns (int128) {
        unchecked {
            int256 result = int256(x) + y;
            require(
                result >= _MIN64X64 && result <= _MAX64X64,
                "LOP: Overflow"
            );
            return int128(result);
        }
    }

    /**
     * Calculate x - y.  Revert on overflow.
     *
     * @param x signed 64.64-bit fixed point number
     * @param y signed 64.64-bit fixed point number
     * @return signed 64.64-bit fixed point number
     */
    function _sub(int128 x, int128 y) private pure returns (int128) {
        unchecked {
            int256 result = int256(x) - y;
            require(
                result >= _MIN64X64 && result <= _MAX64X64,
                "LOP: Overflow"
            );
            return int128(result);
        }
    }

    /**
     * Calculate x * y rounding down.  Revert on overflow.
     *
     * @param x signed 64.64-bit fixed point number
     * @param y signed 64.64-bit fixed point number
     * @return signed 64.64-bit fixed point number
     */
    function _mul(int128 x, int128 y) private pure returns (int128) {
        unchecked {
            int256 result = (int256(x) * y) >> 64;
            require(
                result >= _MIN64X64 && result <= _MAX64X64,
                "LOP: Overflow"
            );
            return int128(result);
        }
    }

    /**
     * Calculate x * y rounding down, where x is signed 64.64 fixed point number
     * and y is unsigned 256-bit integer number.  Revert on overflow.
     *
     * @param x signed 64.64 fixed point number
     * @param y unsigned 256-bit integer number
     * @return unsigned 256-bit integer number
     */
    function mulu(int128 x, uint256 y) internal pure returns (uint256) {
        unchecked {
            if (y == 0) return 0;

            require(x >= 0, "LOP: Underflow");

            uint256 lo = (uint256(int256(x)) *
                (y & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)) >> 64;
            uint256 hi = uint256(int256(x)) * (y >> 128);

            require(
                hi <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF,
                "LOP: Overflow"
            );
            hi <<= 64;

            require(
                hi <=
                    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF -
                        lo,
                "LOP: Overflow"
            );
            return hi + lo;
        }
    }

    /**
     * Calculate x / y rounding towards zero.  Revert on overflow or when y is
     * zero.
     *
     * @param x signed 64.64-bit fixed point number
     * @param y signed 64.64-bit fixed point number
     * @return signed 64.64-bit fixed point number
     */
    function _div(int128 x, int128 y) private pure returns (int128) {
        unchecked {
            require(y != 0, "LOP: Zero divisor");
            int256 result = (int256(x) << 64) / y;
            require(
                result >= _MIN64X64 && result <= _MAX64X64,
                "LOP: Overflow"
            );
            return int128(result);
        }
    }

    /**
     * Calculate x / y rounding towards zero, where x and y are unsigned 256-bit
     * integer numbers.  Revert on overflow or when y is zero.
     *
     * @param x unsigned 256-bit integer number
     * @param y unsigned 256-bit integer number
     * @return signed 64.64-bit fixed point number
     */
    function _divu(uint256 x, uint256 y) private pure returns (int128) {
        unchecked {
            require(y != 0, "LOP: Zero divisor");
            uint128 result = _divuu(x, y);
            require(result <= uint128(_MAX64X64), "LOP: Overflow");
            return int128(result);
        }
    }

    /**
     * Calculate binary logarithm of x.  Revert if x <= 0.
     *
     * @param x signed 64.64-bit fixed point number
     * @return signed 64.64-bit fixed point number
     */
    function _log2(int128 x) private pure returns (int128) {
        unchecked {
            require(x > 0, "LOP: Negative");

            int256 msb = 0;
            int256 xc = x;
            if (xc >= 0x10000000000000000) {
                xc >>= 64;
                msb += 64;
            }
            if (xc >= 0x100000000) {
                xc >>= 32;
                msb += 32;
            }
            if (xc >= 0x10000) {
                xc >>= 16;
                msb += 16;
            }
            if (xc >= 0x100) {
                xc >>= 8;
                msb += 8;
            }
            if (xc >= 0x10) {
                xc >>= 4;
                msb += 4;
            }
            if (xc >= 0x4) {
                xc >>= 2;
                msb += 2;
            }
            if (xc >= 0x2) msb += 1; // No need to shift xc anymore

            int256 result = (msb - 64) << 64;
            uint256 ux = uint256(int256(x)) << uint256(127 - msb);
            for (int256 bit = 0x8000000000000000; bit > 0; bit >>= 1) {
                ux *= ux;
                uint256 b = ux >> 255;
                ux >>= 127 + b;
                result += bit * int256(b);
            }

            return int128(result);
        }
    }

    /**
     * Calculate binary exponent of x.  Revert on overflow.
     *
     * @param x signed 64.64-bit fixed point number
     * @return signed 64.64-bit fixed point number
     */
    function _exp2(int128 x) private pure returns (int128) {
        unchecked {
            require(x < 0x400000000000000000, "LOP: Overflow"); // Overflow

            if (x < -0x400000000000000000) return 0; // Underflow

            uint256 result = 0x80000000000000000000000000000000;

            if (x & 0x8000000000000000 > 0)
                result = (result * 0x16A09E667F3BCC908B2FB1366EA957D3E) >> 128;
            if (x & 0x4000000000000000 > 0)
                result = (result * 0x1306FE0A31B7152DE8D5A46305C85EDEC) >> 128;
            if (x & 0x2000000000000000 > 0)
                result = (result * 0x1172B83C7D517ADCDF7C8C50EB14A791F) >> 128;
            if (x & 0x1000000000000000 > 0)
                result = (result * 0x10B5586CF9890F6298B92B71842A98363) >> 128;
            if (x & 0x800000000000000 > 0)
                result = (result * 0x1059B0D31585743AE7C548EB68CA417FD) >> 128;
            if (x & 0x400000000000000 > 0)
                result = (result * 0x102C9A3E778060EE6F7CACA4F7A29BDE8) >> 128;
            if (x & 0x200000000000000 > 0)
                result = (result * 0x10163DA9FB33356D84A66AE336DCDFA3F) >> 128;
            if (x & 0x100000000000000 > 0)
                result = (result * 0x100B1AFA5ABCBED6129AB13EC11DC9543) >> 128;
            if (x & 0x80000000000000 > 0)
                result = (result * 0x10058C86DA1C09EA1FF19D294CF2F679B) >> 128;
            if (x & 0x40000000000000 > 0)
                result = (result * 0x1002C605E2E8CEC506D21BFC89A23A00F) >> 128;
            if (x & 0x20000000000000 > 0)
                result = (result * 0x100162F3904051FA128BCA9C55C31E5DF) >> 128;
            if (x & 0x10000000000000 > 0)
                result = (result * 0x1000B175EFFDC76BA38E31671CA939725) >> 128;
            if (x & 0x8000000000000 > 0)
                result = (result * 0x100058BA01FB9F96D6CACD4B180917C3D) >> 128;
            if (x & 0x4000000000000 > 0)
                result = (result * 0x10002C5CC37DA9491D0985C348C68E7B3) >> 128;
            if (x & 0x2000000000000 > 0)
                result = (result * 0x1000162E525EE054754457D5995292026) >> 128;
            if (x & 0x1000000000000 > 0)
                result = (result * 0x10000B17255775C040618BF4A4ADE83FC) >> 128;
            if (x & 0x800000000000 > 0)
                result = (result * 0x1000058B91B5BC9AE2EED81E9B7D4CFAB) >> 128;
            if (x & 0x400000000000 > 0)
                result = (result * 0x100002C5C89D5EC6CA4D7C8ACC017B7C9) >> 128;
            if (x & 0x200000000000 > 0)
                result = (result * 0x10000162E43F4F831060E02D839A9D16D) >> 128;
            if (x & 0x100000000000 > 0)
                result = (result * 0x100000B1721BCFC99D9F890EA06911763) >> 128;
            if (x & 0x80000000000 > 0)
                result = (result * 0x10000058B90CF1E6D97F9CA14DBCC1628) >> 128;
            if (x & 0x40000000000 > 0)
                result = (result * 0x1000002C5C863B73F016468F6BAC5CA2B) >> 128;
            if (x & 0x20000000000 > 0)
                result = (result * 0x100000162E430E5A18F6119E3C02282A5) >> 128;
            if (x & 0x10000000000 > 0)
                result = (result * 0x1000000B1721835514B86E6D96EFD1BFE) >> 128;
            if (x & 0x8000000000 > 0)
                result = (result * 0x100000058B90C0B48C6BE5DF846C5B2EF) >> 128;
            if (x & 0x4000000000 > 0)
                result = (result * 0x10000002C5C8601CC6B9E94213C72737A) >> 128;
            if (x & 0x2000000000 > 0)
                result = (result * 0x1000000162E42FFF037DF38AA2B219F06) >> 128;
            if (x & 0x1000000000 > 0)
                result = (result * 0x10000000B17217FBA9C739AA5819F44F9) >> 128;
            if (x & 0x800000000 > 0)
                result = (result * 0x1000000058B90BFCDEE5ACD3C1CEDC823) >> 128;
            if (x & 0x400000000 > 0)
                result = (result * 0x100000002C5C85FE31F35A6A30DA1BE50) >> 128;
            if (x & 0x200000000 > 0)
                result = (result * 0x10000000162E42FF0999CE3541B9FFFCF) >> 128;
            if (x & 0x100000000 > 0)
                result = (result * 0x100000000B17217F80F4EF5AADDA45554) >> 128;
            if (x & 0x80000000 > 0)
                result = (result * 0x10000000058B90BFBF8479BD5A81B51AD) >> 128;
            if (x & 0x40000000 > 0)
                result = (result * 0x1000000002C5C85FDF84BD62AE30A74CC) >> 128;
            if (x & 0x20000000 > 0)
                result = (result * 0x100000000162E42FEFB2FED257559BDAA) >> 128;
            if (x & 0x10000000 > 0)
                result = (result * 0x1000000000B17217F7D5A7716BBA4A9AE) >> 128;
            if (x & 0x8000000 > 0)
                result = (result * 0x100000000058B90BFBE9DDBAC5E109CCE) >> 128;
            if (x & 0x4000000 > 0)
                result = (result * 0x10000000002C5C85FDF4B15DE6F17EB0D) >> 128;
            if (x & 0x2000000 > 0)
                result = (result * 0x1000000000162E42FEFA494F1478FDE05) >> 128;
            if (x & 0x1000000 > 0)
                result = (result * 0x10000000000B17217F7D20CF927C8E94C) >> 128;
            if (x & 0x800000 > 0)
                result = (result * 0x1000000000058B90BFBE8F71CB4E4B33D) >> 128;
            if (x & 0x400000 > 0)
                result = (result * 0x100000000002C5C85FDF477B662B26945) >> 128;
            if (x & 0x200000 > 0)
                result = (result * 0x10000000000162E42FEFA3AE53369388C) >> 128;
            if (x & 0x100000 > 0)
                result = (result * 0x100000000000B17217F7D1D351A389D40) >> 128;
            if (x & 0x80000 > 0)
                result = (result * 0x10000000000058B90BFBE8E8B2D3D4EDE) >> 128;
            if (x & 0x40000 > 0)
                result = (result * 0x1000000000002C5C85FDF4741BEA6E77E) >> 128;
            if (x & 0x20000 > 0)
                result = (result * 0x100000000000162E42FEFA39FE95583C2) >> 128;
            if (x & 0x10000 > 0)
                result = (result * 0x1000000000000B17217F7D1CFB72B45E1) >> 128;
            if (x & 0x8000 > 0)
                result = (result * 0x100000000000058B90BFBE8E7CC35C3F0) >> 128;
            if (x & 0x4000 > 0)
                result = (result * 0x10000000000002C5C85FDF473E242EA38) >> 128;
            if (x & 0x2000 > 0)
                result = (result * 0x1000000000000162E42FEFA39F02B772C) >> 128;
            if (x & 0x1000 > 0)
                result = (result * 0x10000000000000B17217F7D1CF7D83C1A) >> 128;
            if (x & 0x800 > 0)
                result = (result * 0x1000000000000058B90BFBE8E7BDCBE2E) >> 128;
            if (x & 0x400 > 0)
                result = (result * 0x100000000000002C5C85FDF473DEA871F) >> 128;
            if (x & 0x200 > 0)
                result = (result * 0x10000000000000162E42FEFA39EF44D91) >> 128;
            if (x & 0x100 > 0)
                result = (result * 0x100000000000000B17217F7D1CF79E949) >> 128;
            if (x & 0x80 > 0)
                result = (result * 0x10000000000000058B90BFBE8E7BCE544) >> 128;
            if (x & 0x40 > 0)
                result = (result * 0x1000000000000002C5C85FDF473DE6ECA) >> 128;
            if (x & 0x20 > 0)
                result = (result * 0x100000000000000162E42FEFA39EF366F) >> 128;
            if (x & 0x10 > 0)
                result = (result * 0x1000000000000000B17217F7D1CF79AFA) >> 128;
            if (x & 0x8 > 0)
                result = (result * 0x100000000000000058B90BFBE8E7BCD6D) >> 128;
            if (x & 0x4 > 0)
                result = (result * 0x10000000000000002C5C85FDF473DE6B2) >> 128;
            if (x & 0x2 > 0)
                result = (result * 0x1000000000000000162E42FEFA39EF358) >> 128;
            if (x & 0x1 > 0)
                result = (result * 0x10000000000000000B17217F7D1CF79AB) >> 128;

            result >>= uint256(int256(63 - (x >> 64)));
            require(result <= uint256(int256(_MAX64X64)), "LOP: Overflow");

            return int128(int256(result));
        }
    }

    /**
     * Calculate x / y rounding towards zero, where x and y are unsigned 256-bit
     * integer numbers.  Revert on overflow or when y is zero.
     *
     * @param x unsigned 256-bit integer number
     * @param y unsigned 256-bit integer number
     * @return unsigned 64.64-bit fixed point number
     */
    function _divuu(uint256 x, uint256 y) private pure returns (uint128) {
        unchecked {
            require(y != 0, "LOP: Zero Divisor");

            uint256 result;

            if (x <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
                result = (x << 64) / y;
            else {
                uint256 msb = 192;
                uint256 xc = x >> 192;
                if (xc >= 0x100000000) {
                    xc >>= 32;
                    msb += 32;
                }
                if (xc >= 0x10000) {
                    xc >>= 16;
                    msb += 16;
                }
                if (xc >= 0x100) {
                    xc >>= 8;
                    msb += 8;
                }
                if (xc >= 0x10) {
                    xc >>= 4;
                    msb += 4;
                }
                if (xc >= 0x4) {
                    xc >>= 2;
                    msb += 2;
                }
                if (xc >= 0x2) msb += 1; // No need to shift xc anymore

                result = (x << (255 - msb)) / (((y - 1) >> (msb - 191)) + 1);
                require(
                    result <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF,
                    "LOP: Overflow"
                );

                uint256 hi = result * (y >> 128);
                uint256 lo = result * (y & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF);

                uint256 xh = x >> 192;
                uint256 xl = x << 64;

                if (xl < lo) xh -= 1;
                xl -= lo; // We rely on overflow behavior here
                lo = hi << 128;
                if (xl < lo) xh -= 1;
                xl -= lo; // We rely on overflow behavior here

                assert(xh == hi >> 128);

                result += xl / y;
            }

            require(
                result <= 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF,
                "LOP: Overflow"
            );
            return uint128(result);
        }
    }

    function _getCIRModelParams(
        AssetInfo memory assetInfo,
        int128 t,
        int128 ewmaAPY
    )
        private
        pure
        returns (
            int128 k,
            int128 lambda,
            int128 ct
        )
    {
        int128 beta = assetInfo.beta;
        int128 sigma = assetInfo.sigma; 
        int128 exponent = _exp2(
            _mul(
                _mul(_mul(-1 * (1 << 64), beta), t),
                _LOG2E
            )
        );
        int128 numerator = _mul(
            _mul(_mul(4 * (1 << 64), beta), ewmaAPY),
            exponent
        );
        int128 denominator = _mul(
            _mul(sigma, sigma),
            _sub(1 * (1 << 64), exponent)
        );

        k = _div(
            _mul(4 * (1 << 64), assetInfo.alpha),
            _mul(sigma, sigma)
        );
        lambda = _div(numerator, denominator);
        ct = _div(
            denominator,
            _mul(4 * (1 << 64), beta)
        );
    }

    function _getAPYBounds(
        AssetInfo memory assetInfo,
        int128 t,
        int128 ewma
    ) private pure returns (int128, int128) {
        (int128 k, int128 lambda, int128 ct) = _getCIRModelParams(
            assetInfo,
            t,
            ewma
        );
        int128 upperBoundMul = assetInfo.upperBoundMul;
        int128 lowerBoundMul = assetInfo.lowerBoundMul;
        int128 upperBound;
        int128 lowerBound;
        {
            int128 sqrtTerm = _mul(
                2 * (1 << 64),
                _add(k, _mul(2 * (1 << 64), lambda))
            );
            int128 sqrtCal = _exp2(
                _mul(_log2(sqrtTerm), _ONEBYTWO)
            );
            upperBound = _mul(
                ct,
                _add(
                    _add(k, lambda),
                    _mul(upperBoundMul, sqrtCal)
                )
            );
            lowerBound = _mul(
                ct,
                _sub(
                    _add(k, lambda),
                    _mul(lowerBoundMul, sqrtCal)
                )
            );
        }
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if gt(0, lowerBound) {
                lowerBound := 0
            }
        }
        return (lowerBound, upperBound);
    }

    function getAverageAccruedAPYBetweenTimestamps(
        OracleMock oracle,
        address asset,
        address underlyingAsset,
        uint256 startTimestamp,
        uint256 endTimestamp
    ) public view returns (int128 apy, int128 ewma) {
        int256 answer = oracle.getAverageAccruedAPYBetweenTimestamps(
            asset,
            underlyingAsset,
            startTimestamp,
            endTimestamp
        );
        apy = int128((answer << 128) >> 128);
        ewma = int128(answer >> 128);
    }

    function getMarginReqWithMuls(
        OracleMock oracle,
        OrderInfo memory orderInfo,
        AssetInfo memory assetInfo,
        int128 tl,
        int128 tu
    ) public view returns (uint256) {
        uint256 beginTimestamp = orderInfo.beginTimestamp;
        uint256 endTimestamp = orderInfo.endTimestamp;
        int128 apyLower;
        int128 apyUpper;
        int128 accruedAPY;
        {
            int128 ewma;
            (accruedAPY, ewma) = getAverageAccruedAPYBetweenTimestamps(
                oracle,
                assetInfo.asset,
                assetInfo.underlyingAsset,
                beginTimestamp,
                block.timestamp // solhint-disable-line
            );
            (apyLower, apyUpper) = _getAPYBounds(
                assetInfo,
                _divu(
                    endTimestamp - block.timestamp, // solhint-disable-line
                    endTimestamp - beginTimestamp
                ),
                ewma
            );
        }
        {
            int128 w1 = _divu(
                block.timestamp - beginTimestamp, // solhint-disable-line
                endTimestamp - beginTimestamp
            ); 
            int128 w2 = _divu(
                endTimestamp - block.timestamp, // solhint-disable-line
                endTimestamp - beginTimestamp
            ); 
            apyLower = _add(
                _mul(w1, accruedAPY),
                _mul(w2, apyLower)
            );
            apyUpper = _add(
                _mul(w1, accruedAPY),
                _mul(w2, apyUpper)
            );
            apyLower = _mul(apyLower, tl);
            apyUpper = _mul(apyUpper, tu);
        }
        uint256 positiveMargin;
        uint256 negativeMargin;
        if (orderInfo.forFixedTaker) {
            positiveMargin = mulu(
                _mul(apyUpper, orderInfo.term),
                orderInfo.variableTokens
            );
            negativeMargin = mulu(
                _mul(_ONEBYHUNDRED, orderInfo.term),
                orderInfo.fixedTokens
            );
        } else {
            positiveMargin = mulu(
                _mul(_ONEBYHUNDRED, orderInfo.term),
                orderInfo.fixedTokens
            );
            negativeMargin = mulu(
                _mul(apyLower, orderInfo.term),
               orderInfo. variableTokens
            );
        }
        uint256 marginReq = 0;
        uint256 minMargin = 100;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if gt(positiveMargin, negativeMargin) {
                marginReq := sub(positiveMargin, negativeMargin)
            }
            if gt(minMargin, marginReq) {
                marginReq := minMargin
            }
        }
        return marginReq;
    }

    function getReturnAfterMaturity(
        uint256 onePercentFixedTokens,
        uint256 onePercentVariableTokens,
        uint256 margin,
        bool forFixedTaker,
        int128 term
    ) public pure returns(uint256 orderReturn) {
        if (forFixedTaker) {
            if (onePercentFixedTokens >= onePercentVariableTokens) {
                uint256 diff = mulu(
                    term,
                    onePercentFixedTokens - onePercentVariableTokens
                ) / 100;
                orderReturn = margin + diff;
            } else {
                uint256 diff = mulu(
                    term,
                    onePercentVariableTokens - onePercentFixedTokens
                ) / 100;
                assert(diff <= margin);
                orderReturn = margin - diff;
            }
        } else {
            if (onePercentVariableTokens >= onePercentFixedTokens) {
                uint256 diff = mulu(
                    term,
                    onePercentVariableTokens - onePercentFixedTokens
                ) / 100;
                orderReturn = margin + diff;
            } else {
                uint256 diff = mulu(
                    term,
                    onePercentFixedTokens - onePercentVariableTokens
                ) / 100;
                assert(diff <= margin);
                orderReturn = margin - diff;
            }
        }
    }
}
