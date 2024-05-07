import { TxButton } from "@/components/TxButton";
import { ypermit_abi } from "@/constants/abi";
import { useRegistries, useYpermit } from "@/constants/addresses";
import type { Permit, Token } from "@/types";
import { from_wei, to_wei } from "@/utils";
import { Button, Card, Code, Flex, Text } from "@radix-ui/themes";
import { Construction, Rabbit, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { ExplorerAddress } from "./ExplorerLink";
import { InputAmount } from "./InputAmount";
import { MyCallout } from "./MyCallout";
import { TokenLogo } from "./SelectToken";

interface MakeDepositProps {
	token?: Token;
	busy: boolean;
	set_busy: (value: boolean) => void;
}

export function MakeDepositAtomic({ token, busy, set_busy }: MakeDepositProps) {
	const [amount, set_amount] = useState("0");

	useEffect(() => {
		console.log("effect");
		set_amount(from_wei(token.token_balance, token.decimals));
	}, [token.token_balance]);

	function validate_set_amount(value: string) {
		if (value === "max") value = from_wei(token.token_balance, token.decimals);
		try {
			to_wei(value, token.decimals);
		} catch (error) {
			return;
		}
		const wei = to_wei(value, token.decimals);
		if (wei < 0n) {
			set_amount("0");
		} else if (wei > token.token_balance) {
			set_amount(from_wei(token.token_balance, token.decimals));
		} else {
			set_amount(value);
		}
	}

	const deposit_amount = to_wei(amount, token?.decimals);

	if (!token) return;
	return (
		<Flex gap="4" direction="column" className="items-baseline">
			<Text size="5">
				deposit <TokenLogo address={token.token} /> {token.symbol}
			</Text>
			<MyCallout
				color="jade"
				title="your wallet supports atomic batching"
				description="this means you can deposit your tokens in one transaction"
				icon={<Rabbit size="1.3rem" className="animate-wiggle" />}
			/>

			<InputAmount
				amount={amount}
				set_amount={validate_set_amount}
				busy={busy}
			/>

			<Flex gap="2" className="items-baseline">
				<Button>deposit</Button>
				<Code truncate>
					<ExplorerAddress address={token.vault}>
						yv{token.symbol}
					</ExplorerAddress>
					.deposit({from_wei(deposit_amount, token.decimals)})
				</Code>
			</Flex>
		</Flex>
	);
}
