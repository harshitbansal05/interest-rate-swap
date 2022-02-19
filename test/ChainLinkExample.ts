import { expect } from "chai";
import { ethers } from "hardhat";
import ethSigUtil from "eth-sig-util";
import { ether, expectRevert, constants } from "@openzeppelin/test-helpers";

import { TokenMock } from "../typechain-types/TokenMock";
import { LimitOrderProtocol } from "../typechain-types/LimitOrderProtocol";
import { AggregatorMock } from "../typechain-types/AggregatorMock";

import { buildOrderData } from "./helpers/orderUtils";
import { toBN, cutLastArg } from "./helpers/utils";

describe('ChainLinkExample', async function () {
    let dai: TokenMock, oracle: AggregatorMock, swap: LimitOrderProtocol, swapWallet: LimitOrderProtocol;
    let _: string, wallet: string;

    const privatekey = '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
    // const account = Wallet.fromPrivateKey(Buffer.from(privatekey, 'hex'));

    function buildInverseWithSpread (inverse: boolean, spread: string) {
        return toBN(spread).setn(255, inverse).toString();
    }

    function buildSinglePriceGetter (swap: LimitOrderProtocol, oracle: AggregatorMock, inverse: boolean, spread: string, amount = '0') {
        let abi = [
            "function singlePrice(address oracle, uint256 inverseAndSpread, uint256 amount)"
        ];
        let iface = new ethers.utils.Interface(abi);
        return iface.encodeFunctionData("singlePrice", [ oracle.address, buildInverseWithSpread(inverse, spread), amount ]);
    }

    // eslint-disable-next-line no-unused-vars
    function buildDoublePriceGetter (swap: LimitOrderProtocol, oracle1: AggregatorMock, oracle2: AggregatorMock, spread: string, amount = '0') {
        let abi = [
            "function doublePrice(address oracle1, address oracle2, uint256 spread, int256 decimalsScale, uint256 amount)"
        ];
        let iface = new ethers.utils.Interface(abi);
        return iface.encodeFunctionData("doublePrice", [ oracle1.address, oracle2.address, buildInverseWithSpread(false, spread), "0", amount ]);
    }

    function buildOrder (
        salt: string,
        asset: string,
        underlyingAsset: string,
        fixedTokens: string,
        variableTokens: string,
        fixedTokensGetter: string,
        variableTokensGetter: string,
        isFixedTaker: boolean,
        beginTimestamp: string,
        endTimestamp: string,
        t: string,
        allowedSender = constants.ZERO_ADDRESS,
        predicate = '0x',
        permit = '0x',
        interaction = '0x'
    ) {
        return {
            salt: salt,
            asset: asset,
            underlyingAsset: underlyingAsset,
            fixedTokens: fixedTokens, 
            variableTokens: variableTokens,
            maker: _,
            receiver: constants.ZERO_ADDRESS,
            allowedSender,
            makerAssetData: '0x',
            takerAssetData: '0x',
            getFixedTokens: fixedTokensGetter,
            getVariableTokens: variableTokensGetter,
            predicate,
            permit,
            interaction,
            isFixedTaker,
            beginTimestamp,
            endTimestamp,
            t
        };
    }

    before(async function () {
        const accounts = await ethers.getSigners();
        _ = accounts[0].address;
        wallet = accounts[1].address;
    });

    beforeEach(async function () {
        const TokenMockFactory = await ethers.getContractFactory("TokenMock");
        const LimitOrderProtocolFactory = await ethers.getContractFactory("LimitOrderProtocol");
        const LimitOrderProtocolFactoryWallet = await ethers.getContractFactory("LimitOrderProtocol", (await ethers.getSigners())[1]);
        const AggregatorMockFactory = await ethers.getContractFactory("AggregatorMock");

        dai = (await TokenMockFactory.deploy("DAI", "DAI")) as TokenMock;
        await dai.deployed();

        swap = (await LimitOrderProtocolFactory.deploy()) as LimitOrderProtocol;
        await swap.deployed();
        swapWallet = (await LimitOrderProtocolFactoryWallet.deploy()) as LimitOrderProtocol;
        await swapWallet.deployed();

        oracle = (await AggregatorMockFactory.deploy("1")) as AggregatorMock;
        await oracle.deployed();
        
        swap.setAssetAlpha(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        swap.setAssetBeta(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        swap.setAssetSigma(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        swap.setAssetLowerBoundMul(dai.address, toBN("18446744073709551616").mul(toBN(2)).toString());
        swap.setAssetUpperBoundMul(dai.address, toBN("18446744073709551616").mul(toBN(2)).toString());

        swapWallet.setAssetAlpha(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        swapWallet.setAssetBeta(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        swapWallet.setAssetSigma(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        swapWallet.setAssetLowerBoundMul(dai.address, toBN("18446744073709551616").mul(toBN(2)).toString());
        swapWallet.setAssetUpperBoundMul(dai.address, toBN("18446744073709551616").mul(toBN(2)).toString());
        
        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = await dai.getChainId();

        await dai.mint(wallet, "1000000");
        await dai.mint(_, "1000000");
        await dai.mint(swap.address, "1000000");
        await dai.mint(swapWallet.address, "1000000");

        // await dai.approve(swap.address, ether('1000000'));
        // await dai.approve(swap.address, ether('1000000'), { from: wallet });
    });

    it('eth -> dai chainlink+eps order', async function () {
        // chainlink rate is 1 eth = 4000 dai
        const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 31536000;
        console.log(startTimestamp);
        const endTimestamp = startTimestamp + 3153600;
        const order = buildOrder(
            "1", dai.address, dai.address, "400", "100",
            cutLastArg(buildSinglePriceGetter(swap, oracle, false, '990000000')), // maker offset is 0.99
            cutLastArg(buildSinglePriceGetter(swap, oracle, true, '1010000000')), // taker offset is 1.01
            true,
            startTimestamp.toString(),
            endTimestamp.toString(),
            toBN("18446744073709551616").toString()
        );
        
        const orderHash = await swap.hashOrder(order);    
        console.log(orderHash);
        console.log(order.maker);
        // const margin = await swap.getMarginReq(order, orderHash, _);
        console.log(await dai.balanceOf(_));
        console.log(await dai.balanceOf(swap.address));
        await swap.settleOrder(order, _);
        console.log(await dai.balanceOf(_));
        console.log(await dai.balanceOf(swap.address));
        // console.log(margin);
        // const data = buildOrderData(this.chainId, this.swap.address, order);
        // const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

        // const makerDai = await this.dai.balanceOf(wallet);
        // const takerDai = await this.dai.balanceOf(_);
        // const makerWeth = await this.weth.balanceOf(wallet);
        // const takerWeth = await this.weth.balanceOf(_);

        // await this.swap.fillOrder(order, signature, ether('1'), 0, ether('4040.01')); // taking threshold = 4000 + 1% + eps

        // expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.add(ether('4040')));
        // expect(await this.dai.balanceOf(_)).to.be.bignumber.equal(takerDai.sub(ether('4040')));
        // expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.sub(ether('1')));
        // expect(await this.weth.balanceOf(_)).to.be.bignumber.equal(takerWeth.add(ether('1')));
    });
    /*
    it('dai -> 1inch stop loss order', async function () {
        const makerAmount = ether('100');
        const takerAmount = ether('631');
        const priceCall = buildDoublePriceGetter(this.swap, this.inchOracle, this.daiOracle, '1000000000', ether('1'));
        const predicate = this.swap.contract.methods.lt(ether('6.32'), this.swap.address, priceCall).encodeABI();

        const order = buildOrder(
            '1', this.inch, this.dai, makerAmount.toString(), takerAmount.toString(),
            cutLastArg(this.swap.contract.methods.getMakerAmount(makerAmount, takerAmount, 0).encodeABI()),
            cutLastArg(this.swap.contract.methods.getTakerAmount(makerAmount, takerAmount, 0).encodeABI()),
            constants.ZERO_ADDRESS,
            predicate,
        );
        const data = buildOrderData(this.chainId, this.swap.address, order);
        const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

        const makerDai = await this.dai.balanceOf(wallet);
        const takerDai = await this.dai.balanceOf(_);
        const makerInch = await this.inch.balanceOf(wallet);
        const takerInch = await this.inch.balanceOf(_);

        await this.swap.fillOrder(order, signature, makerAmount, 0, takerAmount.add(ether('0.01'))); // taking threshold = exact taker amount + eps

        expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.add(takerAmount));
        expect(await this.dai.balanceOf(_)).to.be.bignumber.equal(takerDai.sub(takerAmount));
        expect(await this.inch.balanceOf(wallet)).to.be.bignumber.equal(makerInch.sub(makerAmount));
        expect(await this.inch.balanceOf(_)).to.be.bignumber.equal(takerInch.add(makerAmount));
    });

    it('dai -> 1inch stop loss order predicate is invalid', async function () {
        const makerAmount = ether('100');
        const takerAmount = ether('631');
        const priceCall = buildDoublePriceGetter(this.swap, this.inchOracle, this.daiOracle, '1000000000', ether('1'));
        const predicate = this.swap.contract.methods.lt(ether('6.31'), this.swap.address, priceCall).encodeABI();

        const order = buildOrder(
            '1', this.inch, this.dai, makerAmount.toString(), takerAmount.toString(),
            cutLastArg(this.swap.contract.methods.getMakerAmount(makerAmount, takerAmount, 0).encodeABI()),
            cutLastArg(this.swap.contract.methods.getTakerAmount(makerAmount, takerAmount, 0).encodeABI()),
            constants.ZERO_ADDRESS,
            predicate,
        );
        const data = buildOrderData(this.chainId, this.swap.address, order);
        const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

        await expectRevert(
            this.swap.fillOrder(order, signature, makerAmount, 0, takerAmount.add(ether('0.01'))), // taking threshold = exact taker amount + eps
            'LOP: predicate returned false',
        );
    });

    it('eth -> dai stop loss order', async function () {
        const makerAmount = ether('1');
        const takerAmount = ether('4000');
        const latestAnswerCall = this.daiOracle.contract.methods.latestAnswer().encodeABI();
        const predicate = this.swap.contract.methods.lt(ether('0.0002501'), this.daiOracle.address, latestAnswerCall).encodeABI();

        const order = buildOrder(
            '1', this.weth, this.dai, makerAmount.toString(), takerAmount.toString(),
            cutLastArg(this.swap.contract.methods.getMakerAmount(makerAmount, takerAmount, 0).encodeABI()),
            cutLastArg(this.swap.contract.methods.getTakerAmount(makerAmount, takerAmount, 0).encodeABI()),
            constants.ZERO_ADDRESS,
            predicate,
        );
        const data = buildOrderData(this.chainId, this.swap.address, order);
        const signature = ethSigUtil.signTypedMessage(account.getPrivateKey(), { data });

        const makerDai = await this.dai.balanceOf(wallet);
        const takerDai = await this.dai.balanceOf(_);
        const makerWeth = await this.weth.balanceOf(wallet);
        const takerWeth = await this.weth.balanceOf(_);

        await this.swap.fillOrder(order, signature, makerAmount, 0, takerAmount);

        expect(await this.dai.balanceOf(wallet)).to.be.bignumber.equal(makerDai.add(takerAmount));
        expect(await this.dai.balanceOf(_)).to.be.bignumber.equal(takerDai.sub(takerAmount));
        expect(await this.weth.balanceOf(wallet)).to.be.bignumber.equal(makerWeth.sub(makerAmount));
        expect(await this.weth.balanceOf(_)).to.be.bignumber.equal(takerWeth.add(makerAmount));
    });
    */
});
