/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { NonceManager, NonceManagerInterface } from "../NonceManager";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newNonce",
        type: "uint256",
      },
    ],
    name: "NonceIncreased",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "amount",
        type: "uint8",
      },
    ],
    name: "advanceNonce",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "increaseNonce",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonce",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "makerAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "makerNonce",
        type: "uint256",
      },
    ],
    name: "nonceEquals",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610215806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806370ae92d21461005157806372c244a8146100a3578063c53a0292146100c5578063cf6fc6e3146100cd575b600080fd5b6100916004803603602081101561006757600080fd5b5060006020819052903573ffffffffffffffffffffffffffffffffffffffff168152604090205481565b60408051918252519081900360200190f35b6100c3600480360360208110156100b957600080fd5b503560ff16610127565b005b6100c3610194565b610113600480360360408110156100e357600080fd5b50803573ffffffffffffffffffffffffffffffffffffffff16600090815260208181526040909120549101351490565b604080519115158252519081900360200190f35b336000908152602081905260408120546101459060ff8416906101a0565b33600081815260208181526040918290208490558151848152915193945091927ffc69110dd11eb791755e4abd6b7d281bae236de95736d38a23782814be5e10db929181900390910190a25050565b61019e6001610127565b565b600082198211156101da577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b50019056fea26469706673582212205cc73a6712425bc946d9ec2c20698a727837082281739e4cd58b28b3bd0b67a664736f6c634300080b0033";

type NonceManagerConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: NonceManagerConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class NonceManager__factory extends ContractFactory {
  constructor(...args: NonceManagerConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "NonceManager";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<NonceManager> {
    return super.deploy(overrides || {}) as Promise<NonceManager>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): NonceManager {
    return super.attach(address) as NonceManager;
  }
  connect(signer: Signer): NonceManager__factory {
    return super.connect(signer) as NonceManager__factory;
  }
  static readonly contractName: "NonceManager";
  public readonly contractName: "NonceManager";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): NonceManagerInterface {
    return new utils.Interface(_abi) as NonceManagerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): NonceManager {
    return new Contract(address, _abi, signerOrProvider) as NonceManager;
  }
}
