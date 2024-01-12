// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./interfaces/IAccountV3.sol";
import "./interfaces/IERC6551Registry.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ScrollPassNft is Ownable, ERC721Enumerable {
    using Strings for uint;

    uint public constant MINT_FEE = 0.00069 ether;
    uint minAllowedSubsidyBalance;
    uint minAllowedTbaBalance;

    // TODO subsidy to be confirmed with Scroll
    uint totalSubsidySpent;
    uint subsidyBalance; // updatable
    bool subsidyIsActive; // updatable

    string private baseUri;
    address public implementation;
    address[] public admins;

    uint public tbaGasUsed; // for reimbursment to ADMIN
    uint public bridgeGasLimit; // for core contracts
    uint private nextTokenId;
    address private feeWallet;

    mapping(uint => address) public tbaAddressOf;
    mapping(uint => uint) public rarityOf;
    mapping(uint => bool) public hasBridged;

    event Minted(uint tokenId, address to, address tbaAddress, uint valueSent);
    event EtherTransferred(address to, uint amount);
    event GasLog(uint gasPaid, uint gasSaved);

    constructor(
        address _initialOwner,
        address _feeWallet
    ) ERC721("ScrollPassNft", "SCROLLNFT") Ownable(_initialOwner) {
        feeWallet = _feeWallet;
        bridgeGasLimit = 168_000;
        tbaGasUsed = 350_000;
        minAllowedSubsidyBalance = 0.01 ether;
        minAllowedTbaBalance = 0.01 ether;
        subsidyBalance = 1.5 ether;
        subsidyIsActive = true;
    }

    //----------------- MINTING ------------------//

    /**
     * @dev Mints a new token and creates a TBA account for it
     * @param to address to mint to
     * @param chainId chainId of the TBA account
     */
    function mint(address to, uint chainId) public payable {
        require(msg.value >= MINT_FEE, "Insufficient Ether sent for minting");

        uint tokenId = nextTokenId++;
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
        uint rarity = _generateRarity();

        tbaAddressOf[tokenId] = tbaAddress;
        rarityOf[tokenId] = rarity;

        _mint(to, tokenId);
        emit Minted(tokenId, to, tbaAddress, msg.value);

        uint mintFee = MINT_FEE;
        uint depositAmount = msg.value - mintFee;

        (bool sent1, ) = feeWallet.call{value: mintFee}("");
        require(sent1, "Failed to send mint fee");
        emit EtherTransferred(feeWallet, mintFee);

        if (depositAmount > 0) {
            (bool sent2, ) = tbaAddress.call{value: depositAmount}("");
            require(sent2, "Failed to deposit Ether");
            emit EtherTransferred(tbaAddress, depositAmount);
        }
    }

    /**
     * @dev Generates random number between 1 and 100 and assigns a grade
     * @return random subsidy grade: 0, 50, 100
     *
     * TODO: confirm rarity odds
     */
    function _generateRarity() private view returns (uint) {
        uint randomNum = (block.prevrandao % 100) + 1;
        return
            randomNum > 100
                ? 100 // legendary, subsidy: 100%
                : randomNum > 95
                ? 50 // epic, subsidy: 50%
                : 0; // common, subsidy: 0%
    }

    //----------------- BRIDGING ------------------//

    function initiateSingleBridge(uint tokenId) internal {
        address tbaAddress = tbaAddressOf[tokenId];
        uint rarity = rarityOf[tokenId];

        IAccountV3 accountV3 = IAccountV3(tbaAddress);
        uint tbaBalance = getTBABalance(tokenId);
        require(tbaBalance >= minAllowedTbaBalance, "TBA balance too low");

        // gas to be reimbursed to ADMIN
        uint adminGasFee = tbaGasUsed * tx.gasprice;

        // implement subsidy (if valid)
        if (subsidyIsActive && totalSubsidySpent < subsidyBalance) {
            uint gasSubsidy = (tbaGasUsed * tx.gasprice * rarity) / 100; // subsidised
            uint subsidisedGasFee = adminGasFee - gasSubsidy; // amount to pay

            // call Account and bridge ETH
            accountV3.bridgeEthBalance(bridgeGasLimit, subsidisedGasFee);
            emit GasLog(subsidisedGasFee, gasSubsidy);
            hasBridged[tokenId] = true;

            // update subsidy balance
            totalSubsidySpent += gasSubsidy;
            if (totalSubsidySpent >= subsidyBalance) {
                setSubsidyIsActive(false);
            }
        } else {
            // call Account and bridge ETH
            accountV3.bridgeEthBalance(bridgeGasLimit, adminGasFee);
            emit GasLog(adminGasFee, 0);
            hasBridged[tokenId] = true;
        }
    }

    function initiateBulkBridge(uint[] memory tokenIds) public {
        require(_isValidAdmin(_msgSender()), "Caller is not a valid admin");
        for (uint i = 0; i < tokenIds.length; i++) {
            initiateSingleBridge(tokenIds[i]);
        }
    }

    //----------------- SETTERS ------------------//

    function setSubsidyBalance(uint _subsidyBalance) public onlyOwner {
        subsidyBalance = _subsidyBalance;
    }

    function setSubsidyIsActive(bool _subsidyIsActive) public onlyOwner {
        subsidyIsActive = _subsidyIsActive;
    }

    function setImplementation(address _implementation) public onlyOwner {
        implementation = _implementation;
    }

    function setGasLimit(uint _gasLimit) public onlyOwner {
        bridgeGasLimit = _gasLimit;
    }

    function setTBAGasUsed(uint _tbaGasUsed) public onlyOwner {
        tbaGasUsed = _tbaGasUsed;
    }

    function setAdminWallet(address _adminWallet) public onlyOwner {
        admins.push(_adminWallet);
    }

    function removeAdminWallet(address _adminWallet) public onlyOwner {
        for (uint i = 0; i < admins.length; i++) {
            if (admins[i] == _adminWallet) {
                delete admins[i];
            }
        }
    }

    function setBaseUri(string memory _baseUri) public onlyOwner {
        baseUri = _baseUri;
    }

    function setMinAllowedSubsidyBalanceWei(
        uint _minAllowedSubsidyBalance
    ) public onlyOwner {
        minAllowedSubsidyBalance = _minAllowedSubsidyBalance;
    }

    function setMinAllowedTbaBalanceEtherWei(
        uint _minAllowedTBABalance
    ) public onlyOwner {
        minAllowedTbaBalance = _minAllowedTBABalance;
    }

    //----------------- GETTERS ------------------//

    function getTBABalance(uint tokenId) public view returns (uint) {
        uint balance = tbaAddressOf[tokenId].balance;
        return balance;
    }

    function tokenURI(
        uint _tokenId
    ) public view override returns (string memory) {
        return string(abi.encodePacked(baseUri, Strings.toString(_tokenId)));
    }

    function _isValidAdmin(address _adminWallet) internal view returns (bool) {
        for (uint i = 0; i < admins.length; i++) {
            if (admins[i] == _adminWallet) {
                return true;
            }
        }
        return false;
    }

    //----------------- ADMIN FUNCTIONS ------------------//

    function withdrawAll() public onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0);
        _withdraw(feeWallet, balance);
    }

    function _withdraw(address _address, uint _amount) private {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Transfer failed.");
    }

    //----------------- OVERRIDES ------------------//
    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint tokenId,
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

    //----------------- TESTING HELPER FUNCTIONS --------//

    function setRarity(uint tokenId, uint _rarity) external onlyOwner {
        require(
            _rarity == 0 || _rarity == 33 || _rarity == 66 || _rarity == 100,
            "Invalid rarity"
        );
        rarityOf[tokenId] = _rarity;
    }
}
