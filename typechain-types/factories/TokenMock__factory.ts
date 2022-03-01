/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { TokenMock, TokenMockInterface } from "../TokenMock";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getChainId",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
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
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x6101606040527f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9610140523480156200003757600080fd5b5060405162001aab38038062001aab833981810160405260408110156200005d57600080fd5b81019080805160405193929190846401000000008211156200007e57600080fd5b9083019060208201858111156200009457600080fd5b8251640100000000811182820188101715620000af57600080fd5b82525081516020918201929091019080838360005b83811015620000de578181015183820152602001620000c4565b50505050905090810190601f1680156200010c5780820380516001836020036101000a031916815260200191505b50604052602001805160405193929190846401000000008211156200013057600080fd5b9083019060208201858111156200014657600080fd5b82516401000000008111828201881017156200016157600080fd5b82525081516020918201929091019080838360005b838110156200019057818101518382015260200162000176565b50505050905090810190601f168015620001be5780820380516001836020036101000a031916815260200191505b506040525050508180604051806040016040528060018152602001603160f81b81525084848160039080519060200190620001fb9291906200030a565b508051620002119060049060208401906200030a565b5050825160209384012082519284019290922060e08390526101008190524660a0818152604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f818901819052818301979097526060810194909452608080850193909352308483018190528151808603909301835260c0948501909152815191909601209052929092526101205250620002b0905033620002b8565b5050620003ed565b600680546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b8280546200031890620003b0565b90600052602060002090601f0160209004810192826200033c576000855562000387565b82601f106200035757805160ff191683800117855562000387565b8280016001018555821562000387579182015b82811115620003875782518255916020019190600101906200036a565b506200039592915062000399565b5090565b5b808211156200039557600081556001016200039a565b600181811c90821680620003c557607f821691505b60208210811415620003e757634e487b7160e01b600052602260045260246000fd5b50919050565b60805160a05160c05160e05161010051610120516101405161166362000448600039600061085b01526000610ed901526000610f2801526000610f0301526000610e5c01526000610e8601526000610eb001526116636000f3fe608060405234801561001057600080fd5b506004361061016c5760003560e01c8063715018a6116100cd578063a457c2d711610081578063d505accf11610066578063d505accf1461040f578063dd62ed3e14610460578063f2fde38b146104a757600080fd5b8063a457c2d7146103b7578063a9059cbb146103e357600080fd5b80638da5cb5b116100b25780638da5cb5b1461035b57806395d89b41146103835780639dc29fac1461038b57600080fd5b8063715018a61461032d5780637ecebe001461033557600080fd5b80633408e47011610124578063395093511161010957806339509351146102a057806340c10f19146102cc57806370a08231146102fa57600080fd5b80633408e470146102925780633644e5151461029857600080fd5b806318160ddd1161015557806318160ddd1461022e57806323b872dd14610244578063313ce5671461027a57600080fd5b806306fdde0314610171578063095ea7b3146101ee575b600080fd5b6101796104cd565b6040805160208082528351818301528351919283929083019185019080838360005b838110156101b357818101518382015260200161019b565b50505050905090810190601f1680156101e05780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61021a6004803603604081101561020457600080fd5b506001600160a01b03813516906020013561055f565b604080519115158252519081900360200190f35b6002545b60408051918252519081900360200190f35b61021a6004803603606081101561025a57600080fd5b506001600160a01b03813581169160208101359091169060400135610577565b60126040805160ff9092168252519081900360200190f35b46610232565b61023261059b565b61021a600480360360408110156102b657600080fd5b506001600160a01b0381351690602001356105aa565b6102f8600480360360408110156102e257600080fd5b506001600160a01b0381351690602001356105e9565b005b6102326004803603602081101561031057600080fd5b50356001600160a01b031660009081526020819052604090205490565b6102f8610656565b6102326004803603602081101561034b57600080fd5b50356001600160a01b03166106bc565b6006546001600160a01b0316604080516001600160a01b039092168252519081900360200190f35b6101796106dc565b6102f8600480360360408110156103a157600080fd5b506001600160a01b0381351690602001356106eb565b61021a600480360360408110156103cd57600080fd5b506001600160a01b03813516906020013561074f565b61021a600480360360408110156103f957600080fd5b506001600160a01b0381351690602001356107f9565b6102f8600480360360e081101561042557600080fd5b506001600160a01b03813581169160208101359091169060408101359060608101359060ff6080820135169060a08101359060c00135610807565b6102326004803603604081101561047657600080fd5b506001600160a01b038135811660009081526001602090815260408083209482013590931682529290925290205490565b6102f8600480360360208110156104bd57600080fd5b50356001600160a01b031661096b565b6060600380546104dc9061159d565b80601f01602080910402602001604051908101604052809291908181526020018280546105089061159d565b80156105555780601f1061052a57610100808354040283529160200191610555565b820191906000526020600020905b81548152906001019060200180831161053857829003601f168201915b5050505050905090565b60003361056d818585610a4d565b5060019392505050565b600033610585858285610ba6565b610590858585610c38565b506001949350505050565b60006105a5610e4f565b905090565b3360008181526001602090815260408083206001600160a01b038716845290915281205490919061056d90829086906105e49087906115e8565b610a4d565b6006546001600160a01b031633146106485760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064015b60405180910390fd5b6106528282610f76565b5050565b6006546001600160a01b031633146106b05760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161063f565b6106ba6000611055565b565b6001600160a01b0381166000908152600560205260408120545b92915050565b6060600480546104dc9061159d565b6006546001600160a01b031633146107455760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161063f565b61065282826110bf565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909190838110156107ec5760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760448201527f207a65726f000000000000000000000000000000000000000000000000000000606482015260840161063f565b6105908286868403610a4d565b60003361056d818585610c38565b834211156108575760405162461bcd60e51b815260206004820152601d60248201527f45524332305065726d69743a206578706972656420646561646c696e65000000604482015260640161063f565b60007f00000000000000000000000000000000000000000000000000000000000000008888886108868c61123c565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e00160405160208183030381529060405280519060200120905060006108e182611264565b905060006108f1828787876112cd565b9050896001600160a01b0316816001600160a01b0316146109545760405162461bcd60e51b815260206004820152601e60248201527f45524332305065726d69743a20696e76616c6964207369676e61747572650000604482015260640161063f565b61095f8a8a8a610a4d565b50505050505050505050565b6006546001600160a01b031633146109c55760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161063f565b6001600160a01b038116610a415760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f6464726573730000000000000000000000000000000000000000000000000000606482015260840161063f565b610a4a81611055565b50565b6001600160a01b038316610ac85760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460448201527f7265737300000000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b038216610b445760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f20616464726560448201527f7373000000000000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3505050565b6001600160a01b038381166000908152600160209081526040808320938616835292905220546000198114610c325781811015610c255760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000604482015260640161063f565b610c328484848403610a4d565b50505050565b6001600160a01b038316610cb45760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f20616460448201527f6472657373000000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b038216610d305760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201527f6573730000000000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b03831660009081526020819052604090205481811015610dbf5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e742065786365656473206260448201527f616c616e63650000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610df69084906115e8565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610e4291815260200190565b60405180910390a3610c32565b6000306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015610ea857507f000000000000000000000000000000000000000000000000000000000000000046145b15610ed257507f000000000000000000000000000000000000000000000000000000000000000090565b50604080517f00000000000000000000000000000000000000000000000000000000000000006020808301919091527f0000000000000000000000000000000000000000000000000000000000000000828401527f000000000000000000000000000000000000000000000000000000000000000060608301524660808301523060a0808401919091528351808403909101815260c0909201909252805191012090565b6001600160a01b038216610fcc5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640161063f565b8060026000828254610fde91906115e8565b90915550506001600160a01b0382166000908152602081905260408120805483929061100b9084906115e8565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b600680546001600160a01b038381167fffffffffffffffffffffffff0000000000000000000000000000000000000000831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b03821661113b5760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f2061646472657360448201527f7300000000000000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b038216600090815260208190526040902054818110156111ca5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e60448201527f6365000000000000000000000000000000000000000000000000000000000000606482015260840161063f565b6001600160a01b03831660009081526020819052604081208383039055600280548492906111f9908490611600565b90915550506040518281526000906001600160a01b038516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610b99565b6001600160a01b03811660009081526005602052604090208054600181018255905b50919050565b60006106d6611271610e4f565b836040517f19010000000000000000000000000000000000000000000000000000000000006020820152602281018390526042810182905260009060620160405160208183030381529060405280519060200120905092915050565b60008060006112de878787876112f5565b915091506112eb816113e2565b5095945050505050565b6000807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a083111561132c57506000905060036113d9565b8460ff16601b1415801561134457508460ff16601c14155b1561135557506000905060046113d9565b6040805160008082526020820180845289905260ff881692820192909252606081018690526080810185905260019060a0016020604051602081039080840390855afa1580156113a9573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b0381166113d2576000600192509250506113d9565b9150600090505b94509492505050565b60008160048111156113f6576113f6611617565b14156113ff5750565b600181600481111561141357611413611617565b14156114615760405162461bcd60e51b815260206004820152601860248201527f45434453413a20696e76616c6964207369676e61747572650000000000000000604482015260640161063f565b600281600481111561147557611475611617565b14156114c35760405162461bcd60e51b815260206004820152601f60248201527f45434453413a20696e76616c6964207369676e6174757265206c656e67746800604482015260640161063f565b60038160048111156114d7576114d7611617565b14156115305760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202773272076616c604482015261756560f01b606482015260840161063f565b600481600481111561154457611544611617565b1415610a4a5760405162461bcd60e51b815260206004820152602260248201527f45434453413a20696e76616c6964207369676e6174757265202776272076616c604482015261756560f01b606482015260840161063f565b600181811c908216806115b157607f821691505b6020821081141561125e57634e487b7160e01b600052602260045260246000fd5b634e487b7160e01b600052601160045260246000fd5b600082198211156115fb576115fb6115d2565b500190565b600082821015611612576116126115d2565b500390565b634e487b7160e01b600052602160045260246000fdfea26469706673582212201384cbf54b69aa02b1e0af203d4bba9bedc804ac254c7f70d2b214ec9ab5532b64736f6c634300080b0033";

type TokenMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: TokenMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class TokenMock__factory extends ContractFactory {
  constructor(...args: TokenMockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "TokenMock";
  }

  deploy(
    name: string,
    symbol: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<TokenMock> {
    return super.deploy(name, symbol, overrides || {}) as Promise<TokenMock>;
  }
  getDeployTransaction(
    name: string,
    symbol: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(name, symbol, overrides || {});
  }
  attach(address: string): TokenMock {
    return super.attach(address) as TokenMock;
  }
  connect(signer: Signer): TokenMock__factory {
    return super.connect(signer) as TokenMock__factory;
  }
  static readonly contractName: "TokenMock";
  public readonly contractName: "TokenMock";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TokenMockInterface {
    return new utils.Interface(_abi) as TokenMockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TokenMock {
    return new Contract(address, _abi, signerOrProvider) as TokenMock;
  }
}
