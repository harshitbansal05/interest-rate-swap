import { ethers } from "hardhat";
import { ArgumentsDecoderTest } from "../typechain-types/ArgumentsDecoderTest";

describe('SolidityTests', async function () {
    describe('ArgumentsDecoderTest', async function () {
        let argumentsDecoderTest: ArgumentsDecoderTest;

        before(async function () {
            const ArgumentsDecoderTestFactory = await ethers.getContractFactory("ArgumentsDecoderTest");
            argumentsDecoderTest = (await ArgumentsDecoderTestFactory.deploy()) as ArgumentsDecoderTest;
            argumentsDecoderTest = await argumentsDecoderTest.deployed();
        });

        it('testDecodeBool', async function () {
            await argumentsDecoderTest.testDecodeBool();
        });

        it('testDecodeUint', async function () {
            await argumentsDecoderTest.testDecodeUint();
        });
    });
});
