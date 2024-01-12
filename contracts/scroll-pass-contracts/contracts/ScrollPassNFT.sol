// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IAccountV3.sol";
import "./interfaces/IERC6551Registry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ScrollerPass is Ownable, ERC721Enumerable {
    using Strings for uint256;
    address private transferWallet;
    enum Preference {
        OFF,
        LOW,
        MED,
        HIGH
    }

    struct TBA {
        address tbaAddress;
        Preference preference;
        bool active;
        uint256 lastBridge;
    }

    mapping(uint256 => TBA) public tokenToTBA;
    address public implementation;
    address[] public tbaAddresses;
    string public baseUri;
    uint256 private _nextTokenId;
    uint256 private bridgeGasLimit;
    uint256 private tbaGasUsed;

    event Minted(
        uint256 tokenId,
        address to,
        address tbaAddress,
        uint256 valueSent
    );

    event EtherTransferred(address to, uint256 amount);

    constructor(
        address initialOwner,
        address _transferWallet
    ) ERC721("ScrollerPass", "SCROLLNFT") Ownable(initialOwner) {
        setTransferWallet(_transferWallet);
    }

    function setImplementation(address _implementation) public onlyOwner {
        implementation = _implementation;
    }

    function setTransferWallet(address _transferWallet) public onlyOwner {
        transferWallet = _transferWallet;
    }

    function setGasLimit(uint256 _gasLimit) public onlyOwner {
        bridgeGasLimit = _gasLimit;
    }

    function setTBAGasUsed(uint256 _tbaGasUsed) public onlyOwner {
        tbaGasUsed = _tbaGasUsed;
    }

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function updateTBA(uint256 tokenId, Preference newPreference) public {
        TBA storage tba = tokenToTBA[tokenId];
        require(
            _msgSender() == ownerOf(tokenId),
            "ERC721: caller is not the owner"
        );
        tba.preference = newPreference;
    }

    function setAdminWallet(address _adminWallet) public onlyOwner {
        tbaAddresses.push(_adminWallet);
    }

    function removeAdminWallet(address _adminWallet) public onlyOwner {
        for (uint256 i = 0; i < tbaAddresses.length; i++) {
            if (tbaAddresses[i] == _adminWallet) {
                delete tbaAddresses[i];
            }
        }
    }

    function getTBABalance(uint256 tokenId) public view returns (uint256) {
        TBA storage tba = tokenToTBA[tokenId];
        uint256 balance = tba.tbaAddress.balance;
        return balance;
    }

    function getTBA(uint256 tokenId) public view returns (TBA memory, uint256) {
        TBA storage tba = tokenToTBA[tokenId];
        uint256 balance = getTBABalance(tokenId);
        return (tba, balance);
    }

    function setImplementationAddress(
        address _implementation
    ) public onlyOwner {
        implementation = _implementation;
    }

    function mint(
        address to,
        uint256 chainId,
        Preference preference
    ) public payable {
        uint256 tokenId = _nextTokenId++;
        IERC6551Registry registry = IERC6551Registry(
            0x000000006551c19487814612e58FE06813775758
        );
        address payable tbaAddress = payable(
            registry.createAccount(
                implementation,
                "0x",
                chainId,
                address(this),
                tokenId
            )
        );
        TBA memory tba = TBA(tbaAddress, preference, true, 0);
        tokenToTBA[tokenId] = tba;
        _mint(to, tokenId);

        emit Minted(tokenId, to, tbaAddress, msg.value);

        if (msg.value > 0) {
            (bool sent, ) = tbaAddress.call{value: msg.value}("");
            require(sent, "Failed to send Ether");
            emit EtherTransferred(tbaAddress, msg.value);
        }
    }

    function _isValidAdmin(address _adminWallet) internal view returns (bool) {
        for (uint256 i = 0; i < tbaAddresses.length; i++) {
            if (tbaAddresses[i] == _adminWallet) {
                return true;
            }
        }
        return false;
    }

    function initiateSingleBridge(uint256 tokenId) internal {
        TBA storage tba = tokenToTBA[tokenId];
        IAccountV3 accountV3 = IAccountV3(tba.tbaAddress);
        uint256 balance = getTBABalance(tokenId);
        if (balance > 0.01 ether) {
            accountV3.bridgeEthBalance(bridgeGasLimit, tbaGasUsed);
            tba.lastBridge = block.timestamp;
        }
    }

    function initiateBulkBridge(uint256[] memory tokenIds) public {
        require(_isValidAdmin(_msgSender()), "Caller is not a valid admin");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            initiateSingleBridge(tokenIds[i]);
        }
    }

    function setBaseUri(string memory _baseUri) public onlyOwner {
        baseUri = _baseUri;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        return string(abi.encodePacked(baseUri, Strings.toString(_tokenId)));
    }

    function withdrawAll() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);
        _withdraw(transferWallet, balance);
    }

    function _withdraw(address _address, uint256 _amount) private {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Transfer failed.");
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
