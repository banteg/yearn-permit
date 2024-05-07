import { createConfig, http } from "wagmi";
import { baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const config = createConfig({
	chains: [mainnet, baseSepolia, sepolia],
	connectors: [
		injected(),
		coinbaseWallet({
			appName: "bunny yearn",
			appChainIds: [baseSepolia.id, sepolia.id],
		}),
		// walletConnect({ projectId: import.meta.env.VITE_WC_PROJECT_ID }),
	],
	transports: {
		[mainnet.id]: http(),
		[sepolia.id]: http(),
		[baseSepolia.id]: http(),
	},
});

declare module "wagmi" {
	interface Register {
		config: typeof config;
	}
}
