import { vault_abi } from "@/constants/abi";
import type { Token } from "@/types";
import { Code, Flex, Text } from "@radix-ui/themes";
import { Construction } from "lucide-react";
import { useMemo } from "react";
import { ExplorerAddress } from "./ExplorerLink";
import { MyCallout } from "./MyCallout";
import { SelectToken } from "./SelectToken";
import { TxButton } from "./TxButton";

export function MigrateVaults({
	tokens,
	selected_token,
	set_selected,
	busy,
	set_busy,
}: {
	tokens?: Token[];
	selected_token?: Token;
	set_selected: (token: Token) => void;
	busy: boolean;
	set_busy: (is_busy: boolean) => void;
}) {
	if ((tokens?.length ?? 0) === 0) return;
	const migration_selected = useMemo(
		() => tokens?.find((token) => token.vault === selected_token?.vault),
		[tokens, selected_token],
	);
	console.log(migration_selected);

	return (
		<Flex gap="4" direction="column">
			<Text size="5">migration available</Text>
			<MyCallout
				color="plum"
				title="permit migrations are in development"
				description="for now you can withdraw from outdated vaults"
				icon={<Construction size="1.3rem" />}
			/>
			<SelectToken
				tokens={tokens}
				selected_token={selected_token}
				on_select={set_selected}
				busy={busy}
			/>
			{selected_token && migration_selected && (
				<Flex gap="2" className="items-baseline">
					<TxButton
						label="withdraw"
						description={`withdraw yv${selected_token.symbol}`}
						payload={{
							address: selected_token.vault,
							abi: vault_abi,
							functionName: "withdraw",
						}}
						disabled={busy}
						set_busy={set_busy}
					/>
					<Code truncate>
						<ExplorerAddress address={selected_token.vault}>
							yv{selected_token.symbol}
						</ExplorerAddress>
						.withdraw()
					</Code>
				</Flex>
			)}
		</Flex>
	);
}
