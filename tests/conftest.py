import pytest
from ape import Contract
from eip712 import EIP712Message, EIP712Type


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
