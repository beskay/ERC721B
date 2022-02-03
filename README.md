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

```
    // Array which maps token ID to address (index is tokenID)
    address[] internal _owners;
```

The balance variable is substituded with a **_balanceOf()_** function call, numberMinted is removed, **_currentIndex_** can be replaced with **_\_owners.length_**. This saves us a few storage writes -- the reason why minting is 17k gas cheaper.

Following storage writes in the mint function of ERC721A

```
        _addressData[to].balance += uint128(quantity);
        _addressData[to].numberMinted += uint128(quantity);

        _ownerships[startTokenId].addr = to;
        _ownerships[startTokenId].startTimestamp = uint64(block.timestamp);

        ...

        currentIndex = updatedIndex;
```

are substituded with

```
        _owners.push(to);
```

### \_checkOnERC721Received

Unlike in the standard ERC721 implementation this is only called once per batch mint. Calling this several times per batch mint is a waste of gas, if the contract confirms the receival of one token, it will accept all additional tokens too. This saves us around 5k gas per additional mint, so it adds up quite a bit.

## How to use

Just replace OpenZeppelins ERC721 contract with this one, thats it. Take a look at ERC721BMock.sol to see how to implement your mint functions.

You can also clone this repo and run npm install if you want to use the hardhat development environment.

### How can i save even more gas?

If you dont want to support minting to smart contracts, you can use the **_mint_** function instead of **_safeMint_**. This saves you another ~8k gas, since **_\_checkOnERC721Received_** wont be called.

## Recommendations

### Keep max batch size limit low

Even if minting multiple tokens at once is cheap, dont set the max batch limit too high. The higher the max batch limit, the higher are the gas costs of subsequent transfers -- on average. This is due to the **_ownerOf()_** function, which iterates ower the **_\_owners array_** until it finds a nonzero element, so gas spent here starts off proportional to the maximum mint batch size. It gradually moves to O(1) as tokens get transferred around in the collection over time.

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

- beskay0x - [@beskay0x](https://twitter.com/beskay0x)
- Discord - [TheUnmasked](https://discord.gg/theunmasked)
