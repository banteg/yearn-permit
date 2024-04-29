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


class Commands(IntEnum):
    # Masks to extract certain bits of commands
    FLAG_ALLOW_REVERT = 0x80
    COMMAND_TYPE_MASK = 0x3F

    # Command Types. Maximum supported command at this moment is 0x3f.

    # Command Types where value<0x08, executed in the first nested-if block
    V3_SWAP_EXACT_IN = 0x00
    V3_SWAP_EXACT_OUT = 0x01
    PERMIT2_TRANSFER_FROM = 0x02
    PERMIT2_PERMIT_BATCH = 0x03
    SWEEP = 0x04
    TRANSFER = 0x05
    PAY_PORTION = 0x06
    # COMMAND_PLACEHOLDER = 0x07

    # The commands are executed in nested if blocks to minimise gas consumption
    # The following constant defines one of the boundaries where the if blocks split commands
    FIRST_IF_BOUNDARY = 0x08

    # Command Types where 0x08<=value<=0x0f, executed in the second nested-if block
    V2_SWAP_EXACT_IN = 0x08
    V2_SWAP_EXACT_OUT = 0x09
    PERMIT2_PERMIT = 0x0A
    WRAP_ETH = 0x0B
    UNWRAP_WETH = 0x0C
    PERMIT2_TRANSFER_FROM_BATCH = 0x0D
    BALANCE_CHECK_ERC20 = 0x0E
    # COMMAND_PLACEHOLDER = 0x0f

    # The commands are executed in nested if blocks to minimise gas consumption
    # The following constant defines one of the boundaries where the if blocks split commands
    SECOND_IF_BOUNDARY = 0x10

    # Command Types where 0x10<=value<0x18, executed in the third nested-if block
    SEAPORT_V1_5 = 0x10
    LOOKS_RARE_V2 = 0x11
    NFTX = 0x12
    CRYPTOPUNKS = 0x13
    # 0x14
    OWNER_CHECK_721 = 0x15
    OWNER_CHECK_1155 = 0x16
    SWEEP_ERC721 = 0x17

    # The commands are executed in nested if blocks to minimise gas consumption
    # The following constant defines one of the boundaries where the if blocks split commands
    THIRD_IF_BOUNDARY = 0x18

    # Command Types where 0x18<=value<=0x1f, executed in the final nested-if block
    X2Y2_721 = 0x18
    SUDOSWAP = 0x19
    NFT20 = 0x1A
    X2Y2_1155 = 0x1B
    FOUNDATION = 0x1C
    SWEEP_ERC1155 = 0x1D
    ELEMENT_MARKET = 0x1E
    # COMMAND_PLACEHOLDER = 0x1f

    # The commands are executed in nested if blocks to minimise gas consumption
    # The following constant defines one of the boundaries where the if blocks split commands
    FOURTH_IF_BOUNDARY = 0x20

    # Command Types where 0x20<=value
    SEAPORT_V1_4 = 0x20
    EXECUTE_SUB_PLAN = 0x21
    APPROVE_ERC20 = 0x22
    # COMMAND_PLACEHOLDER for 0x23 to 0x3f (all unused)


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
