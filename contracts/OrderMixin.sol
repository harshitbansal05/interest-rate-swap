// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./helpers/AmountCalculator.sol";
import "./helpers/ChainlinkCalculator.sol";
import "./helpers/NonceManager.sol";
import "./helpers/PredicateHelper.sol";
import "./interfaces/InteractiveNotificationReceiver.sol";
import "./libraries/ABDKMath64x64.sol";
import "./libraries/ArgumentsDecoder.sol";
import "./libraries/Permitable.sol";
import "./mocks/OracleMock.sol";

import "hardhat/console.sol";

/// @title Regular Limit Order mixin
abstract contract OrderMixin is
    EIP712,
    AmountCalculator,
    ChainlinkCalculator,
    NonceManager,
    PredicateHelper,
    Permitable
{
    using Address for address;
    using ArgumentsDecoder for bytes;

    /// @notice Emitted every time order gets filled, including partial fills
    event OrderFilled(
        address indexed maker,
        bytes32 orderHash,
        uint256 remaining
    );

    /// @notice Emitted when order gets cancelled
    event OrderCanceled(
        address indexed maker,
        bytes32 orderHash,
        uint256 remainingRaw
    );

    // Fixed-size order part with core information
    struct StaticOrder {
        uint256 salt;
        address asset;
        address underlyingAsset;
        address maker;
        address receiver;
        address allowedSender; // equals to Zero address on public orders
        uint256 fixedTokens;
        uint256 variableTokens;
        bool isFixedTaker;
        uint256 beginTimestamp;
        uint256 endTimestamp;
        int128 t; // Fixed Point Q64.64 term of the order in years
    }

    // `StaticOrder` extension including variable-sized additional order meta information
    struct Order {
        uint256 salt;
        address asset;
        address underlyingAsset;
        address maker;
        address receiver;
        address allowedSender; // equals to Zero address on public orders
        uint256 fixedTokens;
        uint256 variableTokens;
        bool isFixedTaker;
        uint256 beginTimestamp;
        uint256 endTimestamp;
        int128 t; // Fixed Point Q64.64 term of the order in years
        bytes makerAssetData;
        bytes takerAssetData;
        bytes getMakerAmount; // this.staticcall(abi.encodePacked(bytes, swapTakerAmount)) => (swapMakerAmount)
        bytes getTakerAmount; // this.staticcall(abi.encodePacked(bytes, swapMakerAmount)) => (swapTakerAmount)
        bytes predicate; // this.staticcall(bytes) => (bool)
        bytes permit; // On first fill: permit.1.call(abi.encodePacked(permit.selector, permit.2))
        bytes interaction;
    }

    address public owner;
    address private _oracle;
    bool private _unlocked = true;
    int128 public liquidatorMargin = 0x00000000000000003333333333333333;
    int128 public oppositePartyMargin = 0x00000000000000006666666666666666;
    int128 public oppositePartyMarginNoLiquidator =
        0x000000000000008000000000000000;

    bytes32 public constant LIMIT_ORDER_TYPEHASH =
        keccak256(
            "Order(uint256 salt,address asset,address underlyingAsset,address maker,address receiver,address allowedSender,uint256 fixedTokens,uint256 variableTokens,bool isFixedTaker,uint256 beginTimestamp,uint256 endTimestamp,int128 t,bytes makerAssetData,bytes takerAssetData,bytes getMakerAmount,bytes getTakerAmount,bytes predicate,bytes permit,bytes interaction)"
        );
    int128 private constant _LOG2E = 0x000000000000000171547652B83A2E3E;
    int128 private constant _ONEBYTWO = 0x00000000000000008000000000000000;
    int128 private constant _ONEBYHUNDRED = 0x0000000000000000028F5C28F5C28F5C;
    uint256 private constant _ORDER_DOES_NOT_EXIST = 0;
    uint256 private constant _ORDER_FILLED = 1;

    /// @notice Stores unfilled amounts for each order plus one.
    /// Therefore 0 means order doesn't exist and 1 means order was filled
    mapping(bytes32 => uint256) private _remaining;
    mapping(bytes32 => uint256) private _orderNumTakers;
    mapping(bytes32 => mapping(address => uint256))
        public orderParticipantFixedTokens;
    mapping(bytes32 => mapping(address => uint256))
        public orderParticipantVariableTokens;
    mapping(bytes32 => mapping(address => uint256))
        public orderParticipantMargin;
    mapping(bytes32 => bool) public isOrderDefaulted;
    mapping(bytes32 => uint256) public defaultedFunds;

    mapping(address => int128) public assetAlpha;
    mapping(address => int128) public assetBeta;
    mapping(address => int128) public assetSigma;
    mapping(address => int128) public assetLowerBoundMul;
    mapping(address => int128) public assetUpperBoundMul;

    function setAssetAlpha(address asset, int128 alpha) external onlyOwner {
        assetAlpha[asset] = alpha;
    }

    function setAssetBeta(address asset, int128 beta) external onlyOwner {
        assetBeta[asset] = beta;
    }

    function setAssetSigma(address asset, int128 sigma) external onlyOwner {
        assetSigma[asset] = sigma;
    }

    function setAssetLowerBoundMul(address asset, int128 lowerBoundMul)
        external
        onlyOwner
    {
        assetLowerBoundMul[asset] = lowerBoundMul;
    }

    function setAssetUpperBoundMul(address asset, int128 upperBoundMul)
        external
        onlyOwner
    {
        assetUpperBoundMul[asset] = upperBoundMul;
    }

    function setLiquidatorMargin(int128 _liquidatorMargin) external onlyOwner {
        liquidatorMargin = _liquidatorMargin;
    }

    function setOppositePartyMargin(int128 _oppositePartyMargin)
        external
        onlyOwner
    {
        oppositePartyMargin = _oppositePartyMargin;
    }

    function setOppositePartyMarginNoLiquidator(
        int128 _oppositePartyMarginNoLiquidator
    ) external onlyOwner {
        oppositePartyMarginNoLiquidator = _oppositePartyMarginNoLiquidator;
    }

    constructor(address oracle) {
        owner = msg.sender;
        _oracle = oracle;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "LOP: Only owner allowed");
        _;
    }

    modifier lock() {
        require(_unlocked, "LOP: Locked state");
        _unlocked = false;
        _;
        _unlocked = true;
    }

    /// @notice Returns unfilled amount for order. Throws if order does not exist
    function remaining(bytes32 orderHash) external view returns (uint256) {
        uint256 amount = _remaining[orderHash];
        require(amount != _ORDER_DOES_NOT_EXIST, "LOP: Unknown order");
        unchecked {
            amount -= 1;
        }
        return amount;
    }

    /// @notice Returns unfilled amount for order
    /// @return Result Unfilled amount of order plus one if order exists. Otherwise 0
    function remainingRaw(bytes32 orderHash) external view returns (uint256) {
        return _remaining[orderHash];
    }

    /// @notice Same as `remainingRaw` but for multiple orders
    function remainingsRaw(bytes32[] memory orderHashes)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory results = new uint256[](orderHashes.length);
        for (uint256 i = 0; i < orderHashes.length; i++) {
            results[i] = _remaining[orderHashes[i]];
        }
        return results;
    }

    /**
     * @notice Calls every target with corresponding data. Then reverts with CALL_RESULTS_0101011 where zeroes and ones
     * denote failure or success of the corresponding call
     * @param targets Array of addresses that will be called
     * @param data Array of data that will be passed to each call
     */
    function simulateCalls(address[] calldata targets, bytes[] calldata data)
        external
    {
        require(targets.length == data.length, "LOP: array size mismatch");
        bytes memory reason = new bytes(targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, bytes memory result) = targets[i].call(data[i]);
            if (success && result.length > 0) {
                success = result.length == 32 && result.decodeBool();
            }
            reason[i] = success ? bytes1("1") : bytes1("0");
        }

        // Always revert and provide per call results
        revert(string(abi.encodePacked("CALL_RESULTS_", reason)));
    }

    /// @notice Cancels order by setting remaining amount to zero
    function cancelOrder(Order memory order) external {
        require(order.maker == msg.sender, "LOP: Access denied");

        bytes32 orderHash = hashOrder(order);
        uint256 orderRemaining = _remaining[orderHash];
        require(orderRemaining != _ORDER_FILLED, "LOP: already filled");
        emit OrderCanceled(msg.sender, orderHash, orderRemaining);
        _remaining[orderHash] = _ORDER_FILLED;
    }

    struct FillOrderParams {
        address maker;
        address asset;
        address underlyingAsset;
        bool ft;
    }

    /// @notice Fills an order. If one doesn't exist (first fill) it will be created using order.makerAssetData
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param fixedTokens Fixed Tokens
    /// @param variableTokens Variable Tokens
    /// @param thresholdTokens Specifies maximum allowed takingAmount when takingAmount is zero, otherwise specifies minimum allowed makingAmount
    function fillOrder(
        Order memory order,
        bytes calldata signature,
        uint256 fixedTokens,
        uint256 variableTokens,
        uint256 thresholdTokens
    )
        external
        returns (
            uint256, /* actualMakingAmount */
            uint256 /* actualTakingAmount */
        )
    {
        return
            fillOrderTo(
                order,
                signature,
                fixedTokens,
                variableTokens,
                thresholdTokens
            );
    }

    /// @notice Same as `fillOrder` but calls permit first,
    /// allowing to approve token spending and make a swap in one transaction.
    /// Also allows to specify funds destination instead of `msg.sender`
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param fixedTokens Fixed Tokens
    /// @param variableTokens Variable Tokens
    /// @param thresholdTokens Specifies maximum allowed takingAmount when takingAmount is zero, otherwise specifies minimum allowed makingAmount
    /// @param permit Should consist of abiencoded token address and encoded `IERC20Permit.permit` call.
    /// @dev See tests for examples
    function fillOrderToWithPermit(
        Order memory order,
        bytes calldata signature,
        uint256 fixedTokens,
        uint256 variableTokens,
        uint256 thresholdTokens,
        bytes calldata permit
    )
        external
        returns (
            uint256, /* actualMakingAmount */
            uint256 /* actualTakingAmount */
        )
    {
        require(permit.length >= 20, "LOP: permit length too low");
        (address token, bytes calldata permitData) = permit
            .decodeTargetAndData();
        _permit(token, permitData);
        return
            fillOrderTo(
                order,
                signature,
                fixedTokens,
                variableTokens,
                thresholdTokens
            );
    }

    /// @notice Same as `fillOrder` but allows to specify funds destination instead of `msg.sender`
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param fixedTokens Fixed Tokens
    /// @param variableTokens Variable Tokens
    /// @param thresholdTokens Specifies maximum allowed takingAmount when takingAmount is zero, otherwise specifies minimum allowed makingAmount
    function fillOrderTo(
        Order memory order,
        bytes calldata signature,
        uint256 fixedTokens,
        uint256 variableTokens,
        uint256 thresholdTokens
    )
        public
        lock
        returns (
            uint256, /* actualMakingAmount */
            uint256 /* actualTakingAmount */
        )
    {
        require(msg.sender != order.maker, "LOP: same maker and taker");

        // solhint-disable-next-line
        require(
            block.timestamp <= order.endTimestamp,
            "LOP: Order already matured"
        );
        bytes32 orderHash = hashOrder(order);
        require(!isOrderDefaulted[orderHash], "LOP: Order defaulted");
        require(
            orderParticipantMargin[orderHash][msg.sender] == 0,
            "LOP: Sender is a participant"
        );

        FillOrderParams memory params = FillOrderParams({
            maker: order.maker,
            asset: order.asset,
            underlyingAsset: order.underlyingAsset,
            ft: order.isFixedTaker
        });

        {
            // Stack too deep
            uint256 remainingTokens = _remaining[orderHash];
            require(
                remainingTokens != _ORDER_FILLED,
                "LOP: remaining amount is 0"
            );
            require(
                order.allowedSender == address(0) ||
                    order.allowedSender == msg.sender,
                "LOP: private order"
            );
            if (remainingTokens == _ORDER_DOES_NOT_EXIST) {
                // First fill: validate order and permit maker asset
                require(
                    SignatureChecker.isValidSignatureNow(
                        order.maker,
                        orderHash,
                        signature
                    ),
                    "LOP: bad signature"
                );
                if (order.isFixedTaker) {
                    remainingTokens = order.variableTokens;
                } else {
                    remainingTokens = order.fixedTokens;
                }
                if (order.permit.length >= 20) {
                    // proceed only if permit length is enough to store address
                    (address token, bytes memory permit) = order
                        .permit
                        .decodeTargetAndCalldata();
                    _permitMemory(token, permit);
                    require(
                        _remaining[orderHash] == _ORDER_DOES_NOT_EXIST,
                        "LOP: reentrancy detected"
                    );
                }
            } else {
                unchecked {
                    remainingTokens -= 1;
                }
            }

            // Check if order is valid
            if (order.predicate.length > 0) {
                require(checkPredicate(order), "LOP: predicate returned false");
            }

            // Compute maker and taker assets amount
            if ((fixedTokens == 0) == (variableTokens == 0)) {
                revert("LOP: only one amount should be 0");
            }
            if (fixedTokens == 0) {
                console.log("Fixed = 0");
                uint256 requestedVariableTokens = variableTokens;
                if (order.isFixedTaker) {
                    console.log("Fixed taker");
                    if (variableTokens > remainingTokens) {
                        variableTokens = remainingTokens;
                    }
                    fixedTokens = _callGetter(
                        order.getMakerAmount,
                        order.variableTokens,
                        order.fixedTokens,
                        variableTokens
                    );
                    require(
                        fixedTokens * requestedVariableTokens <=
                            thresholdTokens * variableTokens,
                        "LOP: Tokens less than threshold"
                    );
                } else {
                    console.log("Variable taker");
                    fixedTokens = _callGetter(
                        order.getTakerAmount,
                        order.variableTokens,
                        order.fixedTokens,
                        variableTokens
                    );
                    if (fixedTokens > remainingTokens) {
                        fixedTokens = remainingTokens;
                        variableTokens = _callGetter(
                            order.getMakerAmount,
                            order.fixedTokens,
                            order.variableTokens,
                            fixedTokens
                        );
                    }
                    require(
                        fixedTokens * requestedVariableTokens >=
                            thresholdTokens * variableTokens,
                        "LOP: Tokens less than threshold"
                    );
                }
            } else {
                console.log("Variable = 0");
                uint256 requestedFixedTokens = fixedTokens;
                if (order.isFixedTaker) {
                    console.log("Fixed taker");
                    variableTokens = _callGetter(
                        order.getTakerAmount,
                        order.fixedTokens,
                        order.variableTokens,
                        fixedTokens
                    );
                    console.log(variableTokens);
                    console.log(remainingTokens);
                    if (variableTokens > remainingTokens) {
                        console.log("K");
                        variableTokens = remainingTokens;
                        fixedTokens = _callGetter(
                            order.getMakerAmount,
                            order.variableTokens,
                            order.fixedTokens,
                            variableTokens
                        );
                    }
                    require(
                        variableTokens * requestedFixedTokens >=
                            thresholdTokens * fixedTokens,
                        "LOP: Tokens less than threshold"
                    );
                } else {
                    console.log("Variable taker");
                    if (fixedTokens > remainingTokens) {
                        fixedTokens = remainingTokens;
                    }
                    variableTokens = _callGetter(
                        order.getMakerAmount,
                        order.fixedTokens,
                        order.variableTokens,
                        fixedTokens
                    );
                    require(
                        variableTokens * requestedFixedTokens <=
                            thresholdTokens * fixedTokens,
                        "LOP: Tokens less than threshold"
                    );
                }
            }
            console.log("Fixed and variable tokens:");
            console.log(fixedTokens);
            console.log(variableTokens);
            require(
                fixedTokens > 0 && variableTokens > 0,
                "LOP: can't swap 0 amount"
            );

            // Update remaining amount in storage
            unchecked {
                if (order.isFixedTaker) {
                    remainingTokens = remainingTokens - variableTokens;
                } else {
                    remainingTokens = remainingTokens - fixedTokens;
                }
                _remaining[orderHash] = remainingTokens + 1;
                _orderNumTakers[orderHash] = _orderNumTakers[orderHash] + 1;
            }
            emit OrderFilled(msg.sender, orderHash, remainingTokens);
        }

        unchecked {
            orderParticipantFixedTokens[orderHash][order.maker] =
                orderParticipantFixedTokens[orderHash][order.maker] +
                fixedTokens;
            orderParticipantVariableTokens[orderHash][order.maker] =
                orderParticipantVariableTokens[orderHash][order.maker] +
                variableTokens;
            orderParticipantFixedTokens[orderHash][msg.sender] = fixedTokens;
            orderParticipantVariableTokens[orderHash][
                msg.sender
            ] = variableTokens;
        }
        {
            // Calculate margin requirements for order maker and taker
            uint256 initialMarginMaker = getInitialMarginReq(
                order,
                orderHash,
                order.maker
            );
            uint256 initialMarginTaker = getInitialMarginReq(
                order,
                orderHash,
                msg.sender
            );
            console.log("Maker and taker margins:");
            console.log(initialMarginMaker);
            console.log(initialMarginTaker);

            uint256 balanceBefore = _balance(params.underlyingAsset);
            // Taker => This
            _makeCall(
                params.underlyingAsset,
                abi.encodePacked(
                    IERC20.transferFrom.selector,
                    uint256(uint160(msg.sender)),
                    uint256(uint160(address(this))),
                    initialMarginTaker
                )
            );
            require(
                balanceBefore + initialMarginTaker <=
                    _balance(params.underlyingAsset),
                "LOP: Margin not enough"
            );

            balanceBefore = _balance(params.underlyingAsset);
            // Maker => This
            _makeCall(
                params.underlyingAsset,
                abi.encodePacked(
                    IERC20.transferFrom.selector,
                    uint256(uint160(params.maker)),
                    uint256(uint160(address(this))),
                    initialMarginMaker
                )
            );
            require(
                balanceBefore + initialMarginMaker <=
                    _balance(params.underlyingAsset),
                "LOP: Margin not enough"
            );
        }
        return (fixedTokens, variableTokens);
    }

    /// @notice Checks order predicate
    function checkPredicate(Order memory order) public view returns (bool) {
        bytes memory result = address(this).functionStaticCall(
            order.predicate,
            "LOP: predicate call failed"
        );
        require(result.length == 32, "LOP: invalid predicate return");
        return result.decodeBool();
    }

    function hashOrder(Order memory order) public view returns (bytes32) {
        StaticOrder memory staticOrder;
        assembly {
            // solhint-disable-line no-inline-assembly
            staticOrder := order
        }
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        LIMIT_ORDER_TYPEHASH,
                        staticOrder,
                        keccak256(order.makerAssetData),
                        keccak256(order.takerAssetData),
                        keccak256(order.getMakerAmount),
                        keccak256(order.getTakerAmount),
                        keccak256(order.predicate),
                        keccak256(order.permit),
                        keccak256(order.interaction)
                    )
                )
            );
    }

    function settleOrder(Order memory order, address settler)
        external
        lock
        returns (uint256)
    {
        bytes32 orderHash = hashOrder(order);
        // solhint-disable-next-line
        require(
            block.timestamp > order.endTimestamp || isOrderDefaulted[orderHash],
            "LOP: Order yet not matured"
        );
        uint256 fixedTokens = 4000000; // orderParticipantFixedTokens[orderHash][settler];
        uint256 variableTokens = 1000; // orderParticipantVariableTokens[orderHash][settler];
        uint256 margin = 5000; // orderParticipantMargin[orderHash][settler];
        require(margin > 0, "LOP: No margin provided");
        // Get actual APY over the order period
        (int128 orderPeriodActualAPY, ) = getAverageAccruedAPYBetweenTimestamps(
            order.asset,
            order.underlyingAsset,
            order.beginTimestamp,
            order.endTimestamp
        );
        uint256 onePercentFixedTokens = fixedTokens;
        uint256 onePercentVariableTokens = ABDKMath64x64.mulu(
            orderPeriodActualAPY,
            variableTokens
        ) * 100;
        console.log("Fixed and variable tokens:");
        console.log(onePercentFixedTokens);
        console.log(onePercentVariableTokens);
        int128 term = order.t;
        uint256 orderReturn;
        if (isOrderDefaulted[orderHash]) {
            uint256 defaultedFundsShare = defaultedFunds[orderHash] /
                _orderNumTakers[orderHash];
            orderReturn = margin + defaultedFundsShare;
        } else {
            if (order.isFixedTaker) {
                console.log("Fixed");
                if (settler == order.maker) {
                    console.log("Maker");
                    if (onePercentFixedTokens >= onePercentVariableTokens) {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentFixedTokens - onePercentVariableTokens
                        ) / 100;
                        orderReturn = margin + diff;
                    } else {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentVariableTokens - onePercentFixedTokens
                        ) / 100;
                        assert(diff <= margin);
                        orderReturn = margin - diff;
                    }
                } else {
                    console.log("Non-maker");
                    if (onePercentVariableTokens >= onePercentFixedTokens) {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentVariableTokens - onePercentFixedTokens
                        ) / 100;
                        orderReturn = margin + diff;
                    } else {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentFixedTokens - onePercentVariableTokens
                        ) / 100;
                        assert(diff <= margin);
                        orderReturn = margin - diff;
                    }
                }
            } else {
                console.log("Variable");
                if (settler == order.maker) {
                    console.log("Maker");
                    if (onePercentVariableTokens >= onePercentFixedTokens) {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentVariableTokens - onePercentFixedTokens
                        ) / 100;
                        orderReturn = margin + diff;
                    } else {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentFixedTokens - onePercentVariableTokens
                        ) / 100;
                        assert(diff <= margin);
                        orderReturn = margin - diff;
                    }
                } else {
                    console.log("Non-maker");
                    if (onePercentFixedTokens >= onePercentVariableTokens) {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentFixedTokens - onePercentVariableTokens
                        ) / 100;
                        orderReturn = margin + diff;
                    } else {
                        uint256 diff = ABDKMath64x64.mulu(
                            term,
                            onePercentVariableTokens - onePercentFixedTokens
                        ) / 100;
                        assert(diff <= margin);
                        orderReturn = margin - diff;
                    }
                }
            }
        }
        console.log("Order Return: %s", orderReturn);
        _resetParticipant(orderHash, settler);
        // Transfer orderReturn underlying tokens to the settler
        _makeCall(
            order.underlyingAsset,
            abi.encodeWithSelector(
                IERC20.transfer.selector,
                settler,
                orderReturn
            )
        );
        return orderReturn;
    }

    function _defaultOrder(
        Order memory order,
        bytes32 orderHash,
        uint256 defFunds
    ) private {
        _resetDefaulter(orderHash, order.maker);
        isOrderDefaulted[orderHash] = true;
        defaultedFunds[orderHash] = defFunds;
    }

    function _resetDefaulter(bytes32 orderHash, address defaulter) private {
        _resetParticipant(orderHash, defaulter);
    }

    function _resetParticipant(bytes32 orderHash, address defaulter) private {
        orderParticipantFixedTokens[orderHash][defaulter] = 0;
        orderParticipantVariableTokens[orderHash][defaulter] = 0;
        orderParticipantMargin[orderHash][defaulter] = 0;
    }

    function _decreaseMakerFixedTokens(
        Order memory order,
        bytes32 orderHash,
        uint256 fixedTokens
    ) private {
        orderParticipantFixedTokens[orderHash][order.maker] -= fixedTokens;
    }

    function _decreaseMakerVariableTokens(
        Order memory order,
        bytes32 orderHash,
        uint256 variableTokens
    ) private {
        orderParticipantVariableTokens[orderHash][
            order.maker
        ] -= variableTokens;
    }

    function addMargin(
        Order memory order,
        address participant,
        uint256 amount
    ) external {
        require(amount > 0, "LOP: zero amount");
        // solhint-disable-next-line
        require(block.timestamp <= order.endTimestamp, "LOP: Order matured");
        bytes32 orderHash = hashOrder(order);
        require(!isOrderDefaulted[orderHash], "LOP: Order is defaulted");
        require(
            orderParticipantMargin[orderHash][participant] > 0,
            "LOP: No margin provided"
        );
        orderParticipantMargin[orderHash][participant] += amount;

        uint256 balanceBefore = _balance(order.underlyingAsset);
        _makeCall(
            order.underlyingAsset,
            abi.encodePacked(
                IERC20.transferFrom.selector,
                uint256(uint160(msg.sender)),
                uint256(uint160(address(this))),
                amount
            )
        );
        require(
            balanceBefore + amount <= _balance(order.underlyingAsset),
            "LOP: Margin not enough"
        );
    }

    function liquidate(Order memory order, address defaulter) external lock {
        // solhint-disable-next-line
        require(block.timestamp <= order.endTimestamp, "LOP: Order matured");
        bytes32 orderHash = hashOrder(order);
        require(!isOrderDefaulted[orderHash], "LOP: Order is defaulted");

        uint256 fixedTokens = 40000; // orderParticipantFixedTokens[orderHash][defaulter];
        uint256 variableTokens = 1000000; // orderParticipantVariableTokens[orderHash][defaulter];
        uint256 margin = 50000; // orderParticipantMargin[orderHash][defaulter];
        require(margin != 0, "LOP: Margin cannot be 0");
        uint256 reqMargin = getMarginReq(order, orderHash, defaulter);
        require(margin < reqMargin, "LOP: Margin is sufficient");

        uint256 liquidatorFee = 0;
        if (defaulter != msg.sender) {
            liquidatorFee = ABDKMath64x64.mulu(liquidatorMargin, margin);
        }
        uint256 leftMargin = margin - liquidatorFee;
        uint256 oppositePartyReward;
        if (defaulter != msg.sender) {
            oppositePartyReward = ABDKMath64x64.mulu(
                oppositePartyMargin,
                leftMargin
            );
        } else {
            oppositePartyReward = ABDKMath64x64.mulu(
                oppositePartyMarginNoLiquidator,
                leftMargin
            );
        }
        uint256 defaulterReturn = 0;
        if (leftMargin > oppositePartyReward) {
            defaulterReturn = leftMargin - oppositePartyReward;
        }

        console.log("Liquidation returns:");
        console.log(liquidatorFee);
        console.log(oppositePartyReward);
        console.log(defaulterReturn);

        if (defaulter == order.maker) {
            _defaultOrder(order, orderHash, oppositePartyReward);
        } else {
            _resetDefaulter(orderHash, defaulter);
            _decreaseMakerFixedTokens(order, orderHash, fixedTokens);
            _decreaseMakerVariableTokens(order, orderHash, variableTokens);
        }
        {
            address underlyingAsset = order.underlyingAsset;
            address maker = order.maker;

            // Transfer funds to liquidator, order maker, defaulter
            if (liquidatorFee > 0) {
                _makeCall(
                    underlyingAsset,
                    abi.encodeWithSelector(
                        IERC20.transfer.selector,
                        msg.sender,
                        liquidatorFee
                    )
                );
            }
            if (defaulter != maker && oppositePartyReward > 0) {
                _makeCall(
                    underlyingAsset,
                    abi.encodeWithSelector(
                        IERC20.transfer.selector,
                        maker,
                        oppositePartyReward
                    )
                );
            }
            if (defaulterReturn > 0) {
                _makeCall(
                    underlyingAsset,
                    abi.encodeWithSelector(
                        IERC20.transfer.selector,
                        defaulter,
                        defaulterReturn
                    )
                );
            }
        }
    }

    function getCIRModelParams(
        address asset,
        int128 t,
        int128 ewmaAPY
    )
        public
        view
        returns (
            int128 k,
            int128 lambda,
            int128 ct
        )
    {
        int128 beta = assetBeta[asset];
        int128 sigma = assetSigma[asset];
        console.log("Alpha, Beta, Sigma:");
        console.log(uint128(assetAlpha[asset]));
        console.log(uint128(beta));
        console.log(uint128(sigma));

        int128 exponent = ABDKMath64x64.exp2(
            ABDKMath64x64.mul(
                ABDKMath64x64.mul(ABDKMath64x64.mul(-1 * (1 << 64), beta), t),
                _LOG2E
            )
        );
        int128 numerator = ABDKMath64x64.mul(
            ABDKMath64x64.mul(ABDKMath64x64.mul(4 * (1 << 64), beta), ewmaAPY),
            exponent
        );
        int128 denominator = ABDKMath64x64.mul(
            ABDKMath64x64.mul(sigma, sigma),
            ABDKMath64x64.sub(1 * (1 << 64), exponent)
        );

        k = ABDKMath64x64.div(
            ABDKMath64x64.mul(4 * (1 << 64), assetAlpha[asset]),
            ABDKMath64x64.mul(sigma, sigma)
        );
        lambda = ABDKMath64x64.div(numerator, denominator);
        ct = ABDKMath64x64.div(
            denominator,
            ABDKMath64x64.mul(4 * (1 << 64), beta)
        );
        console.log("K, Lambda, Ct:");
        console.log(uint128(k));
        console.log(uint128(lambda));
        console.log(uint128(ct));
    }

    function getAPYBounds(
        int128 k,
        int128 lambda,
        int128 ct,
        int128 lowerBoundMul,
        int128 upperBoundMul
    ) public view returns (int128, int128) {
        int128 sqrtTerm = ABDKMath64x64.mul(
            2 * (1 << 64),
            ABDKMath64x64.add(k, ABDKMath64x64.mul(2 * (1 << 64), lambda))
        );
        int128 sqrtCal = ABDKMath64x64.exp2(
            ABDKMath64x64.mul(ABDKMath64x64.log2(sqrtTerm), _ONEBYTWO)
        );
        int128 upperBound = ABDKMath64x64.mul(
            ct,
            ABDKMath64x64.add(
                ABDKMath64x64.add(k, lambda),
                ABDKMath64x64.mul(upperBoundMul, sqrtCal)
            )
        );
        int128 lowerBound = ABDKMath64x64.mul(
            ct,
            ABDKMath64x64.sub(
                ABDKMath64x64.add(k, lambda),
                ABDKMath64x64.mul(lowerBoundMul, sqrtCal)
            )
        );
        // solhint-disable-next-line no-inline-assembly
        assembly {
            if gt(0, lowerBound) {
                lowerBound := 0
            }
        }
        console.log("Lower Bound, Upper Bound:");
        console.log(uint128(lowerBound));
        console.log(uint128(upperBound));
        return (lowerBound, upperBound);
    }

    function getInitialMarginReq(
        Order memory order,
        bytes32 orderHash,
        address participant
    ) public view returns (uint256) {
        return
            _getMarginReqWithMuls(
                order,
                orderHash,
                participant,
                1 << 64,
                1 << 64
            );
    }

    function getMarginReq(
        Order memory order,
        bytes32 orderHash,
        address participant
    ) public view returns (uint256) {
        return
            _getMarginReqWithMuls(
                order,
                orderHash,
                participant,
                1 << 64,
                1 << 64
            );
    }

    function _getMarginReqWithMuls(
        Order memory order,
        bytes32 orderHash,
        address participant,
        int128 tl,
        int128 tu
    ) private view returns (uint256) {
        require(order.endTimestamp >= block.timestamp, "LOP: Order matured"); // solhint-disable-line
        require(!isOrderDefaulted[orderHash], "LOP: Order defaulted");
        int128 apyLower;
        int128 apyUpper;
        int128 term = order.t;
        int128 accruedAPY;
        address asset = order.asset;
        {
            int128 ewma;
            (accruedAPY, ewma) = getAverageAccruedAPYBetweenTimestamps(
                asset,
                order.underlyingAsset,
                order.beginTimestamp,
                block.timestamp // solhint-disable-line
            );
            console.log("apy: %s", uint128(accruedAPY));
            int128 t = ABDKMath64x64.divu(
                order.endTimestamp - block.timestamp,
                order.endTimestamp - order.beginTimestamp
            ); // solhint-disable-line
            console.log("t: %s", uint128(t));

            (int128 k, int128 lambda, int128 ct) = getCIRModelParams(
                asset,
                t,
                ewma
            );
            (apyLower, apyUpper) = getAPYBounds(
                k,
                lambda,
                ct,
                assetLowerBoundMul[asset],
                assetUpperBoundMul[asset]
            );
        }
        {
            int128 w1 = ABDKMath64x64.divu(
                block.timestamp - order.beginTimestamp,
                order.endTimestamp - order.beginTimestamp
            ); // solhint-disable-line
            int128 w2 = ABDKMath64x64.divu(
                order.endTimestamp - block.timestamp,
                order.endTimestamp - order.beginTimestamp
            ); // solhint-disable-line
            apyLower = ABDKMath64x64.add(
                ABDKMath64x64.mul(w1, accruedAPY),
                ABDKMath64x64.mul(w2, apyLower)
            );
            apyUpper = ABDKMath64x64.add(
                ABDKMath64x64.mul(w1, accruedAPY),
                ABDKMath64x64.mul(w2, apyUpper)
            );
            apyLower = ABDKMath64x64.mul(apyLower, tl);
            apyUpper = ABDKMath64x64.mul(apyUpper, tu);
            console.log("APY Lower, APY Upper:");
            console.log(uint128(apyLower));
            console.log(uint128(apyUpper));
        }
        uint256 positiveMargin;
        uint256 negativeMargin;
        {
            uint256 fixedTokens = orderParticipantFixedTokens[orderHash][
                participant
            ];
            uint256 variableTokens = orderParticipantVariableTokens[orderHash][
                participant
            ];
            if (order.isFixedTaker) {
                console.log("Fixed");
                if (participant == order.maker) {
                    console.log("Maker");
                    positiveMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(apyUpper, term),
                        variableTokens
                    );
                    negativeMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(_ONEBYHUNDRED, term),
                        fixedTokens
                    );
                } else {
                    console.log("Non-maker");
                    positiveMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(_ONEBYHUNDRED, term),
                        fixedTokens
                    );
                    negativeMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(apyLower, term),
                        variableTokens
                    );
                }
            } else {
                console.log("Variable");
                if (participant == order.maker) {
                    console.log("Maker");
                    positiveMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(_ONEBYHUNDRED, term),
                        fixedTokens
                    );
                    negativeMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(apyLower, term),
                        variableTokens
                    );
                } else {
                    console.log("Non-maker");
                    positiveMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(apyUpper, term),
                        variableTokens
                    );
                    negativeMargin = ABDKMath64x64.mulu(
                        ABDKMath64x64.mul(_ONEBYHUNDRED, term),
                        fixedTokens
                    );
                }
            }
            console.log("Positive Margin, Negative Margin:");
            console.log(positiveMargin);
            console.log(negativeMargin);
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

    function getAverageAccruedAPYBetweenTimestamps(
        address asset,
        address underlyingAsset,
        uint256 startTimestamp,
        uint256 endTimestamp
    ) public view returns (int128 apy, int128 ewma) {
        bytes memory result = _oracle.functionStaticCall(
            abi.encodeWithSelector(
                OracleMock.getAverageAccruedAPYBetweenTimestamps.selector,
                asset,
                underlyingAsset,
                startTimestamp,
                endTimestamp
            )
        );
        require(result.length == 32, "LOP: invalid call result");
        int256 answer = result.decodeInt256();
        apy = int128((answer << 128) >> 128);
        ewma = int128(answer >> 128);
        console.log("Mock Oracle");
        console.log(uint128(apy));
        console.log(uint128(ewma));
    }

    function _balance(address token) private view returns (uint256) {
        bytes memory result = token.functionStaticCall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
        );
        require(result.length == 32, "LOP: invalid call result");
        return result.decodeUint256();
    }

    function _makeCall(address asset, bytes memory assetData) private {
        bytes memory result = asset.functionCall(
            assetData,
            "LOP: asset.call failed"
        );
        if (result.length > 0) {
            require(
                result.length == 32 && result.decodeBool(),
                "LOP: asset.call bad result"
            );
        }
    }

    function _callGetter(
        bytes memory getter,
        uint256 orderExpectedAmount,
        uint256 orderResultAmount,
        uint256 amount
    ) private view returns (uint256) {
        if (getter.length == 0) {
            // On empty getter calldata only exact amount is allowed
            require(amount == orderExpectedAmount, "LOP: wrong amount");
            return orderResultAmount;
        } else {
            bytes memory result = address(this).functionStaticCall(
                abi.encodePacked(getter, amount),
                "LOP: getAmount call failed"
            );
            require(result.length == 32, "LOP: invalid getAmount return");
            return result.decodeUint256();
        }
    }
}
