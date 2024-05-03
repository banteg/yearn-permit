import { registry_abi } from "@/constants/abi";
import { registries } from "@/constants/addresses";
import { cn } from "@/lib/utils";
import type { Token } from "@/types";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import {
	type UseReadContractReturnType,
	useAccount,
	useReadContracts,
} from "wagmi";
import { ErrorMessage } from "./ErrorMessage";

export function LoadingBunny({
	animation,
}: {
	animation?: "animate-wiggle" | "animate-hop";
}) {
	return (
		<div className="ml-1 -translate-y-[3px] inline-block">
			<Rabbit
				strokeWidth="1.6"
				className={cn(
					"text-violet-500 inline-block relative w-[1.5rem] h-[1.5rem]",
					animation,
				)}
			/>
		</div>
	);
}

export function DeadBunny() {
	return (
		<div className="ml-1 inline-block">
			<Tooltip content="rip">
				<Rabbit
					strokeWidth="1.6"
					className="inline-block relative w-[1.5rem] h-[1.5rem] -rotate-[140deg]"
				/>
			</Tooltip>
		</div>
	);
}

export function SupportedTokens({
	user_query,
	user_tokens,
}: {
	user_query: UseReadContractReturnType;
	user_tokens?: Token[];
}) {
	const account = useAccount();
	// read number of supported tokens
	const registry_query = useReadContracts({
		allowFailure: false,
		query: { retry: 0 },
		contracts: registries.map((registry) => ({
			address: registry,
			abi: registry_abi,
			functionName: "numTokens",
		})),
	});
	// useReadContracts stores error per result
	const num_tokens = registry_query.isSuccess
		? // @ts-ignore
			registry_query.data?.reduce((acc, val) => acc + val, 0n)
		: null;

	// 0. error state
	if (user_query.isError || registry_query.isError)
		return (
			<Flex direction="column" gap="4">
				{user_query.isError && <ErrorMessage error={user_query.error} />}
				{registry_query.isError && (
					<ErrorMessage error={registry_query.error} />
				)}
				<Text size="5" color="red">
					failed to load <DeadBunny />
				</Text>
			</Flex>
		);

	// 1. loading from registry
	if (num_tokens === null)
		return (
			<Text size="5" className="text-violet-500">
				loading from registry… <LoadingBunny animation="animate-hop" />
			</Text>
		);
	// 2. disconnected
	if (account.status === "disconnected") {
		return (
			<Text size="5">
				<span>supports {num_tokens?.toString()} tokens, </span>
				<span className="text-violet-500">
					connect wallet above <LoadingBunny animation="animate-wiggle" />
				</span>
			</Text>
		);
	}
	// 3. loading user balances
	if (!user_tokens) {
		return (
			<Text size="5">
				<span>supports {num_tokens?.toString()} tokens, </span>
				<span className="text-violet-500">
					loading your tokens… <LoadingBunny animation="animate-hop" />
				</span>
			</Text>
		);
	}
	// 4. fully loaded
	return (
		<>
			<Text size="5">
				supports {num_tokens?.toString()} tokens, you have {user_tokens?.length}{" "}
				tokens
			</Text>
		</>
	);
}
