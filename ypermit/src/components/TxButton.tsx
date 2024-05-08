import { Button } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export function TxButton({
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
  const [resolver, set_resolver] = useState<(() => (value: unknown) => void) | null>(null);
  const {
    data: txn_hash,
    isPending,
    writeContract,
  } = useWriteContract({
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
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txn_hash,
  });

  function toast_broadcast(txn_hash: string) {
    toast.promise(
      new Promise((resolve) => {
        // save to resolve from the effect when we get a receipt
        set_resolver(() => resolve);
      }),
      {
        loading: `<Strong>${description ?? label}</Strong> transaction submitted`,
        success: () => {
          return `<Strong>${description ?? label}</Strong> transaction confirmed`;
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
    if (!isSuccess) return;
    set_busy(false);
    !!cleanup && cleanup();
    query_client.invalidateQueries();
    // sets the promise toast to success
    !!resolver && resolver();
  }, [isSuccess]);

  return (
    <Button
      onClick={() => {
        // @ts-ignore
        writeContract(payload);
        set_busy(true);
      }}
      disabled={isPending || isLoading || disabled}
    >
      {label}
    </Button>
  );
}
