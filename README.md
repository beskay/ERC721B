# ERC721B

A fully compliant implementation of IERC721 with significant gas savings for minting multiple NFTs in a single transaction. Includes the metadata and Enumerable extension.

The ERC721B standard builds on top of ERC721A from Azuki, reducing the minting fees by around ~17k gas on average and the transfer fees by around ~8k gas.

The table below shows a comparison of gas costs between a standard ERC721Enumerable contract, an ERC721A contract and this ERC721B contract. The two columns on the right show the gas savings compared to an ERC721Enumerable contract and compared to an ERC721A contract.

IMAGE

## How it works

## How to use

## Recommendations

- Dont call balanceOf from another contract, same with tokenofownerbyindex
- the higher max batch size the more expensive ownerof function

## Safety

This is **experimental software** and is provided on an "as is" and "as available" basis. This contract is not audited yet.

It was **not designed with user safety** in mind. You should thoroughly read the contract before using it for your own project.

I **do not give any warranties** and **will not be liable for any loss** incurred through any use of this codebase.

## Acknowledgements

These contracts were inspired by or directly modified from many sources, primarily:

- [ERC721A](https://github.com/chiru-labs/ERC721A)
- [solmate](https://github.com/Rari-Capital/solmate)
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts)

A big influence was also this medium article from [@nftchance](https://twitter.com/nftchance):
https://medium.com/coinmonks/the-cannibalization-of-nfts-by-openzeppelin-by-insanely-high-gas-prices-cd2c9a7c1e7

## Contact

- beskay0x - [@beskay0x](https://twitter.com/beskay0x)
- Discord - [TheUnmasked](https://discord.gg/theunmasked)
