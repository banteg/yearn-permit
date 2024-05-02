import { Logo } from "@/components/Header";
import { SupportedTokens } from "@/components/SupportedTokens";
import { registry_abi, ypermit_abi } from "@/constants/abi";
import { registries, ypermit } from "@/constants/addresses";
import type { Token } from "@/types";
import { Container, Flex } from "@radix-ui/themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeartCrack } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import type { Address } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { ErrorMessage } from "./components/ErrorMessage";
import { ManageTokens } from "./components/ManageTokens";
import { MigrateVaults } from "./components/MigrateVaults";
import { MyCallout } from "./components/MyCallout";
import type { Permit } from "./types";

function App() {
	// app state
	const account = useAccount();
	// track by vault address
	const [selected, set_selected] = useState<Address | null>(null);
	const [permit, set_permit] = useState<Permit | null>(null);
	const [is_busy, set_busy] = useState(false);

	// everything needed to render the frontend is bundled in one call
	const user_info = useReadContract({
		address: ypermit,
		abi: ypermit_abi,
		functionName: "fetch_user_info",
		args: [account.address as Address],
		query: { retry: 0, enabled: !!account.address },
	});

	// read number of supported tokens
	const registry_num_tokens = useReadContracts({
		contracts: registries.map((registry) => ({
			address: registry,
			abi: registry_abi,
			functionName: "numTokens",
		})),
	});
	// useReadContracts stores error per result
	const num_tokens_status = registry_num_tokens?.data?.[0]?.status;
	const num_tokens =
		num_tokens_status === "success"
			? registry_num_tokens.data?.reduce(
					(acc, val) => acc + (val.result as bigint),
					0n,
				)
			: null;

	// computed lists of tokens and vaults of user
	const user_tokens: Token[] | undefined = useMemo(
		() =>
			user_info.data?.filter(
				(value) =>
					value.latest &&
					(value.token_balance > 1n || value.vault_balance > 1n),
			),
		[user_info.data],
	);

	const migrateable_vaults: Token[] | undefined = useMemo(
		() =>
			user_info.data?.filter(
				(value) => !value.latest && value.vault_balance > 1n,
			),
		[user_info.data],
	);

	// look up the latest token info from the vault address
	const selected_token: Token | undefined = useMemo(
		() => user_info.data?.find((token) => token.vault === selected),
		[user_info.data, selected],
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
				{user_info.isError && <ErrorMessage error={user_info.error} />}
				<SupportedTokens
					registry_tokens={num_tokens ?? null}
					user_tokens={user_tokens ? user_tokens.length : null}
					is_error={num_tokens_status === "failure"}
				/>

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
