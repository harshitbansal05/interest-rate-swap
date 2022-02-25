import chai, { expect } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { bufferToHex } from "ethereumjs-util";
import { signTypedMessage, TypedDataUtils } from "eth-sig-util";
import { constants } from "@openzeppelin/test-helpers";

import { TokenMock } from "../typechain-types/TokenMock";
import { LimitOrderProtocol } from "../typechain-types/LimitOrderProtocol";
import { OracleMock } from "../typechain-types/OracleMock";

import { buildOrderData } from "./helpers/orderUtils";
import { withTarget, getPermit } from "./helpers/eip712";
import { toBN, cutLastArg } from "./helpers/utils";
import { profileEVM } from "./helpers/profileEVM";

chai.use(solidity);

describe("LimitOrderProtocol", async function () {
    let dai: TokenMock, daiWallet: TokenMock, swap: LimitOrderProtocol, apyOracle: OracleMock;
    let _: string, wallet: string;
    let chainId: any;

    const _PrivateKey = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const walletPrivateKey = "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    
    function makerTokensGetter (orderMakerAmount: string, orderTakerAmount: string, amount = '0') {
        let abi = [
            "function getMakerAmount(uint256 orderMakerAmount, uint256 orderTakerAmount, uint256 swapTakerAmount)"
        ];
        let iface = new ethers.utils.Interface(abi);
        return iface.encodeFunctionData("getMakerAmount", [ orderMakerAmount, orderTakerAmount, amount ]);
    }

    function takerTokensGetter (orderMakerAmount: string, orderTakerAmount: string, amount = '0') {
        let abi = [
            "function getTakerAmount(uint256 orderMakerAmount, uint256 orderTakerAmount, uint256 swapTakerAmount)"
        ];
        let iface = new ethers.utils.Interface(abi);
        return iface.encodeFunctionData("getTakerAmount", [ orderMakerAmount, orderTakerAmount, amount ]);
    }

    function buildOrder (
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
        predicate = '0x',
        permit = '0x',
        interaction = '0x'
    ) {
        let makerAmount: string, takerAmount: string;
        if (isFixedTaker) {
            makerAmount = fixedTokens; 
            takerAmount = variableTokens;
        } else {
            makerAmount = variableTokens;
            takerAmount = fixedTokens;
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
            makerAssetData: '0x',
            takerAssetData: '0x',
            getMakerAmount: cutLastArg(makerTokensGetter(makerAmount, takerAmount)),
            getTakerAmount: cutLastArg(takerTokensGetter(makerAmount, takerAmount)),
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
        const TokenMockFactoryWallet = await ethers.getContractFactory("TokenMock", (await ethers.getSigners())[1]);
        const LimitOrderProtocolFactory = await ethers.getContractFactory("LimitOrderProtocol");
        const OracleMockFactory = await ethers.getContractFactory("OracleMock");

        dai = (await TokenMockFactory.deploy("DAI", "DAI")) as TokenMock;
        dai = await dai.deployed();
        daiWallet = (TokenMockFactoryWallet.attach(dai.address)) as TokenMock;

        apyOracle = (await OracleMockFactory.deploy("251084069415467230335650862098906040028272338785178107248")) as OracleMock;
        apyOracle = await apyOracle.deployed();

        swap = (await LimitOrderProtocolFactory.deploy(apyOracle.address)) as LimitOrderProtocol;
        swap = await swap.deployed();

        await swap.setAssetAlpha(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        await swap.setAssetBeta(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        await swap.setAssetSigma(dai.address, toBN("18446744073709551616").div(toBN(25)).toString());
        await swap.setAssetLowerBoundMul(dai.address, toBN("18446744073709551616").mul(toBN(2)).toString());
        await swap.setAssetUpperBoundMul(dai.address, toBN("18446744073709551616").mul(toBN(2)).toString());

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        chainId = (await dai.getChainId()).toNumber();
        await dai.mint(_, "100000000");
        await dai.mint(wallet, "100000000");
        await dai.mint(swap.address, "100000000");
    });

    describe("wip", async function () {
        it("transferFrom", async function () {
            await dai.approve(wallet, "2");
            await daiWallet.transferFrom(_, wallet, "1");
        });

        it("should not swap with bad signature", async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            const sentOrder = buildOrder(
                "1", dai.address, dai.address, "2", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(sentOrder, signature, 1, 0, 1)).to.be.revertedWith("LOP: bad signature");
        });

        it("should not fill (1,1)", async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 1, 1, 1)).to.be.revertedWith("LOP: only one amount should be 0");
        });

        it("should not fill above threshold", async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 1, 0, 2)).to.be.revertedWith("LOP: Tokens less than threshold");
        });

        it("should not fill below threshold", async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "2", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 0, 2, 1)).to.be.revertedWith("LOP: Tokens less than threshold");
        });
        
        it('should fail when both amounts are zero', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 0, 0, 0)).to.be.revertedWith("LOP: only one amount should be 0");
        });
        
        it('should swap fully based on signature', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const makerDai = await dai.balanceOf(wallet);
            const takerDai = await dai.balanceOf(_); 
            const swapDai = await dai.balanceOf(swap.address);            
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);

            // expect(
            //     await profileEVM(receipt.transactionHash, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
            // ).to.be.deep.equal([2, 2, 7, 7, 3]);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);

            expect((await dai.balanceOf(wallet)).toNumber()).to.be.lessThan(makerDai.toNumber());
            expect((await dai.balanceOf(_)).toNumber()).to.be.lessThan(takerDai.toNumber());
            expect((await dai.balanceOf(swap.address)).toNumber()).to.be.greaterThan(swapDai.toNumber());
        });
        
        it('should swap half based on signature', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "2", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const takerDai = await dai.balanceOf(_);
            const makerDai = await dai.balanceOf(wallet); 
            const swapDai = await dai.balanceOf(swap.address);            
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);

            // expect(
            //     await profileEVM(receipt.transactionHash, ['CALL', 'STATICCALL', 'SSTORE', 'SLOAD', 'EXTCODESIZE']),
            // ).to.be.deep.equal([2, 2, 7, 7, 3]);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);

            expect((await dai.balanceOf(_)).toNumber()).to.be.lessThan(takerDai.toNumber());
            expect((await dai.balanceOf(wallet)).toNumber()).to.be.lessThan(makerDai.toNumber());
            expect((await dai.balanceOf(swap.address)).toNumber()).to.be.greaterThan(swapDai.toNumber());
        });

        it('should floor taker amount', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "10", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 9, 0, 1);
            const receipt = await response.wait(1);
            
            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(9);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(9);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('should fail on floor maker amount = 0', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "10", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 4, 0, 0)).to.be.revertedWith("LOP: can't swap 0 amount");
        });

        it('should ceil maker amount', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "10", "4",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 0, 1, 3);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(3);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(3);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });
   });

   describe('Permit', function () {
        it('fillOrderToWithPermit', async function () {
            const orderMakerPermit = await getPermit(wallet, walletPrivateKey, dai, '1', chainId, swap.address, '100');
            const targetorderMakerPermitPair = withTarget(dai.address, orderMakerPermit);
            const orderTakerPermit = await getPermit(_, _PrivateKey, dai, '1', chainId, swap.address, '100');
            const targetorderTakerPermitPair = withTarget(dai.address, orderTakerPermit);

            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                constants.ZERO_ADDRESS, "0x",
                targetorderMakerPermitPair
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            
            const makerDai = await dai.balanceOf(wallet);
            const takerDai = await dai.balanceOf(_); 
            const swapDai = await dai.balanceOf(swap.address);            
            const response = await swap.fillOrderToWithPermit(order, signature, 1, 0, 1, targetorderTakerPermitPair);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);

            expect((await dai.balanceOf(wallet)).toNumber()).to.be.lessThan(makerDai.toNumber());
            expect((await dai.balanceOf(_)).toNumber()).to.be.lessThan(takerDai.toNumber());
            expect((await dai.balanceOf(swap.address)).toNumber()).to.be.greaterThan(swapDai.toNumber());
        });
        
        it('rejects reused signature', async function () {
            const orderTakerPermit = await getPermit(_, _PrivateKey, dai, '1', chainId, swap.address, '100');
            const targetorderTakerPermitPair = withTarget(dai.address, orderTakerPermit);

            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "2", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrderToWithPermit(order, signature, 1, 0, 1, targetorderTakerPermitPair);
            await response.wait(1);
            await expect(swap.fillOrderToWithPermit(order, signature, 1, 0, 1, targetorderTakerPermitPair)).to.be.revertedWith("ERC20Permit: invalid signature");
        });

        it('rejects other signature', async function () {
            const orderTakerPermit = await getPermit(_, walletPrivateKey, dai, '1', chainId, swap.address, '100');
            const targetorderTakerPermitPair = withTarget(dai.address, orderTakerPermit);

            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "2", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrderToWithPermit(order, signature, 1, 0, 1, targetorderTakerPermitPair)).to.be.revertedWith("ERC20Permit: invalid signature");
        });
        
        it('rejects expired permit', async function () {
            const deadline = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const orderTakerPermit = await getPermit(_, _PrivateKey, dai, '1', chainId, swap.address, '100', deadline.toString());
            const targetorderTakerPermitPair = withTarget(dai.address, orderTakerPermit);

            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrderToWithPermit(order, signature, 1, 0, 1, targetorderTakerPermitPair)).to.be.revertedWith("expired deadline");
        });
    });

    describe('Amount Calculator', async function () {
        it('empty getTakerAmount should work on full fill', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            order.getTakerAmount ="0x";
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('empty getTakerAmount should not work on partial fill', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "2", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            order.getTakerAmount ="0x";
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 1, 0, 1)).to.be.revertedWith("LOP: wrong amount");
        });

        it('empty getMakerAmount should work on full fill', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            order.getMakerAmount ="0x";
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 0, 1, 1);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('empty getMakerAmount should not work on partial fill', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "2", "2",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            order.getMakerAmount ="0x";
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 0, 1, 1)).to.be.revertedWith("LOP: wrong amount");
        });
    });

    describe('Order Cancelation', async function () {
        let order: any;
        beforeEach(async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
        });

        it('should cancel own order', async function () {
            order.maker = _;
            await swap.cancelOrder(order);
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const orderHash = bufferToHex(TypedDataUtils.sign(data));
            expect(await swap.remaining(orderHash)).to.be.equal(0);
        });

        it('should not cancel foreign order', async function () {
            await expect(swap.cancelOrder(order)).to.be.revertedWith("LOP: Access denied");
        });
    });

    describe('Private Orders', async function () {
        it('should fill with correct taker', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                _
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('should not fill with incorrect taker', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                wallet
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await expect(swap.fillOrder(order, signature, 1, 0, 1)).to.be.revertedWith("LOP: private order");
        });
    });

    describe('Predicate', async function () {
        let iface: any, ifaceToken: any;
        beforeEach(async function () {
            let abi = [
                "function gt(uint256 value, address target, bytes memory data)",
                "function lt(uint256 value, address target, bytes memory data)",
                "function timestampBelow(uint256 time)",
                "function or(address[] calldata targets, bytes[] calldata data)",
                "function and(address[] calldata targets, bytes[] calldata data)",
                "function nonceEquals(address makerAddress, uint256 makerNonce)"
            ];
            let abiToken = [ "function balanceOf(address account)" ];
            iface = new ethers.utils.Interface(abi);
            ifaceToken = new ethers.utils.Interface(abiToken);
        });

        it('`or` should pass', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const ts = iface.encodeFunctionData("timestampBelow", [ 0xff0000 ]);
            const balanceCall = ifaceToken.encodeFunctionData("balanceOf", [ wallet ]);
            const gt = iface.encodeFunctionData("gt", [ "100", dai.address, balanceCall ]);
            const predicate = iface.encodeFunctionData("or", [ [ swap.address, swap.address ], [ ts, gt ] ]);
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                constants.ZERO_ADDRESS, predicate
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);
            
            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('`or` should fail', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const ts = iface.encodeFunctionData("timestampBelow", [ 0xff0000 ]);
            const balanceCall = ifaceToken.encodeFunctionData("balanceOf", [ wallet ]);
            const lt = iface.encodeFunctionData("lt", [ "100", dai.address, balanceCall ]);
            const predicate = iface.encodeFunctionData("or", [ [ swap.address, swap.address ], [ ts, lt ] ]);
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                constants.ZERO_ADDRESS, predicate
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 1, 0, 1)).to.be.revertedWith("LOP: predicate returned false");
        });

        it('`and` should pass', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const ts = iface.encodeFunctionData("timestampBelow", [ 0xff000000 ]);
            const balanceCall = ifaceToken.encodeFunctionData("balanceOf", [ wallet ]);
            const gt = iface.encodeFunctionData("gt", [ "100", dai.address, balanceCall ]);
            const predicate = iface.encodeFunctionData("and", [ [ swap.address, swap.address ], [ ts, gt ] ]);
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                constants.ZERO_ADDRESS, predicate
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);
            
            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('nonce + ts example', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const ts = iface.encodeFunctionData("timestampBelow", [ 0xff000000 ]);
            const nonceCall = iface.encodeFunctionData("nonceEquals", [ wallet, 0 ]);
            const predicate = iface.encodeFunctionData("and", [ [ swap.address, swap.address ], [ ts, nonceCall ] ]);
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                constants.ZERO_ADDRESS, predicate
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 1, 0, 1);
            const receipt = await response.wait(1);
            
            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('advance nonce', async function () {
            await swap.increaseNonce();
            expect((await swap.nonce(_)).toNumber()).to.be.equal(1);
        });

        it('`and` should fail', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const ts = iface.encodeFunctionData("timestampBelow", [ 0xff0000 ]);
            const balanceCall = ifaceToken.encodeFunctionData("balanceOf", [ wallet ]);
            const lt = iface.encodeFunctionData("lt", [ "100", dai.address, balanceCall ]);
            const predicate = iface.encodeFunctionData("and", [ [ swap.address, swap.address ], [ ts, lt ] ]);
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString(),
                constants.ZERO_ADDRESS, predicate
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            await expect(swap.fillOrder(order, signature, 1, 0, 1)).to.be.revertedWith("LOP: predicate returned false");
        });
    });

    describe('Expiration', async function () {
        it('should fill partially if not enough coins (taker)', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 2, 0, 2);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });

        it('should fill partially if not enough coins (maker)', async function () {
            const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp - 8640000;
            const endTimestamp = startTimestamp + 31536000;
            const order = buildOrder(
                "1", dai.address, dai.address, "1", "1",
                true,
                startTimestamp.toString(),
                endTimestamp.toString(),
                toBN("18446744073709551616").toString()
            );
            const data = buildOrderData(chainId, swap.address, order, "Order");
            const signature = signTypedMessage(Uint8Array.from(Buffer.from(walletPrivateKey, "hex")) as any, { data });
            await dai.approve(swap.address, "1000000");
            await daiWallet.approve(swap.address, "1000000");
            const response = await swap.fillOrder(order, signature, 0, 2, 2);
            const receipt = await response.wait(1);

            let orderHash: string;
            receipt.events.forEach(event => {
                if(event.event == "OrderFilled") {
                    orderHash = event.args.orderHash;
                }
            });
            expect((await swap.orderParticipantFixedTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, wallet)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantFixedTokens(orderHash, _)).toNumber()).to.be.equal(1);
            expect((await swap.orderParticipantVariableTokens(orderHash, _)).toNumber()).to.be.equal(1);
        });
    });
});
