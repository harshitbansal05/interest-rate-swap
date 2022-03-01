import hre from "hardhat";
import { getChainId } from "hardhat";

async function deploy({ getNamedAccounts, deployments }) {
    console.log("Running deploy script");
    console.log("Network id ", await getChainId());
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const lib = await deploy("MarginLib", {
        from: deployer,
    });
    const oracle = await deploy("OracleMock", {
        from: deployer,
        args: ["251084069415467230335650862098906040028272338785178107248"],
    });
    const limitOrderProtocol = await deploy("LimitOrderProtocol", {
        from: deployer,
        args: [oracle.address],
        libraries: {
            MarginLib: lib.address,
        },
    });

    console.log("LimitOrderProtocol deployed to:", limitOrderProtocol.address);

    if ((await getChainId()) !== "31337") {
        await hre.run("verify:verify", {
            address: lib.address,
        });
        await hre.run("verify:verify", {
            address: limitOrderProtocol.address,
            constructorArguments: [oracle.address],
            libraries: {
                MarginLib: lib.address,
            },
        });
    }
}
export default deploy;
export const skip = async () => true;
