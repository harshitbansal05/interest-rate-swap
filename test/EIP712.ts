import { expect } from "chai";
import { ethers } from "hardhat";

import { domainSeparator } from "./helpers/eip712";
import { name, version } from "./helpers/orderUtils";
import { TokenMock } from "../typechain-types/TokenMock";
import { LimitOrderProtocol } from "../typechain-types/LimitOrderProtocol";
import { OracleMock } from "../typechain-types/OracleMock";

describe("LimitOrderProtocol", function () {
    let dai: TokenMock;
    let oracle: OracleMock;
    let swap: LimitOrderProtocol;
    let chainId: any;

    beforeEach(async function () {
        const TokenMockFactory = await ethers.getContractFactory("TokenMock");
        const LimitOrderProtocolFactory = await ethers.getContractFactory(
            "LimitOrderProtocol"
        );
        const OracleMockFactory = await ethers.getContractFactory(
            "AggregatorMock"
        );

        dai = (await TokenMockFactory.deploy("DAI", "DAI")) as TokenMock;
        dai = await dai.deployed();

        oracle = (await OracleMockFactory.deploy(
            "737869762948382064"
        )) as OracleMock;
        oracle = await oracle.deployed();

        swap = (await LimitOrderProtocolFactory.deploy(
            oracle.address
        )) as LimitOrderProtocol;
        swap = await swap.deployed();

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        chainId = (await dai.getChainId()).toNumber();
    });

    it("domain separator", async function () {
        expect(await swap.DOMAIN_SEPARATOR()).to.equal(
            domainSeparator(name, version, chainId, swap.address)
        );
    });
});
