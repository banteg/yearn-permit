import { Address } from "viem";

export interface Token {
  token: Address;
  vault: Address;
  decimals: bigint;
  token_balance: bigint;
  vault_balance: bigint;
  permit2_allowance: bigint;
  symbol: string;
  vault_api: string;
  latest: boolean;
  logo?: string;
}
