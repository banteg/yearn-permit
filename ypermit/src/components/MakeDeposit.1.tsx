import { TxButton } from "@/components/TxButton";
import { ypermit } from "@/constants/addresses";
import { useDepositArgs } from "@/hooks/useDepositArgs";
import { from_wei } from "@/utils";
import { Code, Flex, Link } from "@radix-ui/themes";
import { ExplorerAddress } from "./ExplorerLink";
import { MakeDepositProps } from "./MakeDeposit";


export function MakeDeposit({
  token, permit, set_permit, set_busy,
}: MakeDepositProps) {
  const args = useDepositArgs(permit);
  return (
    <Flex gap="2" className="items-baseline">
      <TxButton
        label="deposit"
        description={`${token.symbol} deposit`}
        payload={args}
        set_busy={set_busy}
        cleanup={() => {
          set_permit(null);
        }} />
      <Code truncate>
        <ExplorerAddress>ypermit</ExplorerAddress>
        <Link
          href={`https://etherscan.io/address/${ypermit}`}
          target="_blank"
          color="violet"
        >
          ypermit
        </Link>
        .deposit(
        <Link
          href={`https://etherscan.io/address/${token.token}`}
          target="_blank"
          color="violet"
        >
          {token.symbol}
        </Link>
        , {from_wei(permit.message.permitted.amount, token.decimals)},{" "}
        {permit.message.deadline.toString()}, {permit.signature})
      </Code>
    </Flex>
  );
}
