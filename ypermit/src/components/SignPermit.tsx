import { Permit, useSignPermit } from "@/hooks/useSignPermit";
import { Token } from "@/types";
import { from_wei, to_wei } from "@/utils";
import { Button, Code, Flex, Text, TextField } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { ypermit } from "../constants/addresses";
import { ExplorerAddress } from "./ExplorerLink";
import { MyCallout } from "./MyCallout";

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
  set_permit: Function;
  busy: boolean;
}) {
  const [amount, set_amount] = useState("0");
  const signer = useSignPermit({ set_permit });
  const deadline = BigInt((new Date().valueOf() / 1000 + 86400).toFixed(0));
  const amount_wei = to_wei(amount, token.decimals);

  // invalidate permit when token, spender, amount changes
  useEffect(() => {
    if (permit === null) return;
    if (
      permit.message.permitted.token !== token.token ||
      permit.message.spender != spender ||
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
    try {
      to_wei(value, token.decimals);
    } catch (error) {
      return;
    }
    const wei = to_wei(value, token.decimals);
    if (wei < 0) {
      set_amount("0");
    } else if (wei > token.token_balance) {
      set_amount(from_wei(token.token_balance, token.decimals));
    } else {
      set_amount(value);
    }
  }

  return (
    <Flex direction="column" gap="4">
      {permit !== null ? (
        <MyCallout
          color="violet"
          icon={<Rabbit size="1.3rem" />}
          title="have permit"
          description={permit.signature}
        />
      ) : (
        <MyCallout
          color="violet"
          icon={<Rabbit size="1.3rem" />}
          title="sign permit"
          description="sign to allow the deposit contract to pull your tokens"
        />
      )}

      <div>
        <Text>deposit amount</Text>
        <TextField.Root
          placeholder="deposit amount"
          size="3"
          className="w-60"
          value={amount}
          onChange={(e) => validate_set_amount(e.target.value)}
          disabled={busy}
        >
          <TextField.Slot side="right" px="1">
            <Button
              onClick={() =>
                validate_set_amount(
                  from_wei(token.token_balance, token.decimals)
                )
              }
              disabled={busy}
            >
              max
            </Button>
          </TextField.Slot>
        </TextField.Root>
      </div>
      <Flex gap="2" className="items-baseline">
        <Button
          onClick={() =>
            signer.sign_permit(
              token.token,
              spender,
              to_wei(amount, token.decimals),
              deadline, // use deadline as nonce
              deadline
            )
          }
          disabled={busy}
        >
          permit
        </Button>
        <Code>
          <ExplorerAddress address={token.token}>
            {token.symbol}
          </ExplorerAddress>
          .permit(
          <ExplorerAddress address={ypermit}>ypermit</ExplorerAddress>,{" "}
          {from_wei(amount_wei, token.decimals)})
        </Code>
      </Flex>
    </Flex>
  );
}
