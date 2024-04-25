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

interface Permit2:
    def permitTransferFrom(
        permit: PermitTransferFrom,
        transferDetails: SignatureTransferDetails,
        owner: address,
        signature: Bytes[65]
    ): nonpayable

interface Registry:
    def latestVault(token: address) -> address: nonpayable

permit2: immutable(Permit2)
registry: immutable(Registry)

@external
def __init__():
    permit2 = Permit2(0x000000000022D473030F116dDEE9F6B43aC78BA3)
    registry = Registry(0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319)  # v2.registry.ychad.eth


@external
def deposit(token: address, amount: uint256, deadline: uint256, signature: Bytes[65]) -> uint256:
    """
    @notice Deposit token into the latest official vault.
    @dev Reuses deadline as nonce
    """
    vault: address = registry.latestVault(token)
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
