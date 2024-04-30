import { Button } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export function TxButton({
  label,
  description = null,
  payload,
  set_busy,
  cleanup = null,
}: {
  label: string;
  description?: string | null;
  payload: object;
  set_busy: Function;
  cleanup?: Function | null;
}) {
  const query_client = useQueryClient();
  const [resolver, set_resolver] = useState<Function | null>(null);
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
      }
    );
  }

  useEffect(() => {
    set_busy(false);
    if (!isSuccess) return;
    if (cleanup !== null) cleanup();
    query_client.invalidateQueries();
    // sets the promise toast to success
    resolver!();
  }, [isSuccess]);

  return (
    <>
      <Button
        onClick={() => {
          set_busy(true);
          // @ts-ignore
          writeContract(payload);
        }}
        disabled={isPending || isLoading}
      >
        {label}
      </Button>
    </>
  );
}
