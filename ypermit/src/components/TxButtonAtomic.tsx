import { Button } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCallsStatus, useWriteContracts } from "wagmi/experimental";

export function TxButtonAtomic({
	label,
	description,
	payload,
	disabled,
	set_busy,
	cleanup,
}: {
	label: string;
	description?: string;
	payload: object;
	disabled?: boolean;
	set_busy: (busy: boolean) => void;
	cleanup?: () => void;
}) {
	const query_client = useQueryClient();
	const [resolver, set_resolver] = useState<
		(() => (value: unknown) => void) | null
	>(null);
	const {
		data: bundle_id,
		isPending,
		writeContracts,
	} = useWriteContracts({
		mutation: {
			onError(error) {
				// signature rejected or gas estimation failed
				toast.error(error.name, { description: error.message });
				set_busy(false);
			},
			onSuccess(data) {
				// tx broadcasted
				toast_broadcast(data);
			},
		},
	});
	const { data: calls_status } = useCallsStatus({
		id: bundle_id as string,
		query: {
			enabled: !!bundle_id,
			refetchInterval: (data) =>
				data.state.data?.status === "CONFIRMED" ? false : 2000,
		},
	});

	function toast_broadcast(txn_hash: string) {
		toast.promise(
			new Promise((resolve) => {
				// save to resolve from the effect when we get a receipt
				set_resolver(() => resolve);
			}),
			{
				loading: `<Strong>${
					description ?? label
				}</Strong> transaction submitted`,
				success: () => {
					return `<Strong>${
						description ?? label
					}</Strong> transaction confirmed`;
				},
				error: "error",
				action: {
					label: "view",
					onClick: () => {
						window.open(`https://etherscan.io/tx/${txn_hash}`, "_blank");
					},
				},
			},
		);
	}

	useEffect(() => {
		if (calls_status?.status !== "CONFIRMED") return;
		set_busy(false);
		!!cleanup && cleanup();
		query_client.invalidateQueries();
		// sets the promise toast to success
		!!resolver && resolver();
	}, [calls_status?.status]);

	return (
		<Button
			onClick={() => {
				set_busy(true);
				// @ts-ignore
				writeContracts(payload);
			}}
			disabled={isPending || calls_status?.status === "PENDING" || disabled}
		>
			{label}
		</Button>
	);
}
