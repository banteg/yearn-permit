from ape import chain, project, accounts
from eth_abi import encode
from hexbytes import HexBytes
from rich import print


def main():
    ypermit = "0x8CeA85eC7f3D314c4d144e34F2206C8Ac0bbadA1"
    contract_type = project.YearnPermit.contract_type
    code = contract_type.runtime_bytecode.bytecode
    immutables = encode(
        ["address"] * 3,
        [
            "0x000000000022D473030F116dDEE9F6B43aC78BA3",
            "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
            "0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319",
        ],
    )
    code = HexBytes(HexBytes(code) + immutables).hex()
    call = chain.provider.web3.eth.call
    eco = chain.provider.network.ecosystem
    user = "0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde"

    for method in ["fetch_user_info"]:
        print(method)
        method = contract_type.methods[method]
        tx = eco.encode_transaction(ypermit, method, user).model_dump()
        resp = call(tx, "latest", {ypermit: {"code": code}})
        decoded = eco.decode_returndata(method, resp)[0]
        print(decoded)
