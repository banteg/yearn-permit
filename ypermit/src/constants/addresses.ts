import type { Address } from "viem";

export const permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const registries: Address[] = [
  "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
  "0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319",
];
export const latest_registry = registries[registries.length - 1];
export const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const ypermit = import.meta.env.DEV
  ? "0x59c7D03d2E9893FB7bAa89dA50a9452e1e9B8b90"
  : "0xC466BcF8C315827C3A8813a7f6D398Efd8023853";
