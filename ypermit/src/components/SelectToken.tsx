import { cn } from "@/lib/utils";
import {
  Avatar,
  Box,
  Card,
  Flex,
  Grid,
  Skeleton,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { Sparkle } from "lucide-react";
import { formatUnits, maxUint96 } from "viem";
import { useAccount, useReadContracts } from "wagmi";
// import { Token, permit2 } from "../App";
import { erc20_abi } from "@/constants/abi";
import { permit2 } from "@/constants/addresses";
import { Token } from "@/types";

export function SelectToken({
  tokens,
  selected_token,
  on_select,
}: {
  tokens: Token[];
  selected_token: Token;
  on_select: Function;
}) {
  const account = useAccount();
  const tokens_to_render = tokens
    ? tokens
    : [...Array(4).entries()].map((i, e) => ({
        symbol: "YFI",
        balance: 0n,
        address: i,
      }));

  // 1. load balances and allowances
  const resp = useReadContracts({
    contracts:
      tokens === null
        ? []
        : tokens
            .map((token) => ({
              address: token.address,
              abi: erc20_abi,
              functionName: "balanceOf",
              args: [account.address],
            }))
            .concat(
              tokens.map((token) => ({
                address: token.address,
                abi: erc20_abi,
                functionName: "allowance",
                args: [account.address, permit2],
              }))
            ),
  });
  if (tokens !== null && resp.isSuccess) {
    for (const [i, token] of tokens.entries()) {
      tokens_to_render[i] = {
        ...tokens[i],
        balance: resp.data[i].result,
        allowance: resp.data[tokens.length + i].result,
        logo: `https://assets.smold.app/api/token/1/${token.address}/logo.svg`,
      };
    }
  }

  return (
    <Grid columns="4" gap="2">
      {tokens_to_render.map((token) => (
        <TokenCard
          key={token.address}
          token={token}
          selected={selected_token && token.address == selected_token.address}
          loading={tokens === null || !resp.isSuccess}
          on_select={on_select}
        />
      ))}
    </Grid>
  );
}
export function TokenCard({
  token,
  selected,
  on_select,
  loading = false,
  disabled = false,
  wiggle = false,
}: {
  token: Token;
  selected: boolean;
  on_select: Function;
  loading: boolean;
  disabled: boolean;
  wiggle: boolean;
}) {
  return (
    <Skeleton loading={loading}>
      <Card
        key={token.address}
        onClick={(e) => on_select(token)}
        className={cn(
          "cursor-pointer",
          selected && "bg-slate-300",
          disabled && "opacity-50",
          wiggle && "animate-wiggle"
        )}
      >
        <Flex direction="column" gap="1">
          <Flex gap="2">
            <Avatar src={token.logo} size="1" radius="full"></Avatar>
            <Text>{token.symbol}</Text>
            <Box flexGrow="1"></Box>
            {token.allowance! >= maxUint96 && (
              <Tooltip content="gasless approval">
                <Sparkle
                  size="1.5rem"
                  strokeWidth="1"
                  className="text-green-500"
                />
              </Tooltip>
            )}
          </Flex>
          <Text truncate className="text-xs">
            {formatUnits(token.balance as bigint, token.decimals)}{" "}
            {token.symbol}
          </Text>
        </Flex>
      </Card>
    </Skeleton>
  );
}
