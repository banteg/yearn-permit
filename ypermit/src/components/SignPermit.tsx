import { useSignPermit } from "@/hooks/useSignPermit";
import { Button, Code, Flex, Link, Text, TextField } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { permit2, ypermit } from "../constants/addresses";
import { MyCallout } from "./MyCallout";

export function SignPermit({ token, spender, permit, setPermit }) {
  const [amount, set_amount] = useState("0")
  const signer = useSignPermit();
  const deadline = BigInt((new Date().valueOf() / 1000 + 86400).toFixed(0));

  useEffect(() => {
    set_amount(formatUnits(token.balance, token.decimals))
  }, [token.balance])

  return (
    <Flex direction="column" gap="4">
      {signer.permit !== null ? (
        <MyCallout
          color="violet"
          icon={<Rabbit size="1.3rem" />}
          title="have permit"
          description={permit[permit.length - 1]}
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
        <TextField.Root placeholder="deposit amount" size="3" className="w-60" value={amount}>
          <TextField.Slot side="right" px="1">
            <Button>max</Button>
          </TextField.Slot>
        </TextField.Root>
      </div>
      <Flex gap="2" className="items-baseline">
        <Button
          onClick={() =>
            signTypedData({
              domain: {
                name: "Permit2",
                chainId: 1n,
                verifyingContract: permit2,
              },
              types: {
                PermitTransferFrom: [
                  { name: "permitted", type: "TokenPermissions" },
                  { name: "spender", type: "address" },
                  { name: "nonce", type: "uint256" },
                  { name: "deadline", type: "uint256" },
                ],
                TokenPermissions: [
                  { name: "token", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                EIP712Domain: [
                  { name: "name", type: "string" },
                  { name: "chainId", type: "uint256" },
                  { name: "verifyingContract", type: "address" },
                ],
              },
              primaryType: "PermitTransferFrom",
              message: {
                permitted: { token: token.address, amount: 10n ** 18n },
                spender: spender,
                nonce: deadline,
                deadline: deadline,
              },
            })
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
          , {formatUnits(token.balance, token.decimals)})
        </Code>
      </Flex>
    </Flex>
  );
}
