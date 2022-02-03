// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '../ERC721B.sol';

contract ERC721BMock is ERC721B, Ownable {
    using Strings for uint256;

    string private baseURI;

    constructor(string memory name_, string memory symbol_) ERC721B(name_, symbol_) {}

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), 'Token does not exist.');
        return string(abi.encodePacked(baseURI, Strings.toString(_tokenId)));
    }

    /**
     * Set base URI of NFT
     */
    function setBaseURI(string calldata _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function safeMint(address to, uint256 quantity) public {
        _safeMint(to, quantity);
    }

    function safeMint(
        address to,
        uint256 quantity,
        bytes memory _data
    ) public {
        _safeMint(to, quantity, _data);
    }

    function mint(address to, uint256 quantity) public {
        _mint(to, quantity);
    }
}
