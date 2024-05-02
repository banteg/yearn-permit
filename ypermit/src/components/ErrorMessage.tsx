import { Callout, Strong } from "@radix-ui/themes";
import { HeartCrack } from "lucide-react";
import type { BaseError } from "wagmi";

export function ErrorMessage({ error }: { error?: BaseError }) {
	if (!error) return;
	return (
		<Callout.Root color="red">
			<Callout.Icon>
				<HeartCrack />
			</Callout.Icon>
			<Callout.Text>
				<Strong>{error.name}</Strong>
			</Callout.Text>
			<Callout.Text className="whitespace-pre-wrap">
				{import.meta.env.DEV ? error.message : error.shortMessage}
			</Callout.Text>
		</Callout.Root>
	);
}
