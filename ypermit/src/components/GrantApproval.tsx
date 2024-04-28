import { erc20_abi, erc20_abi_overrides } from "@/constants/abi";
import { permit2 } from "@/constants/addresses";
import { Code, Flex, Link, Skeleton, Strong } from "@radix-ui/themes";
import { Snail } from "lucide-react";
import { maxUint256 } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { MyCallout } from "./MyCallout";
import { TxButton } from "./TxButton";

export function GrantApproval({ token }) {
  const account = useAccount();
  const allowance = useReadContract({
    address: token.address,
    abi: erc20_abi,
    functionName: "allowance",
    args: [account.address, permit2],
  });
  const loading = token === null || !allowance.isSuccess;
  if (allowance.isSuccess && allowance.data !== 0n) return;
  return (
    <Flex direction="column" gap="4">
      <MyCallout
        color="red"
        icon={<Snail size="1.3rem" />}
        title={<Strong>{token.symbol} needs approval</Strong>}
        description="approve permit2 once to get gasless approvals across all supported
          contracts"
        loading={loading}
      />
      <Skeleton loading={loading}>
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
            <Link href={`https://etherscan.io/address/${permit2}`} target="_blank" color="violet">
              permit2
            </Link>
            , infinite)
          </Code>
        </Flex>
      </Skeleton>
    </Flex>
  );
}
