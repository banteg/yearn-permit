import { formatUnits, parseUnits } from "viem";

export function range(num: number) {
  return [...Array(num).entries()].map((_e, i) => i);
}

export function to_wei(amount: string, decimals: bigint | number) {
  return parseUnits(amount, decimals as number);
}

export function from_wei(amount: bigint, decimals: bigint | number) {
  return formatUnits(amount, decimals as number);
}
