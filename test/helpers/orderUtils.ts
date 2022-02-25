import { EIP712Domain } from "./eip712";

const Order = [
    { name: "salt", type: "uint256" },
    { name: "asset", type: "address" },
    { name: "underlyingAsset", type: "address" },
    { name: "maker", type: "address" },
    { name: "receiver", type: "address" },
    { name: "allowedSender", type: "address" },
    { name: "fixedTokens", type: "uint256" },
    { name: "variableTokens", type: "uint256" },
    { name: "isFixedTaker", type: "bool" },
    { name: "beginTimestamp", type: "uint256" },
    { name: "endTimestamp", type: "uint256" },
    { name: "t", type: "int128" },
    { name: "makerAssetData", type: "bytes" },
    { name: "takerAssetData", type: "bytes" },
    { name: "getMakerAmount", type: "bytes" },
    { name: "getTakerAmount", type: "bytes" },
    { name: "predicate", type: "bytes" },
    { name: "permit", type: "bytes" },
    { name: "interaction", type: "bytes" },
];

export const name = "IRS Limit Order Protocol";
export const version = "1";

export function buildOrderData(
    chainId: any,
    verifyingContract: string,
    order: any,
    primaryType: "Order" | "EIP712Domain"
) {
    return {
        primaryType: primaryType,
        types: { EIP712Domain, Order },
        domain: { name, version, chainId, verifyingContract },
        message: order,
    };
}
