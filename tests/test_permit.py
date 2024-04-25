from ape import convert, chain


def test_deposit(dev, weth, permit2, ypermit, make_permit):
    amount = convert("1 ether", int)
    weth.deposit(value=amount, sender=dev)
    weth.approve(permit2, amount, sender=dev)

    nonce = chain.blocks[-1].timestamp
    deadline = nonce + 3600
    permit = make_permit(str(weth), amount, str(ypermit), nonce, deadline)
    signature = dev.sign_message(permit).encode_rsv()

    receipt = ypermit.deposit(weth, amount, nonce, deadline, signature, sender=dev)
    receipt.show_trace()
