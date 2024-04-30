This is a [Vite](https://vitejs.dev) project bootstrapped with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).

## dev

1. run fork node
```bash
anvil --port 9545 --fork-url http://127.0.0.1:8545 --fork-block-number 19762730
```

2. deploy ypermit + buy some coins
```bash
ape run fork
```

3. install impersonator extension and set it to `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

4. run `bun dev`
