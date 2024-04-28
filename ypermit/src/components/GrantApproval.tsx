import { erc20_abi, erc20_abi_overrides } from "@/constants/abi";
import { permit2 } from "@/constants/addresses";
import { Callout, Code, Flex, Strong, Text } from "@radix-ui/themes";
import { Snail } from "lucide-react";
import { maxUint256 } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { TxButton } from "./TxButton";

export function GrantApproval({ token }) {
  const account = useAccount();
  const allowance = useReadContract({
    address: token.address,
    abi: erc20_abi,
    functionName: "allowance",
    args: [account.address, permit2],
  });
  if (token == null || !allowance.isSuccess) return;
  if (allowance.data == 0n) {
    return (
      <Flex direction="column" gap="4">
        <Callout.Root color="red" variant="soft">
          <Callout.Icon>
            <Snail size="1.3rem" />
          </Callout.Icon>
          <Callout.Text>
            <Text as="p">
              <Strong>{token.symbol} needs approval</Strong>
            </Text>
            <Text as="p">
              approve permit2 once to get gasless approvals across all supported
              contracts
            </Text>
          </Callout.Text>
        </Callout.Root>
        <Flex gap="2" className="items-baseline">
          <TxButton
            label="approve"
            payload={{
              abi: erc20_abi_overrides[token.address] ?? erc20_abi,
              address: token.address,
              functionName: "approve",
              args: [permit2, maxUint256],
            }}
          ></TxButton>
          <Code>
            {token.symbol}.approve(
            <a href={`https://etherscan.io/address/${permit2}`} target="_blank">
              permit2
            </a>
            , max_uint256)
          </Code>
        </Flex>
      </Flex>
    );
  }
}
