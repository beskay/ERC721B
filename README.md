# ERC721B

A fully compliant implementation of IERC721 with significant gas savings for minting multiple NFTs in a single transaction. Includes the Metadata and Enumerable extension.

The ERC721B standard builds on top of ERC721A from Azuki, reducing the minting fees by around ~17k gas on average and the transfer fees by around ~7k gas.

The table below shows a comparison of gas costs between a standard ERC721Enumerable contract, an ERC721A contract and this ERC721B contract. The two columns on the right show the gas savings compared to an ERC721Enumerable contract and compared to an ERC721A contract.

![Table of gas savings](https://i.imgur.com/A9LKIFA.png)

## How it works

### Removed OpenZeppelins Enumerable extension

Out of the box, Open Zeppelin ERC721Enumerable comes with an inordinate amount of transfer processing that simply is not needed for the majority of projects. The method of tracking is moved into view functions, this saves an huge amount of gas when minting or transferring your tokens. For more info on that, I highly recommend reading [this medium article from nftchance](https://medium.com/coinmonks/the-cannibalization-of-nfts-by-openzeppelin-by-insanely-high-gas-prices-cd2c9a7c1e7).

### Included optimizations from ERC721A

I included the optimizations from Azukis ERC721A contract, namely updating the owners balance only once per batch mint request, instead of per minted NFT. Thanks to this, minting is cheap -- no matter how many NFTs you mint at once. For more info, see [Azukis blog post](https://www.azuki.com/erc721a)

### Using an array as owner storage

This is actually the "secret ingredient", the reason why this implementation is even more gas efficient than ERC721A. Instead of using mappings to store the owner data, we use an array. So

```
struct AddressData {
    uint128 balance;
    uint128 numberMinted;
}
// Mapping owner address to address data
mapping(address => AddressData) private _addressData;

uint256 internal currentIndex = 0;
```

Becomes

```solidity
// Array which maps token ID to address (index is tokenID)
address[] internal _owners;
```

The balance variable is substituded with a **_balanceOf()_** function call, numberMinted is removed, **_currentIndex_** can be replaced with **_\_owners.length_**. This saves us a few storage writes and therefore some gas.

Following storage writes in the mint function of ERC721A

```solidity
_addressData[to].balance += uint128(quantity);
_addressData[to].numberMinted += uint128(quantity);

_ownerships[startTokenId].addr = to;
_ownerships[startTokenId].startTimestamp = uint64(block.timestamp);

...

currentIndex = updatedIndex;
```

are substituded with

```solidity
_owners.push(to);
```

In the image below you can see an example layout of the **_\_owners_** array:

![owners array](https://i.imgur.com/x1NUoO1.png)

In this example wallet **_0x1234...6789_** minted 3 tokens and wallet **_0x4567...8745_** minted 4 tokens (**_0x9876...1234_** minted an unknown number of tokens since the previous owner isnt shown).

As you can see, an owner is only set for the last minted tokenId, the previous ones keep their default value. Over time (after every token got transferred at least once) all indices will be set to a specific owner.

### \_checkOnERC721Received

Unlike in the standard ERC721 implementation this is only called once per batch mint. Calling this several times per batch mint is a waste of gas, if the contract confirms the receival of one token, it will accept all additional tokens too. This saves us around 5k gas per additional mint, so it adds up quite a bit.

Please note that this is an experimental feature, it could be that there are some contracts out there which use the onERC721Received function for additional logic, like sending the received NFTs to another wallet or something else, I am not aware of any though.

## Installation

```sh
npm install --save-dev erc721b
```

## How to use

Once installed simply import the contract and inherit from it.

```solidity
pragma solidity ^0.8.4;

import 'erc721b/contracts/ERC721B.sol';

contract Example is ERC721B {
  constructor() ERC721B('Example', 'EXMP') {}

  function mint(uint256 quantity) external payable {
    // _safeMint's second argument now takes in a quantity, not a tokenId.
    _safeMint(msg.sender, quantity);
  }
}
```

You can also take a look at [ERC721BMock.sol](https://github.com/beskay/ERC721B/blob/main/contracts/mocks/ERC721BMock.sol)

### How can i save even more gas?

If you dont want to support minting to smart contracts, you can use the **_mint_** function instead of **_safeMint_**. This saves you another ~8k gas, since **_\_checkOnERC721Received_** wont be called.

## Recommendations

### Keep max batch size limit low

Even if minting multiple tokens at once is cheap, dont set the max batch limit too high. The higher the max batch limit, the higher are the gas costs of subsequent transfers -- on average. This is due to the **_ownerOf()_** function, which iterates over the **_\_owners array_** until it finds a nonzero element, so gas spent here starts off proportional to the maximum mint batch size. It gradually moves to O(1) as tokens get transferred around in the collection over time.

### Dont call balanceOf() and tokenOfOwnerByIndex() on chain

The gas savings by using an **_\_owners_** array instead of a mapping comes at a cost: The **_balanceOf()_** and **_tokenOfOwnerByIndex()_** are highly inefficient. They iterate over the complete array, this means if a collection has 10000 NFTs in total, they will iterate over 10k items.

Because of this, calling these functions from another smart contract can become extremely expensive, e.g. calling the **_balanceOf()_** function from a 10k NFT project costs around 22 million (!) gas, 2/3 of the block gas limit.

Fortunately, calling those two functions from another smart contract is almost never needed and if it is, you can probably substitute the call off chain: Usually you call balanceOf() to check if someone holds NFTs from a specific project in order to whitelist them (or something similiar). Instead of calling **_balanceOf()_** from your smart contract, you can check the tokenIds a wallet holds by calling **_tokenOfOwnerByIndex()_** off chain, and then prove it on chain by calling **_ownerOf(tokenId)_**.

## Safety

This is **experimental software** and is provided on an "as is" and "as available" basis. This contract is not audited yet.

It was **not designed with user safety** in mind. You should thoroughly read the contract before using it for your own project.

I **do not give any warranties** and **will not be liable for any loss** incurred through any use of this codebase.

## Acknowledgements

These contracts were inspired by or directly modified from many sources, primarily:

- [ERC721A](https://github.com/chiru-labs/ERC721A)
- [solmate](https://github.com/Rari-Capital/solmate)
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts)

A big influence was also [this medium article from nftchance](https://medium.com/coinmonks/the-cannibalization-of-nfts-by-openzeppelin-by-insanely-high-gas-prices-cd2c9a7c1e7)

## Contact

- Twitter - [@beskay0x](https://twitter.com/beskay0x)
- Discord - [TheUnmasked](https://discord.gg/theunmasked)