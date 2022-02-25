import hre from "hardhat";
import { getChainId } from "hardhat";

async function deploy({ getNamedAccounts, deployments }) {
    console.log("Running deploy script");
    console.log("Network id ", await getChainId());
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const limitOrderProtocol = await deploy("LimitOrderProtocol", {
        from: deployer,
        args: ["0x39521925DaF14B0d64452B8A1d14A850f1C75B34"],
    });

    console.log("LimitOrderProtocol deployed to:", limitOrderProtocol.address);

    if ((await getChainId()) !== "31337") {
        await hre.run("verify:verify", {
            address: limitOrderProtocol.address,
        });
    }
}
export default deploy;
export const skip = async () => true;
