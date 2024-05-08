import { useSignPermit } from "@/hooks/useSignPermit";
import type { Permit } from "@/types";
import type { Token } from "@/types";
import { from_wei, to_wei } from "@/utils";
import { Button, Code, Flex, Text } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { useYpermit } from "../constants/addresses";
import { ExplorerAddress } from "./ExplorerLink";
import { InputAmount } from "./InputAmount";
import { MyCallout } from "./MyCallout";
import { TokenLogo } from "./SelectToken";

export function SignPermit({
  token,
  spender,
  permit,
  set_permit,
  busy = false,
}: {
  token: Token;
  spender: Address;
  permit: Permit | null;
  set_permit: (permit: Permit | null) => void;
  busy: boolean;
}) {
  const ypermit = useYpermit();
  const [amount, set_amount] = useState("0");
  const signer = useSignPermit({ set_permit });
  const deadline = BigInt((new Date().valueOf() / 1000 + 86400).toFixed(0));
  const amount_wei = to_wei(amount, token.decimals);

  // invalidate permit when token, spender, amount changes
  useEffect(() => {
    if (permit === null) return;
    if (
      permit.message.permitted.token !== token.token ||
      permit.message.spender !== spender ||
      permit.message.permitted.amount !== amount_wei
    ) {
      console.log("invalidate permit");
      set_permit(null);
    }
  }, [permit, token, spender, amount_wei]);

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

  const is_permit_dirty = permit === null || permit.message.permitted.amount !== amount_wei;

  return (
    <Flex direction="column" gap="4">
      {permit !== null ? (
        <MyCallout
          color="green"
          icon={<Rabbit size="1.3rem" />}
          title="have permit"
          description="you are all set to deposit your tokens into a vault"
        />
      ) : (
        <MyCallout
          color="violet"
          icon={<Rabbit size="1.3rem" />}
          title="sign permit"
          description="sign to allow the deposit contract to pull your tokens"
        />
      )}

      <Text size="5">
        deposit <TokenLogo address={token.token} /> {token.symbol}
      </Text>
      <InputAmount amount={amount} set_amount={validate_set_amount} busy={busy} />

      {is_permit_dirty && (
        <Flex gap="2" className="items-baseline">
          <Button
            onClick={() =>
              signer.sign_permit(
                token.token,
                spender,
                to_wei(amount, token.decimals),
                deadline, // use deadline as nonce
                deadline,
              )
            }
            variant={is_permit_dirty ? "solid" : "surface"}
            disabled={busy}
          >
            permit
          </Button>
          <Code truncate>
            <ExplorerAddress address={token.token}>{token.symbol}</ExplorerAddress>
            .permit(
            <ExplorerAddress address={ypermit}>ypermit</ExplorerAddress>, {from_wei(amount_wei, token.decimals)})
          </Code>
        </Flex>
      )}
    </Flex>
  );
}
