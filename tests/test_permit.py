def test_deposit(dev, weth, permit2, ypermit):
    weth.deposit(value="1 ether", sender=dev)
    weth.approve(permit2, "1 ether", sender=dev)
