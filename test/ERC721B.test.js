const { expect } = require('chai');
const { ethers } = require('hardhat');

const ZERO_ADDRESS = ethers.constants.AddressZero;
const RECEIVER_MAGIC_VALUE = '0x150b7a02';

const Error = ['None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic'].reduce(
  (acc, entry, idx) => Object.assign({ [entry]: idx }, acc),
  {}
);

describe('ERC721B', function () {
  before(async function () {
    // Get the ContractFactory and Signers here.
    ERC721B = await ethers.getContractFactory('ERC721BMock');
    ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock');

    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy the contracts
    erc721b = await ERC721B.deploy('ERC721B', 'erc721b');
    receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE, Error.None);

    await erc721b.deployed();
    await receiver.deployed();
  });

  describe('General ERC721 functions', function () {
    beforeEach(async function () {
      // mint some tokens
      await erc721b.connect(addr1).mint(addr1.address, 1);
      await erc721b.connect(addr2).mint(addr2.address, 2);
    });

    it('verify correct totalsupply', async function () {
      expect(await erc721b.totalSupply()).to.equal('3');
    });

    it('verifies correct balanceOf', async function () {
      expect(await erc721b.balanceOf(addr1.address)).to.equal('1');
      expect(await erc721b.balanceOf(addr2.address)).to.equal('2');
      expect(await erc721b.balanceOf(addr3.address)).to.equal('0');

      // reverts zero address
      await expect(erc721b.balanceOf(ZERO_ADDRESS)).to.be.revertedWith('ERC721: balance query for the zero address');
    });

    it('verifies that minted tokens exist', async function () {
      let supply = await erc721b.totalSupply();
      for (let tokenId = 0; tokenId < supply; tokenId++) {
        const exists = await erc721b.exists(tokenId);
        expect(exists).to.be.true;
      }

      //revert non existent token
      expect(await erc721b.exists(1000)).to.be.false;
    });

    it('verify correct owner', async function () {
      expect(await erc721b.ownerOf(0)).to.equal(addr1.address);
      expect(await erc721b.ownerOf(1)).to.equal(addr2.address);

      //reverts since token not minted yet
      await expect(erc721b.ownerOf(5)).to.be.revertedWith('ERC721: operator query for nonexistent token');
    });

    it('verifies correct tokenuri', async function () {
      // set base uri
      await erc721b.setBaseURI('https://example.com/');

      expect(await erc721b.tokenURI(1)).to.equal('https://example.com/1');
      expect(await erc721b.tokenURI(2)).to.equal('https://example.com/2');
    });
  });
});
