import { Permit, useSignPermit } from "@/hooks/useSignPermit";
import { Token } from "@/types";
import { Button, Code, Flex, Link, Text, TextField } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { ypermit } from "../constants/addresses";
import { MyCallout } from "./MyCallout";

export function SignPermit({
  token,
  spender,
  permit,
  set_permit,
}: {
  token: Token;
  spender: Address;
  permit: Permit | null;
  set_permit: Function;
}) {
  const [amount, set_amount] = useState("0");
  const signer = useSignPermit({ set_permit });
  const deadline = BigInt((new Date().valueOf() / 1000 + 86400).toFixed(0));
  const amount_wei = useMemo(
    () => parseUnits(amount, token.decimals),
    [amount, token]
  );

  useEffect(() => {
    set_amount(formatUnits(token.balance, token.decimals));
  }, [token]);

  useEffect(() => {
    if (permit === null) return;
    if (
      permit.message.permitted.token !== token.address ||
      permit.message.spender != spender ||
      permit.message.permitted.amount !== amount_wei
    ) {
      console.log("invalidate permit");
      set_permit(null);
    }
  }, [permit, token, spender, amount_wei]);

  function validate_set_amount(value) {
    try {
      parseUnits(value, token.decimals);
    } catch (error) {
      return;
    }
    const wei = parseUnits(value, token.decimals);
    if (wei < 0) {
      set_amount("0");
    } else if (wei > token.balance) {
      set_amount(formatUnits(token.balance, token.decimals));
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
        <Text className="uppercase text-xs">deposit amount</Text>
        <TextField.Root
          placeholder="deposit amount"
          size="3"
          className="w-60"
          value={amount}
          onChange={(e) => validate_set_amount(e.target.value)}
        >
          <TextField.Slot side="right" px="1">
            <Button
              onClick={() =>
                validate_set_amount(formatUnits(token.balance, token.decimals))
              }
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
              token.address,
              spender,
              parseUnits(amount, token.decimals),
              deadline,
              deadline
            )
          }
        >
          sign
        </Button>
        <Code>
          {token.symbol}.permit(
          <Link
            href={`https://etherscan.io/address/${ypermit}`}
            target="_blank"
            color="violet"
          >
            ypermit
          </Link>
          , {formatUnits(amount_wei, token.decimals)})
        </Code>
      </Flex>
    </Flex>
  );
}
