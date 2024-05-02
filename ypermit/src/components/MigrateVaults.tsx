import { vault_abi } from "@/constants/abi";
import type { Token } from "@/types";
import { Code, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { ExplorerAddress } from "./ExplorerLink";
import { SelectToken } from "./SelectToken";
import { TxButton } from "./TxButton";

export function MigrateVaults({
	tokens,
	busy,
	set_busy,
}: { tokens?: Token[]; busy: boolean; set_busy: (is_busy: boolean) => void }) {
	const [token, set_token] = useState<Token | null>(null);
	if ((tokens?.length ?? 0) === 0) return;

	return (
		<Flex gap="4" direction="column">
			<Text size="5">migration available</Text>
			<SelectToken
				tokens={tokens}
				selected_token={token}
				on_select={set_token}
				busy={busy}
			/>
			{token && (
				<Flex gap="2" className="items-baseline">
					<TxButton
						label="withdraw"
						description={`withdraw yv${token.symbol}`}
						payload={{
							address: token.vault,
							abi: vault_abi,
							functionName: "withdraw",
						}}
						disabled={busy}
						set_busy={set_busy}
					/>
					<Code truncate>
						<ExplorerAddress address={token.vault}>
							yv{token.symbol}
						</ExplorerAddress>
						.withdraw()
					</Code>
				</Flex>
			)}
		</Flex>
	);
}
