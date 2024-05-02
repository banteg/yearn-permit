from eip712 import EIP712Message


def make_vault_permit(vault, owner, spender, amount, nonce, expiry):
    class Permit(EIP712Message):
        _name_ = "Permit"
        _chainId_ = 1
        _verifyingContract_ = vault

        owner: "address"
        spender: "address"
        amount: "uint256"
        nonce: "uint256"
        expiry: "uint256"

    return Permit(
        owner=owner, spender=spender, amount=amount, nonce=nonce, expiry=expiry
    )


def test_migrate(vault_with_balance, dev):
    assert vault_with_balance.balanceOf(dev) > 0
