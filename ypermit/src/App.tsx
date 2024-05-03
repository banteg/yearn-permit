import { Logo } from "@/components/Header";
import { SupportedTokens } from "@/components/SupportedTokens";
import { ypermit_abi } from "@/constants/abi";
import { ypermit } from "@/constants/addresses";
import type { Token } from "@/types";
import { Container, Flex } from "@radix-ui/themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import type { Address } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { ManageTokens } from "./components/ManageTokens";
import { MigrateVaults } from "./components/MigrateVaults";
import type { Permit } from "./types";

function App() {
	// app state
	const account = useAccount();
	// track by vault address
	const [selected, set_selected] = useState<Address | null>(null);
	const [permit, set_permit] = useState<Permit | null>(null);
	const [is_busy, set_busy] = useState(false);

	// everything needed to render the frontend is bundled in one call
	const user_query = useReadContract({
		address: ypermit,
		abi: ypermit_abi,
		functionName: "fetch_user_info",
		args: [account.address as Address],
		query: { retry: 0, enabled: !!account.address },
	});

	// computed lists of tokens and vaults of user
	const user_tokens: Token[] | undefined = useMemo(
		() =>
			user_query.data?.filter(
				(value) =>
					value.latest &&
					(value.token_balance > 1n || value.vault_balance > 1n),
			),
		[user_query.data],
	);

	const migrateable_vaults: Token[] | undefined = useMemo(
		() =>
			user_query.data?.filter(
				(value) => !value.latest && value.vault_balance > 1n,
			),
		[user_query.data],
	);

	// look up the latest token info from the vault address
	const selected_token: Token | undefined = useMemo(
		() => user_query.data?.find((token) => token.vault === selected),
		[user_query.data, selected],
	);

	// invalidate permit by token address
	useEffect(() => {
		if (permit === null || selected_token == null) return;
		if (permit.message.permitted.token !== selected_token.token) {
			console.log("invalidate permit from app");
			set_permit(null);
		}
	}, [permit, selected_token]);

	useEffect(() => {
		set_permit(null);
		set_selected(null);
	}, [account.isConnected]);

	return (
		<Container maxWidth="40rem" m={{ initial: "0.5rem", sm: "0" }} pb="5rem">
			<Flex direction="column" gap="4" className="">
				<Logo />
				<SupportedTokens user_query={user_query} user_tokens={user_tokens} />

				<ManageTokens
					tokens={user_tokens}
					selected_token={selected_token}
					permit={permit}
					set_permit={set_permit}
					set_selected={(token: Token) => set_selected(token.vault)}
					busy={is_busy}
					set_busy={set_busy}
				/>

				{(migrateable_vaults?.length ?? 0) > 0 && (
					<MigrateVaults
						tokens={migrateable_vaults}
						selected_token={selected_token}
						set_selected={(token: Token) => set_selected(token.vault)}
						busy={is_busy}
						set_busy={set_busy}
					/>
				)}
				<ReactQueryDevtools />
			</Flex>
			<Toaster richColors toastOptions={{ duration: 10000 }} />
		</Container>
	);
}

export default App;
