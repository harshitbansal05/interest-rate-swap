/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IWithdrawable, IWithdrawableInterface } from "../IWithdrawable";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "wad",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IWithdrawable__factory {
  static readonly abi = _abi;
  static createInterface(): IWithdrawableInterface {
    return new utils.Interface(_abi) as IWithdrawableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IWithdrawable {
    return new Contract(address, _abi, signerOrProvider) as IWithdrawable;
  }
}
