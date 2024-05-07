import { Callout, Strong } from "@radix-ui/themes";
import type { ReadContractsErrorType } from "@wagmi/core";
import { HeartCrack } from "lucide-react";
import { useState } from "react";
import type { ReadContractErrorType } from "viem";

export function ErrorMessage({
	error,
}: { error: ReadContractErrorType | ReadContractsErrorType }) {
	const [expand, set_expand] = useState(false);
	if (!error) return;
	return (
		<Callout.Root
			color="red"
			onClick={() => set_expand((current) => !current)}
			className="cursor-pointer"
		>
			<Callout.Icon>
				<HeartCrack />
			</Callout.Icon>
			<Callout.Text>
				<Strong>{error.name}</Strong>
			</Callout.Text>
			<Callout.Text className="whitespace-pre-wrap break-all">
				{expand
					? error.message
					: "shortMessage" in error
						? error.shortMessage
						: error.message}
			</Callout.Text>
		</Callout.Root>
	);
}
