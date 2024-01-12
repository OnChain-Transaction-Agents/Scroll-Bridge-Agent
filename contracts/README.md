# **ScrollPassNFT and ScrollPassAccount Integration Documentation**

### Overview

This documentation outlines the key integration flow between **`ScrollPassNft.sol`** and **`ScrollPassAccount.sol`**, primarily focused on the **`bridgeEthBalanceV2()`** function in **`ScrollPassAccount.sol`**. **`ScrollPassNft.sol`** is a contract for managing NFTs with specific functionalities like minting, updating, and bridging Ether balances through associated TBA (Token Bound Account) accounts.

### Key Components

1. **ScrollPassNft.sol**: ERC-721 contract which manages NFTs and their associated TBAs data.
2. **ScrollPassAccount.sol**: Handles the bridging of Ether balances from a TBA instance to its owners address, along with gas reimbursements to the Scroll Pass backend EOA wallet. ScrollPassAccount inherits Tokenbound’s official `AccountV3.sol` which contains all standard functionality for an ERC-6551 tokenbound account, such as permissions and locking (for secure sales).

### Integration Flow

1. **Minting and TBA Creation**: In **`ScrollPassNft`**, NFTs are minted with an associated TBA. When minting, an account is created for each NFT, and Ether can be sent to this TBA.
2. **Initiating Bridging**: The **`initiateSingleBridge`** function in **`ScrollPassNft`** is designed to initiate the bridging process for the Ether balance from a TBA by interacting with its **`ScrollPassAccount`** instance. Each instance is essentially the TBA’s ERC-4337 smart contract account.
3. **Bridging Ether Balance**: In **`ScrollPassAccount`**, the **`bridgeEthBalanceV2`** function is called to bridge the Ether balance from the TBA to its owner’s equivalent address on the Scroll blockchain. This function also handles gas reimbursements made to the EOA Admin. 
    1. The amount reimbursed is `**tx.gasprice**` multiplied by `**tbaGasUsed**`. This value is determined empirically via testing and set by Scroll Pass Admin. 
    2. `**bridgeGasLimit`** is `**_gasLimit()`** value required by the official Scroll bridging contracts. Currently we have been setting this to 168_000 to ~align with a typical suggested value when using the Scroll Bridge, but **ideally we could retrieve this value from the source used by the Scroll Bridge interface**.
4. **Subsidy Management**: The **`ScrollPassNft`** also manages potential subsidies for the bridging process. These configurations affect how gas costs are calculated and reimbursed in the **`ScrollPassAccount`** contract and contribute to the gamification of the Scroll Pass UX.