import pytest
from ape import Contract, convert
from eip712 import EIP712Message, EIP712Type
from uniswap.universal_router import Command, Planner
from dpack.ape import load


class TokenPermissions(EIP712Type):
    token: "address"
    amount: "uint256"


class PermitTransferFrom(EIP712Message):
    _name_ = "Permit2"
    _chainId_ = 1
    _verifyingContract_ = "0x000000000022D473030F116dDEE9F6B43aC78BA3"

    permitted: TokenPermissions
    spender: "address"
    nonce: "uint256"
    deadline: "uint256"


@pytest.fixture
def dev(accounts):
    return accounts[0]


@pytest.fixture
def ypermit(dev, project):
    return project.YearnPermit.deploy(sender=dev)


@pytest.fixture
def weth():
    return Contract("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")


@pytest.fixture
def permit2():
    return Contract("0x000000000022D473030F116dDEE9F6B43aC78BA3")


@pytest.fixture
def make_permit():
    def make(token, amount, spender, deadline):
        return PermitTransferFrom(
            TokenPermissions(token, amount), spender, deadline, deadline
        )

    return make


@pytest.fixture
def vault():
    # usdc 0.3.0
    return Contract("0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9")


@pytest.fixture
def uniswap():
    return load("uniswap-v3.dpack.json")


@pytest.fixture
def vault_with_balance(dev, vault, uniswap, accounts):
    weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    usdc = Contract("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
    planner = Planner()
    amount = convert("1 ether", int)
    planner.wrap_eth(str(uniswap.universal_router), amount)
    planner.v3_swap_exact_in(str(dev), amount, 0, [str(weth), 500, str(usdc)], False)

    uniswap.universal_router.execute(*planner.build(), value=amount, sender=dev)
    amount = usdc.balanceOf(dev)
    usdc.approve(vault, amount, sender=dev)
    vault.setDepositLimit(2**256 - 1, sender=accounts[vault.governance()])
    vault.deposit(amount, sender=dev)
    return vault
