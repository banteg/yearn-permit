from ape import Contract
import pytest


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
