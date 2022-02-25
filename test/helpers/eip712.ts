import { ethers } from "hardhat";
import { Contract } from "ethers";

import { signTypedMessage, TypedDataUtils } from "eth-sig-util";
import { fromRpcSig } from "ethereumjs-util";

import { cutSelector, trim0x } from "./utils";

export const EIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
];

export const Permit = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
];

export function domainSeparator (name: string, version: string, chainId: any, verifyingContract: string) {
    return '0x' + TypedDataUtils.hashStruct(
        "EIP712Domain",
        { name, version, chainId, verifyingContract },
        { EIP712Domain },
    ).toString('hex');
}

const defaultDeadline = "18446744073709551615";

function buildData (
    owner: string, 
    name: string, 
    version: string, 
    chainId: any, 
    verifyingContract: string, 
    spender: string, 
    nonce: string,
    value: string, 
    deadline: string,
    primaryType: "Permit"| "EIP712Domain"
) {
    const data = {
        primaryType,
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
    };
    return data;
}

export async function getPermit (
    owner: string, 
    ownerPrivateKey: string, 
    token: Contract, 
    tokenVersion: string, 
    chainId: any, 
    spender: string, 
    value: string, 
    deadline = defaultDeadline
) {
    const nonce = await token.nonces(owner);
    const name = await token.name();
    const data = buildData(owner, name, tokenVersion, chainId, token.address, spender, nonce.toString(), value, deadline.toString(), "Permit");
    const signature = signTypedMessage(Buffer.from(ownerPrivateKey, 'hex'), { data });
    const { v, r, s } = fromRpcSig(signature);

    let abi = [
        "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)"
    ];
    const iface = new ethers.utils.Interface(abi);
    const permitCall = iface.encodeFunctionData("permit", [owner, spender, value, deadline, v, r, s]);
    return cutSelector(permitCall);
}

export function withTarget(target: any, data: string) {
    return target.toString() + trim0x(data);
}
