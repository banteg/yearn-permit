import { TxButton } from "@/components/TxButton";
import { ypermit } from "@/constants/addresses";
import { useDepositArgs } from "@/hooks/useDepositArgs";
import { Permit } from "@/hooks/useSignPermit";
import { Token } from "@/types";
import { from_wei } from "@/utils";
import { Code, Flex } from "@radix-ui/themes";
import { ExplorerAddress } from "./ExplorerLink";

interface MakeDepositProps {
  token: Token;
  permit: Permit;
  set_permit: Function;
  set_busy: Function;
}

export function MakeDeposit({
  token,
  permit,
  set_permit,
  set_busy,
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
        }}
      />
      <Code truncate>
        <ExplorerAddress address={ypermit}>ypermit</ExplorerAddress>
        .deposit(
        <ExplorerAddress address={token.token}>{token.symbol}</ExplorerAddress>,{" "}
        {from_wei(permit.message.permitted.amount, token.decimals)},{" "}
        {permit.message.deadline.toString()}, {permit.signature})
      </Code>
    </Flex>
  );
}
