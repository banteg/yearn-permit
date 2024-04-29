import { TxButton } from "@/components/TxButton";
import { ypermit } from "@/constants/addresses";
import { useDepositArgs } from "@/hooks/useDepositArgs";
import { Code, Flex, Link } from "@radix-ui/themes";
import { formatUnits } from "viem";

export function MakeDeposit({ token, permit, set_permit, set_busy }) {
  const args = useDepositArgs(permit);
  return (
    <Flex gap="2" className="items-baseline">
      <TxButton
        label="deposit"
        description={`${token.symbol} deposit`}
        payload={args}
        set_busy={set_busy}
        cleanup={() => {set_permit(null)}}
      />
      <Code truncate>
        <Link
          href={`https://etherscan.io/address/${ypermit}`}
          target="_blank"
          color="violet"
        >
          ypermit
        </Link>
        .deposit(
        <Link
          href={`https://etherscan.io/address/${token.address}`}
          target="_blank"
          color="violet"
        >
          {token.symbol}
        </Link>
        , {formatUnits(permit.message.permitted.amount, token.decimals)},{" "}
        {permit.message.deadline.toString()}, {permit.signature})
      </Code>
    </Flex>
  );
}
