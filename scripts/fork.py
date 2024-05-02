from enum import IntEnum
from operator import itemgetter

from ape import Contract, accounts, chain, project, convert
from ape_ethereum.multicall import Call
from dpack.ape import load
from eth_abi import encode
from eth_abi.packed import encode_packed
from rich import print
from toolz import groupby
from uniswap.universal_router import Command, Planner

uniswap = load("uniswap-v3.dpack.json")

tokens = [
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
]


def find_best_pools_for_tokens(tokens):
    fee_levels = [100, 500, 3000, 10000]
    weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    call = Call()
    order = [(token, fee) for token in tokens for fee in fee_levels]
    for token, fee in order:
        call.add(uniswap.quoter.quoteExactInputSingle, (weth, token, 10**18, fee, 0))

    output = [
        {"token": token, "fee": fee, "out": res.amountOut}
        for (token, fee), res in zip(order, call())
        if res
    ]
    return {
        token: max(quotes, key=itemgetter("out"))["fee"]
        for token, quotes in groupby("token", output).items()
    }


def main():
    dev = accounts.test_accounts[0]
    base_fee = chain.blocks[-1].base_fee

    weth = Contract("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")
    ypermit = project.YearnPermit.deploy(
        sender=dev, max_priority_fee=0, max_fee=base_fee
    )

    # NOTE takes too long on fork so we hardcode
    # best_pools = find_best_pools_for_tokens(tokens)
    best_pools = {
        "0xdAC17F958D2ee523a2206206994597C13D831ec7": 100,
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": 500,
        "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": 10000,
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": 500,
        "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": 3000,
        "0x6B175474E89094C44Da98b954EedeAC495271d0F": 500,
        "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e": 10000,
    }
    print(best_pools)

    ONE = 10**18
    wrap_amount = len(best_pools) * ONE

    planner = Planner()
    planner.wrap_eth(str(uniswap.universal_router), wrap_amount)
    planner.wrap_eth(str(dev), ONE)

    for token, fee in best_pools.items():
        planner.v3_swap_exact_in(str(dev), ONE, 0, [str(weth), fee, token], False)

    uniswap.universal_router.execute(
        *planner.build(),
        value=wrap_amount + ONE,
        sender=dev,
        max_priority_fee=0,
        max_fee=base_fee,
    )

    call = Call()
    for token in best_pools:
        call.add(Contract(token).balanceOf, dev)

    balances = {token: balance for token, balance in zip(best_pools, call())}
    print("balances", balances)

    # obtain some old vault tokens to test the migration flow
    registry = Contract("0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804")
    yfi = "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e"
    usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    for token in [yfi, usdc]:
        token = Contract(token)
        for vault_id in range(registry.numVaults(token)):
            vault = Contract(registry.vaults(token, vault_id))
            print(vault.apiVersion(), token.symbol(), vault)
            gov = accounts.test_accounts[vault.governance()]
            vault.setDepositLimit(2**256 - 1, sender=gov)
            amount = token.balanceOf(dev) // 2
            token.approve(vault, amount, sender=dev)
            vault.deposit(amount, sender=dev)

    input("press enter to exit")
