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

export interface ERC1155ProxyInterface extends utils.Interface {
  contractName: "ERC1155Proxy";
  functions: {
    "func_301JL5R(address,address,uint256,address,uint256,bytes)": FunctionFragment;
    "immutableOwner()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "func_301JL5R",
    values: [string, string, BigNumberish, string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "immutableOwner",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "func_301JL5R",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "immutableOwner",
    data: BytesLike
  ): Result;

  events: {};
}

export interface ERC1155Proxy extends BaseContract {
  contractName: "ERC1155Proxy";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ERC1155ProxyInterface;

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
    func_301JL5R(
      from: string,
      to: string,
      amount: BigNumberish,
      token: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    immutableOwner(overrides?: CallOverrides): Promise<[string]>;
  };

  func_301JL5R(
    from: string,
    to: string,
    amount: BigNumberish,
    token: string,
    tokenId: BigNumberish,
    data: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  immutableOwner(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    func_301JL5R(
      from: string,
      to: string,
      amount: BigNumberish,
      token: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    immutableOwner(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    func_301JL5R(
      from: string,
      to: string,
      amount: BigNumberish,
      token: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    immutableOwner(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    func_301JL5R(
      from: string,
      to: string,
      amount: BigNumberish,
      token: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    immutableOwner(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
