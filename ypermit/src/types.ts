import type { Address } from "viem";

export interface Token {
  token: Address;
  vault: Address;
  decimals: number;
  token_balance: bigint;
  vault_balance: bigint;
  permit2_allowance: bigint;
  symbol: string;
  vault_api: string;
  vault_share_price: bigint;
  latest: boolean;
}

export interface Permit {
  message: {
    permitted: { token: Address; amount: bigint };
    spender: Address;
    nonce: bigint;
    deadline: bigint;
  };
  signature: string;
}
