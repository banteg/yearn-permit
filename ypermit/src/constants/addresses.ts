import type { Address } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { useChainId } from "wagmi";

export const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export const YPERMIT_DEV = "0x59c7D03d2E9893FB7bAa89dA50a9452e1e9B8b90";
export const YPERMIT_PROD: Record<number, Address> = {
	[mainnet.id]: "0xC466BcF8C315827C3A8813a7f6D398Efd8023853",
	[sepolia.id]: "0x5018Ce7efd45355daF9786Ca6618f576D94ed663",
};

export const REGISTRIES_PROD: Record<number, Address[]> = {
	[mainnet.id]: [
		"0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
		"0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319",
	],
	[sepolia.id]: ["0x002934477d18Ec84F59973fA3532A747D4096180"],
};

export function useYpermit() {
	const chain_id = useChainId();
	return YPERMIT_PROD[chain_id];
	// return import.meta.env.DEV ? YPERMIT_DEV : YPERMIT_PROD[chain_id];
}

export function useRegistries() {
	const chain_id = useChainId();
	return REGISTRIES_PROD[chain_id];
}
