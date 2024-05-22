import { vault_abi } from "@/constants/abi";
import type { Token } from "@/types";
import { from_wei, to_wei } from "@/utils";
import { Code, Flex, Text } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi } from "viem";
import { ExplorerAddress } from "./ExplorerLink";
import { InputAmount } from "./InputAmount";
import { MyCallout } from "./MyCallout";
import { TokenLogo } from "./SelectToken";
import { TxButtonAtomic } from "./TxButtonAtomic";

interface MakeDepositProps {
  token: Token;
  busy: boolean;
  set_busy: (value: boolean) => void;
}

export function MakeDepositAtomic({ token, busy, set_busy }: MakeDepositProps) {
  const [amount, set_amount] = useState("0");

  useEffect(() => {
    set_amount(from_wei(token.token_balance, token.decimals));
  }, [token.token_balance]);

  function validate_set_amount(value: string) {
    if (value === "max") value = from_wei(token.token_balance, token.decimals);
    try {
      to_wei(value, token.decimals);
    } catch (error) {
      return;
    }
    const wei = to_wei(value, token.decimals);
    if (wei < 0n) {
      set_amount("0");
    } else if (wei > token.token_balance) {
      set_amount(from_wei(token.token_balance, token.decimals));
    } else {
      set_amount(value);
    }
  }

  const deposit_amount = to_wei(amount, token?.decimals);

  const payload = useMemo(
    () => ({
      contracts: [
        {
          address: token.token,
          abi: erc20Abi,
          functionName: "approve",
          args: [token?.vault, deposit_amount],
        },
        {
          address: token.vault,
          abi: vault_abi,
          functionName: "deposit",
          args: [deposit_amount],
        },
      ],
    }),
    [token, deposit_amount],
  );

  if (!token) return;
  return (
    <Flex gap="4" direction="column" className="items-baseline">
      <Text size="5">
        deposit <TokenLogo address={token.token} /> {token.symbol}
      </Text>
      <MyCallout
        color="jade"
        title="your wallet supports atomic batching"
        description="this means you can deposit your tokens in one transaction"
        icon={<Rabbit size="1.3rem" className="animate-wiggle" />}
      />

      <InputAmount amount={amount} set_amount={validate_set_amount} busy={busy} />

      <Flex gap="2" className="items-baseline">
        <TxButtonAtomic
          label="deposit"
          description={`${token.symbol} deposit`}
          payload={payload}
          disabled={busy}
          set_busy={set_busy}
        />
        <Code truncate>
          <ExplorerAddress address={token.vault}>yv{token.symbol}</ExplorerAddress>
          .deposit({from_wei(deposit_amount, token.decimals)})
        </Code>
      </Flex>
    </Flex>
  );
}
