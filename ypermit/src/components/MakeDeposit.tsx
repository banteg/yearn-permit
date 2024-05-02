import { TxButton } from "@/components/TxButton";
import { ypermit_abi } from "@/constants/abi";
import { ypermit } from "@/constants/addresses";
import { useDepositArgs } from "@/hooks/useDepositArgs";
import type { Permit } from "@/types";
import type { Token } from "@/types";
import { from_wei } from "@/utils";
import { Code, Flex } from "@radix-ui/themes";
import { ExplorerAddress } from "./ExplorerLink";

interface MakeDepositProps {
	token?: Token;
	permit: Permit;
	set_permit: (value: Permit | null) => void;
	busy: boolean;
	set_busy: (value: boolean) => void;
}

export function MakeDeposit({
	token,
	permit,
	set_permit,
	busy,
	set_busy,
}: MakeDepositProps) {
	const args = permit !== null && [
		permit.message.permitted.token,
		permit.message.permitted.amount,
		permit.message.deadline,
		permit.signature,
	];

	if (!token) return;
	return (
		<Flex gap="2" className="items-baseline">
			<TxButton
				label="deposit"
				description={`${token.symbol} deposit`}
				payload={{
					address: ypermit,
					abi: ypermit_abi,
					functionName: "deposit",
					args: args,
				}}
				disabled={busy}
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
