import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    // coinbaseWallet({ appName: "Create Wagmi" }),
    // walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:9545"
        : undefined
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
