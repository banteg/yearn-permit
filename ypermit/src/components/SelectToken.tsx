import type { Token } from "@/types";
import { range } from "@/utils";
import { Avatar, Grid } from "@radix-ui/themes";
import type { Address } from "viem";
import { TokenCard } from "./TokenCard";

// @ts-ignore
const skeletoken: Token = {
	symbol: "YFI",
	token_balance: 0n,
	vault_balance: 0n,
	vault_share_price: 1n,
	decimals: 1,
	latest: true,
};

export function TokenLogo({ address }: { address: Address }) {
	const src = `https://assets.smold.app/api/token/1/${address}/logo.svg`;
	return (
		<Avatar
			size="1"
			radius="full"
			src={address ? src : undefined}
			fallback="T"
		/>
	);
}

export function SelectToken({
	tokens,
	selected_token,
	on_select,
	busy = false,
}: {
	tokens?: Token[];
	selected_token?: Token;
	on_select: (token: Token) => void;
	busy: boolean;
}) {
	if (!tokens) {
		return (
			<Grid columns={{ initial: "2", sm: "4" }} gap="2">
				{range(4).map((i) => (
					// @ts-ignore
					<TokenCard key={i} token={skeletoken} loading={true} />
				))}
			</Grid>
		);
	}

	function is_selected(token: Token) {
		return token.vault === selected_token?.vault;
	}

	return (
		<Grid columns={{ initial: "2", sm: "4" }} gap="2">
			{tokens.map((token) => (
				<TokenCard
					key={`${token.token}_${token.vault}`}
					token={token}
					selected={is_selected(token)}
					loading={tokens === null}
					wiggle={busy && is_selected(token)}
					disabled={busy && !is_selected(token)}
					on_select={on_select}
				/>
			))}
		</Grid>
	);
}
