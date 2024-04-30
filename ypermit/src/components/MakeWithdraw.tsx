import { TxButton } from "@/components/TxButton";
import { Token } from "@/types";
import { from_wei, to_wei } from "@/utils";
import { Code, Flex, Text } from "@radix-ui/themes";
import { ExplorerAddress } from "./ExplorerLink";
import { useEffect, useState } from "react";
import { vault_abi } from "@/constants/abi";
import { InputAmount } from "./InputAmount";
import { TokenLogo } from "./SelectToken";

interface MakeWithdrawProps {
  token: Token;
  busy: boolean;
  set_busy: Function;
}

export function MakeWithdraw({ token, busy, set_busy }: MakeWithdrawProps) {
  const [amount, set_amount] = useState("0");

  const max_wei =
    (token.vault_balance * token.vault_share_price) /
    10n ** BigInt(token.decimals);

  const max = to_wei(amount, token.decimals) === max_wei;

  function validate_set_amount(value: string) {
    if (value === "max") {
      set_amount(from_wei(max_wei, token.decimals));
      return;
    }
    try {
      to_wei(value, token.decimals);
    } catch (error) {
      return;
    }
    const wei = to_wei(value, token.decimals);
    if (wei < 0n) {
      set_amount("0");
    } else if (wei > max_wei) {
      set_amount(from_wei(max_wei, token.decimals));
    } else {
      set_amount(value);
    }
  }

  useEffect(() => {
    set_amount(from_wei(max_wei, token.decimals));
  }, [token.vault_balance, token.vault_share_price]);

  const payload = {
    address: token.vault,
    abi: vault_abi,
    functionName: "withdraw",
    args: max ? [] : [to_wei(amount, token.decimals)],
  };

  return (
    <Flex direction="column" gap="4">
      <Text size="5">withdraw <TokenLogo address={token.vault} /> y{token.symbol}</Text>
      <InputAmount
        amount={amount}
        set_amount={validate_set_amount}
        busy={busy}
      />
      <Flex gap="2" className="items-baseline">
        <TxButton
          label="withdraw"
          description={`${token.symbol} withdraw`}
          payload={payload}
          set_busy={set_busy}
        />
        <Code truncate>
          <ExplorerAddress address={token.vault}>
            y{token.symbol}
          </ExplorerAddress>
          .withdraw({max ? "" : amount})
        </Code>
      </Flex>
    </Flex>
  );
}
