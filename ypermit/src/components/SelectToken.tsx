import { cn } from "@/lib/utils";
import { Token } from "@/types";
import { from_wei, range } from "@/utils";
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
import { Rabbit, Sparkle, Vault, WalletMinimal } from "lucide-react";
import { Address, maxUint96 } from "viem";

// @ts-ignore
const skeletoken: Token = {
  symbol: "YFI",
  token_balance: 0n,
  vault_balance: 0n,
  vault_share_price: 1n,
  decimals: 1,
};

export function TokenLogo({ address }: { address: Address }) {
  const src = `https://assets.smold.app/api/token/1/${address}/logo.svg`;
  return (
    <Avatar
      size="1"
      radius="full"
      src={address ? src : undefined}
      fallback="T"
    ></Avatar>
  );
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
          // @ts-ignore
          <TokenCard key={i} token={skeletoken} loading={true} />
        ))}
      </Grid>
    );
  }

  function is_selected(token: Token) {
    return !!selected_token && token.token === selected_token.token;
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
  const token_balance = from_wei(token.token_balance, token.decimals);
  const vault_balance = from_wei(
    token.vault_balance * token.vault_share_price,
    token.decimals * 2
  );
  const share_in_vault =
    Number(vault_balance) > 0
      ? Number(vault_balance) / (Number(token_balance) + Number(vault_balance))
      : 0;
  console.log(share_in_vault);
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
        <div
          className="bg-violet-500 bottom-0 left-0 absolute h-[3px] z-10"
          style={{ width: `${share_in_vault * 100}%` }}
        ></div>
        <Flex direction="column" gap="1">
          <Flex gap="2" pb="1">
            <TokenLogo address={token.token} />
            <Text truncate>{token.symbol}</Text>
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
          <Text truncate size="1">
            <WalletMinimal className="inline w-[1rem] text-slate-400 -translate-y-[1px]" />
            <Text>
              {" "}{from_wei(token.token_balance, token.decimals)} {token.symbol}
            </Text>
          </Text>
          <Text truncate size="1">
            <Rabbit className="inline w-[1rem] text-violet-400 -translate-y-[2px]" />
            <Text>
            {" "}{vault_balance}{" "}
            {token.symbol}
            </Text>
          </Text>
        </Flex>
      </Card>
    </Skeleton>
  );
}
