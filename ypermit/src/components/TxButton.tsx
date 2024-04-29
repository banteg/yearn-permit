import { Button } from "@radix-ui/themes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export function TxButton({
  label,
  payload,
  set_busy,
}: {
  label: string;
  payload: object;
  set_busy: Function;
}) {
  const query_client = useQueryClient();
  const [resolver, set_resolver] = useState(null);
  const {
    data: txn_hash,
    isPending,
    writeContract,
  } = useWriteContract({
    mutation: {
      onError(error, variables, context) {
        // signature rejected or gas estimation failed
        toast.error(error.name, { description: error.message });
        set_busy(false);
      },
      onSuccess(data, variables, context) {
        // tx broadcasted
        toast_broadcast(data);
      },
    },
  });
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txn_hash,
  });

  function toast_broadcast(txn_hash) {
    toast.promise(
      new Promise((resolve) => {
        // save to resolve from the effect when we get a receipt
        set_resolver(() => resolve);
      }),
      {
        loading: `<Strong>${label}</Strong> transaction submitted`,
        success: (message) => {
          return `<Strong>${label}</Strong> transaction confirmed`;
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
    set_busy(false)
    if (!isSuccess) return;
    query_client.invalidateQueries();
    // sets the promise toast to success
    resolver();
  }, [isSuccess]);

  return (
    <>
      <Button
        onClick={() => {
          set_busy(true);
          writeContract(payload);
        }}
        disabled={isPending || isLoading}
      >
        {label}
      </Button>
    </>
  );
}
