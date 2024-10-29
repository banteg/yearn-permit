import { registry_abi, vault_abi } from "@/constants/abi";
import { useRegistries } from "@/constants/addresses";
import { cn } from "@/lib/utils";
import type { Token } from "@/types";
import { format_wei, from_wei } from "@/utils";
import { Box, Card, Flex, Skeleton, Text, Tooltip } from "@radix-ui/themes";
import { Rabbit, Sparkle, WalletMinimal } from "lucide-react";
import { maxUint96 } from "viem";
import { useReadContract } from "wagmi";
import { TokenLogo } from "./SelectToken";

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
  on_select: (token: Token) => void;
  loading: boolean;
  disabled: boolean;
  wiggle: boolean;
}) {
  const token_balance = from_wei(token.token_balance, token.decimals);
  const vault_balance = from_wei(token.vault_balance * token.vault_share_price, token.decimals * 2);
  const vault_balance_fmt = format_wei(token.vault_balance * token.vault_share_price, token.decimals * 2);
  const share_in_vault =
    Number(vault_balance) > 0 ? Number(vault_balance) / (Number(token_balance) + Number(vault_balance)) : 0;

  // show migration path for old vaults
  const registries = useRegistries();
  const latest_registry = registries[registries.length - 1];
  const latest_vault = useReadContract({
    address: latest_registry,
    abi: registry_abi,
    functionName: "latestVault",
    args: [token.token],
    query: { enabled: !token.latest },
  });
  const api_version = useReadContract({
    address: latest_vault.data,
    abi: vault_abi,
    functionName: "apiVersion",
    query: { enabled: latest_vault.isSuccess },
  });

  return (
    <Skeleton loading={loading}>
      <Card
        onClick={() => {
          if (disabled) return;
          on_select(token);
        }}
        className={cn(
          "cursor-pointer",
          selected && "bg-slate-300",
          disabled && "opacity-50 cursor-not-allowed",
          wiggle && "animate-wiggle",
        )}
      >
        <div
          className="bg-violet-500 bottom-0 left-0 absolute h-[3px] transition-all duration-300"
          style={{ width: `${share_in_vault * 100}%` }}
        />
        <Flex direction="column" gap="1">
          <Flex gap="2" pb="1">
            <TokenLogo address={token.token} />
            <Text truncate>{token.symbol}</Text>
            <Box flexGrow="1" />
            {token.permit2_allowance >= maxUint96 && (
              <Tooltip content="gasless approval">
                <Sparkle size="1.5rem" strokeWidth="1" className="text-green-500" />
              </Tooltip>
            )}
          </Flex>
          <Text truncate size="1">
            <WalletMinimal className="inline w-[1rem] text-slate-400 -translate-y-[1px]" />
            <Text>
              {" "}
              {format_wei(token.token_balance, token.decimals)} {token.symbol}
            </Text>
          </Text>
          <Text truncate size="1">
            <Tooltip content={token.latest ? `latest vault ${token.vault_api}` : `old vault ${token.vault_api}`}>
              <Rabbit className="inline w-[1rem] text-violet-400 -translate-y-[2px]" />
            </Tooltip>
            <Text>
              {" "}
              {vault_balance_fmt} {token.symbol}
            </Text>
          </Text>
          {!token.latest && (
            <Text color="tomato" size="1">
              migration available
              <br /> {token.vault_api} to {api_version.data ?? "…"}
            </Text>
          )}
        </Flex>
      </Card>
    </Skeleton>
  );
}
