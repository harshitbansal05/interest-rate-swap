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

export declare namespace MarginLib {
  export type OrderInfoStruct = {
    orderHash: BytesLike;
    beginTimestamp: BigNumberish;
    endTimestamp: BigNumberish;
    isOrderDefaulted: boolean;
    term: BigNumberish;
    fixedTokens: BigNumberish;
    variableTokens: BigNumberish;
    forFixedTaker: boolean;
  };

  export type OrderInfoStructOutput = [
    string,
    BigNumber,
    BigNumber,
    boolean,
    BigNumber,
    BigNumber,
    BigNumber,
    boolean
  ] & {
    orderHash: string;
    beginTimestamp: BigNumber;
    endTimestamp: BigNumber;
    isOrderDefaulted: boolean;
    term: BigNumber;
    fixedTokens: BigNumber;
    variableTokens: BigNumber;
    forFixedTaker: boolean;
  };

  export type AssetInfoStruct = {
    asset: string;
    underlyingAsset: string;
    alpha: BigNumberish;
    beta: BigNumberish;
    sigma: BigNumberish;
    lowerBoundMul: BigNumberish;
    upperBoundMul: BigNumberish;
  };

  export type AssetInfoStructOutput = [
    string,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber
  ] & {
    asset: string;
    underlyingAsset: string;
    alpha: BigNumber;
    beta: BigNumber;
    sigma: BigNumber;
    lowerBoundMul: BigNumber;
    upperBoundMul: BigNumber;
  };
}

export interface MarginLibInterface extends utils.Interface {
  contractName: "MarginLib";
  functions: {
    "getAverageAccruedAPYBetweenTimestamps(OracleMock,address,address,uint256,uint256)": FunctionFragment;
    "getMarginReqWithMuls(OracleMock,(bytes32,uint256,uint256,bool,int128,uint256,uint256,bool),(address,address,int128,int128,int128,int128,int128),int128,int128)": FunctionFragment;
    "getReturnAfterMaturity(uint256,uint256,uint256,bool,int128)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getAverageAccruedAPYBetweenTimestamps",
    values: [string, string, string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getMarginReqWithMuls",
    values: [
      string,
      MarginLib.OrderInfoStruct,
      MarginLib.AssetInfoStruct,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getReturnAfterMaturity",
    values: [BigNumberish, BigNumberish, BigNumberish, boolean, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "getAverageAccruedAPYBetweenTimestamps",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getMarginReqWithMuls",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getReturnAfterMaturity",
    data: BytesLike
  ): Result;

  events: {};
}

export interface MarginLib extends BaseContract {
  contractName: "MarginLib";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MarginLibInterface;

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
    getAverageAccruedAPYBetweenTimestamps(
      oracle: string,
      asset: string,
      underlyingAsset: string,
      startTimestamp: BigNumberish,
      endTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { apy: BigNumber; ewma: BigNumber }>;

    getMarginReqWithMuls(
      oracle: string,
      orderInfo: MarginLib.OrderInfoStruct,
      assetInfo: MarginLib.AssetInfoStruct,
      tl: BigNumberish,
      tu: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getReturnAfterMaturity(
      onePercentFixedTokens: BigNumberish,
      onePercentVariableTokens: BigNumberish,
      margin: BigNumberish,
      forFixedTaker: boolean,
      term: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { orderReturn: BigNumber }>;
  };

  getAverageAccruedAPYBetweenTimestamps(
    oracle: string,
    asset: string,
    underlyingAsset: string,
    startTimestamp: BigNumberish,
    endTimestamp: BigNumberish,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber] & { apy: BigNumber; ewma: BigNumber }>;

  getMarginReqWithMuls(
    oracle: string,
    orderInfo: MarginLib.OrderInfoStruct,
    assetInfo: MarginLib.AssetInfoStruct,
    tl: BigNumberish,
    tu: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getReturnAfterMaturity(
    onePercentFixedTokens: BigNumberish,
    onePercentVariableTokens: BigNumberish,
    margin: BigNumberish,
    forFixedTaker: boolean,
    term: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    getAverageAccruedAPYBetweenTimestamps(
      oracle: string,
      asset: string,
      underlyingAsset: string,
      startTimestamp: BigNumberish,
      endTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber] & { apy: BigNumber; ewma: BigNumber }>;

    getMarginReqWithMuls(
      oracle: string,
      orderInfo: MarginLib.OrderInfoStruct,
      assetInfo: MarginLib.AssetInfoStruct,
      tl: BigNumberish,
      tu: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getReturnAfterMaturity(
      onePercentFixedTokens: BigNumberish,
      onePercentVariableTokens: BigNumberish,
      margin: BigNumberish,
      forFixedTaker: boolean,
      term: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    getAverageAccruedAPYBetweenTimestamps(
      oracle: string,
      asset: string,
      underlyingAsset: string,
      startTimestamp: BigNumberish,
      endTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getMarginReqWithMuls(
      oracle: string,
      orderInfo: MarginLib.OrderInfoStruct,
      assetInfo: MarginLib.AssetInfoStruct,
      tl: BigNumberish,
      tu: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getReturnAfterMaturity(
      onePercentFixedTokens: BigNumberish,
      onePercentVariableTokens: BigNumberish,
      margin: BigNumberish,
      forFixedTaker: boolean,
      term: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    getAverageAccruedAPYBetweenTimestamps(
      oracle: string,
      asset: string,
      underlyingAsset: string,
      startTimestamp: BigNumberish,
      endTimestamp: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getMarginReqWithMuls(
      oracle: string,
      orderInfo: MarginLib.OrderInfoStruct,
      assetInfo: MarginLib.AssetInfoStruct,
      tl: BigNumberish,
      tu: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getReturnAfterMaturity(
      onePercentFixedTokens: BigNumberish,
      onePercentVariableTokens: BigNumberish,
      margin: BigNumberish,
      forFixedTaker: boolean,
      term: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}