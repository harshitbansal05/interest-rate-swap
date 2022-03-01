import { expect } from "chai";
import { ethers } from "hardhat";

import { domainSeparator } from "./helpers/eip712";
import { name, version } from "./helpers/orderUtils";
import { TokenMock } from "../typechain-types/TokenMock";
import { LimitOrderProtocol } from "../typechain-types/LimitOrderProtocol";
import { OracleMock } from "../typechain-types/OracleMock";
import { MarginLib } from "../typechain-types/MarginLib";

describe("LimitOrderProtocol", function () {
    let dai: TokenMock;
    let oracle: OracleMock;
    let lib: MarginLib;
    let swap: LimitOrderProtocol;
    let chainId: any;

    beforeEach(async function () {
        const TokenMockFactory = await ethers.getContractFactory("TokenMock");
        const OracleMockFactory = await ethers.getContractFactory("OracleMock");
        const LibFactory = await ethers.getContractFactory("MarginLib");

        dai = (await TokenMockFactory.deploy("DAI", "DAI")) as TokenMock;
        dai = await dai.deployed();

        oracle = (await OracleMockFactory.deploy(
            "251084069415467230335650862098906040028272338785178107248"
        )) as OracleMock;
        oracle = await oracle.deployed();

        lib = (await LibFactory.deploy()) as MarginLib;
        lib = await lib.deployed();

        const LimitOrderProtocolFactory = await ethers.getContractFactory(
            "LimitOrderProtocol",
            {
                libraries: {
                    MarginLib: lib.address,
                },
            }
        );

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
