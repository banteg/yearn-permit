import { Button, Code, Flex, Link, Text, TextField } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { useSignTypedData } from "wagmi";
import { permit2, ypermit } from "../constants/addresses";
import { MyCallout } from "./MyCallout";

export function SignPermit({ token, spender, permit, setPermit }) {
  const { signTypedData } = useSignTypedData({
    mutation: {
      onSuccess(signature, variables) {
        console.log("mut", signature, variables);
        const args = [
          variables.message.permitted.token,
          variables.message.permitted.amount,
          variables.message.deadline,
          signature,
        ];
        setPermit(args);
      },
      onError(error, variables, context) {
        toast(error.message);
      },
    },
  });

  const deadline = BigInt((new Date().valueOf() / 1000 + 86400).toFixed(0));

  return (
    <Flex direction="column" gap="4">
      {permit.length ? (
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

      <label>
        <Text className="uppercase text-xs">deposit amount</Text>
        <TextField.Root placeholder="deposit amount" size="3">
          <TextField.Slot side="right" px="1">
            <Button>max</Button>
          </TextField.Slot>
        </TextField.Root>
      </label>
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
