import { formatUnits, parseUnits } from "viem";

export function range(num: number) {
  return [...Array(num).entries()].map((_e, i) => i);
}

export function to_wei(amount: string, decimals: number) {
  return parseUnits(amount, decimals as number);
}

export function from_wei(amount: bigint, decimals: number) {
  return formatUnits(amount, decimals as number);
}

export function format_wei(
  value: bigint,
  decimals: number,
  digits: number = 5
) {
  // format to significant digits while keeping integer precision
  const [integer_part, decimal_part] = formatUnits(value, decimals).split(".");
  console.log(integer_part, decimal_part);
  digits = Math.max(integer_part.length, digits);
  return (Number(value) / 10 ** decimals).toLocaleString("en-US", {
    maximumSignificantDigits: Math.min(digits, 18),
  });
}
