// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC721B {
    function balanceOf(address owner) external view returns (uint256);

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
}

// Proxy contract used for calling balanceOf and TokenOfOwnerByIndex on chain
contract GasTest {
    IERC721B erc721b;

    constructor(address _erc721b) {
        erc721b = IERC721B(_erc721b);
    }

    /*     
    //removed view identifier to test gas
    function testBalanceOf(address ownerOf) public returns (uint256) {
        return erc721b.balanceOf(ownerOf);
    }

    //removed view identifier to test gas
    function testTokenOfOwnerByIndex(address owner, uint256 index) public returns (uint256) {
        return erc721b.tokenOfOwnerByIndex(owner, index);
    } 
    */
}
