import { erc20_abi, erc20_abi_overrides } from "@/constants/abi";
import { PERMIT2 } from "@/constants/addresses";
import type { Token } from "@/types";
import { Code, Flex, Strong } from "@radix-ui/themes";
import { Snail } from "lucide-react";
import { maxUint256 } from "viem";
import { ExplorerAddress } from "./ExplorerLink";
import { MyCallout } from "./MyCallout";
import { TxButton } from "./TxButton";

export function GrantApproval({
  token,
  busy,
  set_busy,
}: {
  token: Token;
  busy: boolean;
  set_busy: (busy: boolean) => void;
}) {
  return (
    <Flex direction="column" gap="4">
      <MyCallout
        color="orange"
        icon={<Snail size="1.3rem" />}
        title={<Strong>{token.symbol} needs approval</Strong>}
        description="approve permit2 once to get gasless approvals across all supported contracts"
      />
      <Flex gap="2" className="items-baseline">
        <TxButton
          label="approve"
          description={`${token.symbol} approve`}
          payload={{
            abi: erc20_abi_overrides[token.token] ?? erc20_abi,
            address: token.token,
            functionName: "approve",
            args: [PERMIT2, maxUint256],
          }}
          disabled={busy}
          set_busy={set_busy}
        />
        <Code>
          <ExplorerAddress address={token.token}>{token.symbol}</ExplorerAddress>
          .approve(
          <ExplorerAddress address={PERMIT2}>permit2</ExplorerAddress>, infinite)
        </Code>
      </Flex>
    </Flex>
  );
}
