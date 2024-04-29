import { cn } from "@/lib/utils";
import { Token } from "@/types";
import { range } from "@/utils";
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

const skeletoken = { symbol: "YFI", token_balance: 0n, decimals: 18 };

export function TokenLogo({ address }) {
  const src = `https://assets.smold.app/api/token/1/${address}/logo.svg`;
  return <Avatar size="1" radius="full" src={address ? src : null}></Avatar>;
}

export function SelectToken({
  tokens,
  selected_token,
  on_select,
  busy = false,
}: {
  tokens: Token[] | null;
  selected_token: Token | null;
  on_select: Function;
  busy: boolean;
}) {
  if (tokens === null) {
    return (
      <Grid columns="4" gap="2">
        {range(4).map((i) => (
          <TokenCard key={i} token={skeletoken} loading={true} />
        ))}
      </Grid>
    );
  }

  function is_selected(token: Token) {
    return selected_token && token.token == selected_token.token;
  }

  return (
    <Grid columns="4" gap="2">
      {tokens.map((token) => (
        <TokenCard
          key={token.token}
          token={token}
          selected={is_selected(token)}
          loading={tokens === null}
          wiggle={busy && is_selected(token)}
          disabled={busy && !is_selected(token)}
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
        onClick={(e) => {
          if (disabled) return;
          on_select(token);
        }}
        className={cn(
          "cursor-pointer",
          selected && "bg-slate-300",
          disabled && "opacity-50 cursor-not-allowed",
          wiggle && "animate-wiggle"
        )}
      >
        <Flex direction="column" gap="1">
          <Flex gap="2">
            <TokenLogo address={token.token} />
            <Text>{token.symbol}</Text>
            <Box flexGrow="1"></Box>
            {token.permit2_allowance! >= maxUint96 && (
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
            {formatUnits(token.token_balance, token.decimals)} {token.symbol}
          </Text>
        </Flex>
      </Card>
    </Skeleton>
  );
}
