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

export interface InteractiveNotificationReceiverInterface
  extends utils.Interface {
  contractName: "InteractiveNotificationReceiver";
  functions: {
    "notifyFillOrder(address,address,address,bool,uint256,uint256,bytes)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "notifyFillOrder",
    values: [
      string,
      string,
      string,
      boolean,
      BigNumberish,
      BigNumberish,
      BytesLike
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "notifyFillOrder",
    data: BytesLike
  ): Result;

  events: {};
}

export interface InteractiveNotificationReceiver extends BaseContract {
  contractName: "InteractiveNotificationReceiver";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: InteractiveNotificationReceiverInterface;

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
    notifyFillOrder(
      taker: string,
      asset: string,
      underlyingAsset: string,
      isFixedTaker: boolean,
      fixedTokens: BigNumberish,
      variableTokens: BigNumberish,
      interactiveData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  notifyFillOrder(
    taker: string,
    asset: string,
    underlyingAsset: string,
    isFixedTaker: boolean,
    fixedTokens: BigNumberish,
    variableTokens: BigNumberish,
    interactiveData: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    notifyFillOrder(
      taker: string,
      asset: string,
      underlyingAsset: string,
      isFixedTaker: boolean,
      fixedTokens: BigNumberish,
      variableTokens: BigNumberish,
      interactiveData: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    notifyFillOrder(
      taker: string,
      asset: string,
      underlyingAsset: string,
      isFixedTaker: boolean,
      fixedTokens: BigNumberish,
      variableTokens: BigNumberish,
      interactiveData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    notifyFillOrder(
      taker: string,
      asset: string,
      underlyingAsset: string,
      isFixedTaker: boolean,
      fixedTokens: BigNumberish,
      variableTokens: BigNumberish,
      interactiveData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
