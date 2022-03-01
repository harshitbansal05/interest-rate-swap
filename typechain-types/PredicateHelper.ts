/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface PredicateHelperInterface extends utils.Interface {
  contractName: "PredicateHelper";
  functions: {
    "and(address[],bytes[])": FunctionFragment;
    "eq(uint256,address,bytes)": FunctionFragment;
    "gt(uint256,address,bytes)": FunctionFragment;
    "lt(uint256,address,bytes)": FunctionFragment;
    "or(address[],bytes[])": FunctionFragment;
    "timestampBelow(uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "and",
    values: [string[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "eq",
    values: [BigNumberish, string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "gt",
    values: [BigNumberish, string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "lt",
    values: [BigNumberish, string, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "or",
    values: [string[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "timestampBelow",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "and", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "eq", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "gt", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "lt", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "or", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "timestampBelow",
    data: BytesLike
  ): Result;

  events: {};
}

export interface PredicateHelper extends BaseContract {
  contractName: "PredicateHelper";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: PredicateHelperInterface;

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
    and(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    eq(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    gt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    lt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    or(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    timestampBelow(
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  and(
    targets: string[],
    data: BytesLike[],
    overrides?: CallOverrides
  ): Promise<boolean>;

  eq(
    value: BigNumberish,
    target: string,
    data: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  gt(
    value: BigNumberish,
    target: string,
    data: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  lt(
    value: BigNumberish,
    target: string,
    data: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  or(
    targets: string[],
    data: BytesLike[],
    overrides?: CallOverrides
  ): Promise<boolean>;

  timestampBelow(
    time: BigNumberish,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    and(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<boolean>;

    eq(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    gt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    lt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    or(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<boolean>;

    timestampBelow(
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    and(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    eq(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    gt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    lt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    or(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    timestampBelow(
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    and(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    eq(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    gt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    lt(
      value: BigNumberish,
      target: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    or(
      targets: string[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    timestampBelow(
      time: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}