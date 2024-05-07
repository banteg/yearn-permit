import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const config = createConfig({
	chains: [mainnet, sepolia],
	connectors: [
		injected(),
		coinbaseWallet({ appName: "yearn", appChainIds: [sepolia.id] }),
		// walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
	],
	transports: {
		[mainnet.id]: http(),
		[sepolia.id]: http(),
	},
});

declare module "wagmi" {
	interface Register {
		config: typeof config;
	}
}
