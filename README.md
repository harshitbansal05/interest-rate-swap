# interest-rate-swap

This is a basic implementation of an Interest Rate Swap for Etherem built on 1inch's limit order protocol. The implementation details of the IRS are drawn from Voltz [whitepaper](https://www.voltz.xyz/litepaper). The core protocol for the IRS is implemented in `contracts/OrderMixin.sol`. The project is still under development and the following functionalities remain un-implemented:

1. A database to store limit orders, and necessary APIs to post and select orders to/from the database.
2. On chain oracle to get APY and EWMA (exponential weighted moving average) of interest bearing coins like aDAI, cMKR, etc.

## Deploy the contract

To deploy the contract, clone the project and cd into the project directory. The following steps should then be followed:
```
npm install
npx hardhat deploy --network <network>
```
If deployment network is one other than hardhat, the network configurations need to be declared in a `.env` file. A sample `.env.example` has also been added for easy reference. The contract has also been deployed to the rinkeby test network on address 0xE08cEE27Cfa6F9c2F92Fd9cc6b7206282787f282. 

## Running unit tests

The unit tests are always run on the default hardhat network. They can be started by `npx hardhat test`.
