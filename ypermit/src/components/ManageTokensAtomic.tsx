import { useMintableToken } from "@/constants/addresses";
import type { Token } from "@/types";
import { useMemo } from "react";
import { MakeDepositAtomic } from "./MakeDepositAtomic";
import { MakeWithdraw } from "./MakeWithdraw";
import { MintToken } from "./MintToken";
import { SelectToken } from "./SelectToken";

type ManageTokensAtomicProps = {
	tokens?: Token[];
	selected_token?: Token;
	set_selected: (token: Token) => void;
	busy: boolean;
	set_busy: (busy: boolean) => void;
};

export function ManageTokensAtomic({
	tokens,
	selected_token,
	set_selected,
	busy,
	set_busy,
}: ManageTokensAtomicProps) {
	const selected_here = useMemo(
		() => tokens?.find((token) => token.vault === selected_token?.vault),
		[tokens, selected_token],
	);
	const mintable_token = useMintableToken();
	const is_depositable = selected_token && selected_token.token_balance > 1n;
	const is_withdrawable = selected_token && selected_token.vault_balance > 1n;

	return (
		<>
			<SelectToken
				tokens={tokens}
				selected_token={selected_token}
				on_select={(token: Token) => set_selected(token)}
				busy={busy}
			/>
			{selected_here && selected_token && (
				<>
					{is_depositable && (
						<MakeDepositAtomic
							token={selected_token}
							busy={busy}
							set_busy={set_busy}
						/>
					)}
					{is_withdrawable && (
						<MakeWithdraw
							token={selected_token}
							busy={busy}
							set_busy={set_busy}
						/>
					)}
				</>
			)}
			{mintable_token && (
				// @ts-ignore
				<MintToken token={mintable_token} busy={busy} set_busy={set_busy} />
			)}
		</>
	);
}
