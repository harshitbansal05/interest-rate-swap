/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface ERC721ProxySafeInterface extends utils.Interface {
  contractName: "ERC721ProxySafe";
  functions: {
    "func_60iHVgK(address,address,uint256,uint256,address)": FunctionFragment;
    "immutableOwner()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "func_60iHVgK",
    values: [string, string, BigNumberish, BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "immutableOwner",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "func_60iHVgK",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "immutableOwner",
    data: BytesLike
  ): Result;

  events: {};
}

export interface ERC721ProxySafe extends BaseContract {
  contractName: "ERC721ProxySafe";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ERC721ProxySafeInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    func_60iHVgK(
      from: string,
      to: string,
      arg2: BigNumberish,
      tokenId: BigNumberish,
      token: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    immutableOwner(overrides?: CallOverrides): Promise<[string]>;
  };

  func_60iHVgK(
    from: string,
    to: string,
    arg2: BigNumberish,
    tokenId: BigNumberish,
    token: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  immutableOwner(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    func_60iHVgK(
      from: string,
      to: string,
      arg2: BigNumberish,
      tokenId: BigNumberish,
      token: string,
      overrides?: CallOverrides
    ): Promise<void>;

    immutableOwner(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    func_60iHVgK(
      from: string,
      to: string,
      arg2: BigNumberish,
      tokenId: BigNumberish,
      token: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    immutableOwner(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    func_60iHVgK(
      from: string,
      to: string,
      arg2: BigNumberish,
      tokenId: BigNumberish,
      token: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    immutableOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}