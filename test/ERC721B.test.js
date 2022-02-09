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
    receiver = await ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE);

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
      await expect(erc721b.balanceOf(ZERO_ADDRESS)).to.be.revertedWith('BalanceQueryForZeroAddress');
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
      await expect(erc721b.ownerOf(5)).to.be.revertedWith('OwnerQueryForNonexistentToken()');
    });

    it('verifies correct tokenuri', async function () {
      // set base uri
      await erc721b.setBaseURI('https://example.com/');

      expect(await erc721b.tokenURI(1)).to.equal('https://example.com/1');
      expect(await erc721b.tokenURI(2)).to.equal('https://example.com/2');
    });
  });

  describe('Minting', function () {
    describe('safeMint', function () {
      it('mints a single token', async function () {
        // safeMint function is overloaded, so have to use full function signature here
        const mintTx = await erc721b['safeMint(address,uint256)'](receiver.address, 1);

        // check events
        await expect(mintTx).to.emit(erc721b, 'Transfer').withArgs(ZERO_ADDRESS, receiver.address, 0);
        await expect(mintTx).to.emit(receiver, 'Received').withArgs(owner.address, ZERO_ADDRESS, 0, '0x', 20000);

        // check ownerOf and balance function
        expect(await erc721b.balanceOf(receiver.address)).to.equal('1');
        expect(await erc721b.ownerOf(0)).to.equal(receiver.address);
      });

      it('mints multiple tokens', async function () {
        // safeMint function is overloaded, so have to use full function signature here
        const mintTx = await erc721b['safeMint(address,uint256)'](receiver.address, 5);

        // iterate over all 5 tokens
        for (let tokenId = 0; tokenId < 5; tokenId++) {
          await expect(mintTx).to.emit(erc721b, 'Transfer').withArgs(ZERO_ADDRESS, receiver.address, tokenId);

          // check ownerOf
          expect(await erc721b.ownerOf(tokenId)).to.equal(receiver.address);
        }

        await expect(mintTx).to.emit(receiver, 'Received').withArgs(owner.address, ZERO_ADDRESS, 4, '0x', 20000);

        // check balance function
        expect(await erc721b.balanceOf(receiver.address)).to.equal('5');
      });

      it('safe mint with data', async function () {
        const mintTx = await erc721b['safeMint(address,uint256,bytes)'](receiver.address, 1, 4919);

        // 4919 converted to hex is 0x1337
        await expect(mintTx).to.emit(receiver, 'Received').withArgs(owner.address, ZERO_ADDRESS, 0, '0x1337', 20000);
      });

      it('rejects mints to the zero address', async function () {
        await expect(erc721b['safeMint(address,uint256)'](ZERO_ADDRESS, 1)).to.be.revertedWith('MintToZeroAddress');
      });

      it('requires quantity to be greater than 0', async function () {
        await expect(erc721b['safeMint(address,uint256)'](owner.address, 0)).to.be.revertedWith('MintZeroQuantity');
      });

      it('reverts for non-receivers', async function () {
        const nonReceiver = erc721b;
        await expect(erc721b['safeMint(address,uint256)'](nonReceiver.address, 1)).to.be.revertedWith(
          'TransferToNonERC721ReceiverImplementer'
        );
      });
    });

    describe('mint', function () {
      it('mints a single token', async function () {
        // safeMint function is overloaded, so have to use full function signature here
        const mintTx = await erc721b.mint(receiver.address, 1);

        // check events
        await expect(mintTx).to.emit(erc721b, 'Transfer').withArgs(ZERO_ADDRESS, receiver.address, 0);
        await expect(mintTx).to.not.emit(receiver, 'Received');

        // check ownerOf and balance function
        expect(await erc721b.balanceOf(receiver.address)).to.equal('1');
        expect(await erc721b.ownerOf(0)).to.equal(receiver.address);
      });

      it('mints multiple tokens', async function () {
        // safeMint function is overloaded, so have to use full function signature here
        const mintTx = await erc721b.mint(receiver.address, 5);

        // iterate over all 5 tokens
        for (let tokenId = 0; tokenId < 5; tokenId++) {
          // check events
          await expect(mintTx).to.emit(erc721b, 'Transfer').withArgs(ZERO_ADDRESS, receiver.address, tokenId);
          await expect(mintTx).to.not.emit(receiver, 'Received');

          // check ownerOf
          expect(await erc721b.ownerOf(tokenId)).to.equal(receiver.address);
        }

        // check balance function
        expect(await erc721b.balanceOf(receiver.address)).to.equal('5');
      });

      it('rejects mints to the zero address', async function () {
        await expect(erc721b.mint(ZERO_ADDRESS, 1)).to.be.revertedWith('MintToZeroAddress');
      });

      it('requires quantity to be greater than 0', async function () {
        await expect(erc721b.mint(owner.address, 0)).to.be.revertedWith('MintZeroQuantity');
      });

      it('does not revert for non-receivers', async function () {
        const nonReceiver = erc721b;
        await erc721b.mint(nonReceiver.address, 1);
        expect(await erc721b.ownerOf(0)).to.equal(nonReceiver.address);
      });
    });
  });

  describe('Transfers', function () {
    const testSuccessfulTransfer = function (transferFn) {
      const tokenId = 2;
      let from;
      let to;

      beforeEach(async function () {
        const sender = addr2;
        from = sender.address;
        to = receiver.address;
        await erc721b.mint(addr2.address, 5);

        await erc721b.connect(sender).setApprovalForAll(to, true);
        transferTx = await erc721b.connect(sender)[transferFn](from, to, tokenId);
      });

      it('transfers the ownership of the given token ID to the given address', async function () {
        expect(await erc721b.ownerOf(tokenId)).to.be.equal(to);
      });

      it('emits a Transfer event', async function () {
        await expect(transferTx).to.emit(erc721b, 'Transfer').withArgs(from, to, tokenId);
      });

      it('clears the approval for the token ID', async function () {
        expect(await erc721b.getApproved(tokenId)).to.be.equal(ZERO_ADDRESS);
      });

      it('adjusts owners balances', async function () {
        // minted 5, transferred 1 = balance should be 4
        expect(await erc721b.balanceOf(from)).to.be.equal(4);

        expect(await erc721b.balanceOf(to)).to.be.equal(1);
      });

      it('adjusts owners tokens by index', async function () {
        expect(await erc721b.tokenOfOwnerByIndex(to, 0)).to.be.equal(tokenId);
        expect(await erc721b.tokenOfOwnerByIndex(from, 0)).to.be.not.equal(tokenId);
      });
    };

    const testUnsuccessfulTransfer = function (transferFn) {
      const tokenId = 1;

      beforeEach(async function () {
        await erc721b.mint(addr2.address, 5);
      });

      it('rejects unapproved transfer', async function () {
        await expect(erc721b.connect(addr1)[transferFn](addr2.address, addr1.address, tokenId)).to.be.revertedWith(
          'TransferCallerNotOwnerNorApproved'
        );
      });

      it('rejects transfer from incorrect owner', async function () {
        await erc721b.connect(addr2).setApprovalForAll(addr1.address, true);
        await expect(erc721b.connect(addr1)[transferFn](addr3.address, addr1.address, tokenId)).to.be.revertedWith(
          'TransferFromIncorrectOwner'
        );
      });

      it('rejects transfer to zero address', async function () {
        await erc721b.connect(addr2).setApprovalForAll(addr1.address, true);
        await expect(erc721b.connect(addr1)[transferFn](addr2.address, ZERO_ADDRESS, tokenId)).to.be.revertedWith(
          'TransferToZeroAddress'
        );
      });
    };

    describe('successful transfers', function () {
      describe('transferFrom', function () {
        testSuccessfulTransfer('transferFrom');
      });

      describe('safeTransferFrom', function () {
        testSuccessfulTransfer('safeTransferFrom(address,address,uint256)');

        it('validates ERC721Received', async function () {
          await expect(transferTx).to.emit(receiver, 'Received').withArgs(addr2.address, addr2.address, 2, '0x', 20000);
        });
      });
    });

    describe('unsuccessful transfers', function () {
      describe('transferFrom', function () {
        testUnsuccessfulTransfer('transferFrom');
      });

      describe('safeTransferFrom', function () {
        testUnsuccessfulTransfer('safeTransferFrom(address,address,uint256)');
      });
    });
  });

  describe('approve', async function () {
    beforeEach(async function () {
      await erc721b.mint(addr1.address, 1);
      await erc721b.mint(addr2.address, 1);
    });

    const tokenId = 0;
    const tokenId2 = 1;

    it('sets approval for the target address', async function () {
      await erc721b.connect(addr1).approve(addr2.address, tokenId);
      const approval = await erc721b.getApproved(tokenId);
      expect(approval).to.equal(addr2.address);
    });

    it('rejects an invalid token owner', async function () {
      await expect(erc721b.connect(addr1).approve(addr2.address, tokenId2)).to.be.revertedWith(
        'ApprovalToCurrentOwner'
      );
    });

    it('rejects an unapproved caller', async function () {
      await expect(erc721b.approve(addr2.address, tokenId)).to.be.revertedWith('ApprovalCallerNotOwnerNorApproved');
    });

    it('does not get approved for invalid tokens', async function () {
      await expect(erc721b.getApproved(10)).to.be.revertedWith('ApprovalQueryForNonexistentToken');
    });
  });

  describe('setApprovalForAll', async function () {
    it('sets approval for all properly', async function () {
      const approvalTx = await erc721b.setApprovalForAll(addr1.address, true);
      await expect(approvalTx).to.emit(erc721b, 'ApprovalForAll').withArgs(owner.address, addr1.address, true);
      expect(await erc721b.isApprovedForAll(owner.address, addr1.address)).to.be.true;
    });

    it('sets rejects approvals for non msg senders', async function () {
      await expect(erc721b.connect(addr1).setApprovalForAll(addr1.address, true)).to.be.revertedWith('ApproveToCaller');
    });
  });

  describe('Gas analysis', async function () {
    beforeEach(async function () {
      //mint one token, since first mint is always more expensive
      await erc721b.mint(receiver.address, 1);
    });

    it('mint', async function () {
      for (let i = 1; i < 6; i++) {
        const mintTx = await erc721b.mint(receiver.address, i);
        const mintReceipt = await mintTx.wait();
        const gasUsed = mintReceipt.gasUsed;

        console.log(`Gas used for minting ${i} token(s): ${gasUsed.toString()}`);
      }
    });

    it('safeMint', async function () {
      for (let i = 1; i < 20; i++) {
        const mintTx = await erc721b['safeMint(address,uint256)'](receiver.address, i);
        const mintReceipt = await mintTx.wait();
        const gasUsed = mintReceipt.gasUsed;

        console.log(`Gas used for safe minting ${i} token(s): ${gasUsed.toString()}`);
      }
    });
  });
});
