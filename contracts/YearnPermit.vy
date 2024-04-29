# @version 0.3.10
# @title YearnPermit
# @author banteg
# @notice Deposit with Permit2
from vyper.interfaces import ERC20
from vyper.interfaces import ERC4626

struct TokenPermissions:
    token: address
    amount: uint256

struct PermitTransferFrom:
    permitted: TokenPermissions
    nonce: uint256
    deadline: uint256

struct SignatureTransferDetails:
    to: address
    requestedAmount: uint256

struct TokenInfo:
    token: address
    vault: address
    decimals: uint8
    token_balance: uint256
    vault_balance: uint256
    permit2_allowance: uint256
    symbol: String[100]
    vault_api: String[100]
    latest: bool

interface Permit2:
    def permitTransferFrom(
        permit: PermitTransferFrom,
        transferDetails: SignatureTransferDetails,
        owner: address,
        signature: Bytes[65]
    ): nonpayable

interface Registry:
    def latestVault(token: address) -> address: view
    def numTokens() -> uint256: view
    def tokens(index: uint256) -> ERC20: view
    def numVaults(token: ERC20) -> uint256: view
    def vaults(token: ERC20, index: uint256) -> ERC20: view

interface ERC20Detailed:
    def symbol() -> String[100]: view
    def decimals() -> uint8: view

interface Vault:
    def apiVersion() -> String[100]: view

permit2: immutable(Permit2)
registry_a: immutable(Registry)
registry_b: immutable(Registry)

@external
def __init__():
    permit2 = Permit2(0x000000000022D473030F116dDEE9F6B43aC78BA3)
    # v2.registry.ychad.eth
    registry_a = Registry(0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804)
    registry_b = Registry(0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319)


@external
def deposit(token: address, amount: uint256, deadline: uint256, signature: Bytes[65]) -> uint256:
    """
    @notice Deposit token into the latest official vault.
    @dev Reuses deadline as nonce
    """
    vault: address = registry_b.latestVault(token)
    assert vault != empty(address)  # dev: no vault for this token

    # pull tokens using permit2
    permit2.permitTransferFrom(
        PermitTransferFrom({
            permitted: TokenPermissions({token: token, amount: amount}),
            nonce: deadline,
            deadline: deadline
        }),
        SignatureTransferDetails({to: self, requestedAmount: amount}),
        msg.sender,
        signature,
    )

    assert ERC20(token).approve(vault, amount, default_return_value=True)
    return ERC4626(vault).deposit(amount, msg.sender)


@view
@external
def fetch_user_info(user: address) -> DynArray[TokenInfo, 500]:
    """
    @notice Find all vaults a user has a balance in.
    """
    vaults: DynArray[TokenInfo, 500] = empty(DynArray[TokenInfo, 500])
    for registry in [registry_a, registry_b]:
        num_tokens: uint256 = registry.numTokens()
        for token_id in range(500):
            if token_id == num_tokens:
                break
            token: ERC20 = registry.tokens(token_id)
            token_balance: uint256 = token.balanceOf(user)
            permit2_allowance: uint256 = token.allowance(user, permit2.address)
            num_vaults: uint256 = registry.numVaults(token)
            for vault_id in range(20):
                if vault_id == num_vaults:
                    break
                vault: ERC20 = registry.vaults(token, vault_id)
                vault_balance: uint256 = vault.balanceOf(user)
                if token_balance > 1 or vault_balance > 1:
                    vaults.append(TokenInfo({
                        token: token.address,
                        vault: vault.address,
                        decimals: ERC20Detailed(token.address).decimals(),
                        token_balance: token_balance,
                        vault_balance: vault_balance,
                        permit2_allowance: permit2_allowance,
                        symbol: ERC20Detailed(token.address).symbol(),
                        vault_api: Vault(vault.address).apiVersion(),
                        latest: vault_id == num_vaults - 1,
                    }))
    
    return vaults
