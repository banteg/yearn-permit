import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const rpc = import.meta.env.DEV
  ? import.meta.env.VITE_RPC_URL ?? "http://127.0.0.1:9545"
  : undefined;

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    // coinbaseWallet({ appName: "Create Wagmi" }),
    // walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(rpc, { timeout: 60000 }),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
