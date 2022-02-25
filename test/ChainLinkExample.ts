import { expect } from "chai";
import { ethers } from "hardhat";
import { signTypedMessage } from "eth-sig-util";
import { constants } from "@openzeppelin/test-helpers";

import { TokenMock } from "../typechain-types/TokenMock";
import { LimitOrderProtocol } from "../typechain-types/LimitOrderProtocol";
import { AggregatorMock } from "../typechain-types/AggregatorMock";
import { OracleMock } from "../typechain-types/OracleMock";

import { buildOrderData } from "./helpers/orderUtils";
import { toBN, cutLastArg } from "./helpers/utils";

describe("ChainLinkExample", async function () {
    let dai: TokenMock,
        daiWallet: TokenMock,
        oracle: AggregatorMock,
        apyOracle: OracleMock,
        swap: LimitOrderProtocol;
    let _: string, wallet: string;
    let chainId: any;
    const walletPrivateKey =
        "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

    function buildInverseWithSpread(inverse: boolean, spread: string) {
        return toBN(spread).setn(255, inverse).toString();
    }

    function buildSinglePriceGetter(
        oracle: AggregatorMock,
        inverse: boolean,
        spread: string,
        amount = "0"
    ) {
        const abi = [
            "function singlePrice(address oracle, uint256 inverseAndSpread, uint256 amount)",
        ];
        const iface = new ethers.utils.Interface(abi);
        return iface.encodeFunctionData("singlePrice", [
            oracle.address,
            buildInverseWithSpread(inverse, spread),
            amount,
        ]);
    }

    function buildOrder(
        salt: string,
        asset: string,
        underlyingAsset: string,
        fixedTokens: string,
        variableTokens: string,
        isFixedTaker: boolean,
        beginTimestamp: string,
        endTimestamp: string,
        t: string,
        allowedSender = constants.ZERO_ADDRESS,
        predicate = "0x",
        permit = "0x",
        interaction = "0x"
    ) {
        let makerGetter: string, takerGetter: string;
        if (isFixedTaker) {
            makerGetter = cutLastArg(
                buildSinglePriceGetter(oracle, false, "1010000000")
            );
            takerGetter = cutLastArg(
                buildSinglePriceGetter(oracle, true, "990000000")
            );
        } else {
            makerGetter = cutLastArg(
                buildSinglePriceGetter(oracle, true, "1010000000")
            );
            takerGetter = cutLastArg(
                buildSinglePriceGetter(oracle, false, "990000000")
            );
        }
        return {
            salt: salt,
            asset: asset,
            underlyingAsset: underlyingAsset,
            fixedTokens: fixedTokens,
            variableTokens: variableTokens,
            maker: wallet,
            receiver: constants.ZERO_ADDRESS,
            allowedSender,
            makerAssetData: "0x",
            takerAssetData: "0x",
            getMakerAmount: makerGetter,
            getTakerAmount: takerGetter,
            predicate,
            permit,
            interaction,
            isFixedTaker,
            beginTimestamp,
            endTimestamp,
            t,
        };
    }

    before(async function () {
        const accounts = await ethers.getSigners();
        _ = accounts[0].address;
        wallet = accounts[1].address;
    });

    beforeEach(async function () {
        const TokenMockFactory = await ethers.getContractFactory("TokenMock");
        const TokenMockFactoryWallet = await ethers.getContractFactory(
            "TokenMock",
            (
                await ethers.getSigners()
            )[1]
        );
        const LimitOrderProtocolFactory = await ethers.getContractFactory(
            "LimitOrderProtocol"
        );
        const AggregatorMockFactory = await ethers.getContractFactory(
            "AggregatorMock"
        );
        const OracleMockFactory = await ethers.getContractFactory("OracleMock");

        dai = (await TokenMockFactory.deploy("DAI", "DAI")) as TokenMock;
        dai = await dai.deployed();
        daiWallet = TokenMockFactoryWallet.attach(dai.address) as TokenMock;

        apyOracle = (await OracleMockFactory.deploy(
            "251084069415467230335650862098906040028272338785178107248"
        )) as OracleMock;
        apyOracle = await apyOracle.deployed();

        swap = (await LimitOrderProtocolFactory.deploy(
            apyOracle.address
        )) as LimitOrderProtocol;
        swap = await swap.deployed();

        oracle = (await AggregatorMockFactory.deploy(
            "737869762948382064"
        )) as AggregatorMock;
        oracle = await oracle.deployed();

        await swap.setAssetAlpha(
            dai.address,
            toBN("18446744073709551616").div(toBN(25)).toString()
        );
        await swap.setAssetBeta(
            dai.address,
            toBN("18446744073709551616").div(toBN(25)).toString()
        );
        await swap.setAssetSigma(
            dai.address,
            toBN("18446744073709551616").div(toBN(25)).toString()
        );
        await swap.setAssetLowerBoundMul(
            dai.address,
            toBN("18446744073709551616").mul(toBN(2)).toString()
        );
        await swap.setAssetUpperBoundMul(
            dai.address,
            toBN("18446744073709551616").mul(toBN(2)).toString()
        );

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        chainId = (await dai.getChainId()).toNumber();
        await dai.mint(_, "100000000");
        await dai.mint(wallet, "100000000");
        await dai.mint(swap.address, "100000000");
    });

    it("chainlink+eps order", async function () {
        const startTimestamp =
            (await ethers.provider.getBlock("latest")).timestamp - 8640000;
        const endTimestamp = startTimestamp + 31536000;
        const order = buildOrder(
            "1",
            dai.address,
            dai.address,
            "5000000",
            "1000000",
            true,
            startTimestamp.toString(),
            endTimestamp.toString(),
            toBN("18446744073709551616").toString()
        );

        await dai.approve(swap.address, "100000000");
        await daiWallet.approve(swap.address, "100000000");
        const data = buildOrderData(chainId, swap.address, order, "Order");
        const signature = signTypedMessage(
            Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any,
            { data }
        );
        const response = await swap.fillOrder(
            order,
            signature,
            "5000000",
            0,
            "999900"
        );
        const receipt = await response.wait(1);

        let orderHash: string;
        receipt.events.forEach((event) => {
            if (event.event === "OrderFilled") {
                orderHash = event.args.orderHash;
            }
        });
        expect(
            (
                await swap.orderParticipantFixedTokens(orderHash, wallet)
            ).toNumber()
        ).to.be.equal(4039999);
        expect(
            (
                await swap.orderParticipantVariableTokens(orderHash, wallet)
            ).toNumber()
        ).to.be.equal(1000000);
        expect(
            (await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()
        ).to.be.equal(4039999);
        expect(
            (await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()
        ).to.be.equal(1000000);
    });

    it("stop loss order", async function () {
        const startTimestamp =
            (await ethers.provider.getBlock("latest")).timestamp - 8640000;
        const endTimestamp = startTimestamp + 31536000;
        const order = buildOrder(
            "1",
            dai.address,
            dai.address,
            "5000000",
            "2000000",
            true,
            startTimestamp.toString(),
            endTimestamp.toString(),
            toBN("18446744073709551616").toString()
        );

        await dai.approve(swap.address, "100000000");
        await daiWallet.approve(swap.address, "100000000");
        const data = buildOrderData(chainId, swap.address, order, "Order");
        const signature = signTypedMessage(
            Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any,
            { data }
        );
        const response = await swap.fillOrder(
            order,
            signature,
            "5000000",
            0,
            "999900"
        );
        const receipt = await response.wait(1);

        let orderHash: string;
        receipt.events.forEach((event) => {
            if (event.event === "OrderFilled") {
                orderHash = event.args.orderHash;
            }
        });
        expect(
            (
                await swap.orderParticipantFixedTokens(orderHash, wallet)
            ).toNumber()
        ).to.be.equal(5000000);
        expect(
            (
                await swap.orderParticipantVariableTokens(orderHash, wallet)
            ).toNumber()
        ).to.be.equal(1237500);
        expect(
            (await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()
        ).to.be.equal(5000000);
        expect(
            (await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()
        ).to.be.equal(1237500);
    });
});
