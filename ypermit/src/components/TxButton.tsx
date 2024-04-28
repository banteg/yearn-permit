import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Button } from "@radix-ui/themes";

export function TxButton({ label, payload }) {
  const query_client = useQueryClient();
  const { data, isPending, writeContract } = useWriteContract({
    mutation: {
      onError(error, variables, context) {
        toast.error(error.name, { description: error.message });
      },
      onSuccess(data, variables, context) {
        console.log(data, variables, context);
        toast(
          <div>
            <div className="font-bold">transaction</div>
          </div>
        );
      },
    },
  });
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: data });
  async function submit() {
    writeContract(payload);
  }
  useEffect(() => {
    if (!isSuccess) return;
    query_client.invalidateQueries();
  }, [isSuccess]);
  return (
    <>
      <Button onClick={submit} disabled={isPending || isLoading}>
        {label}
      </Button>
    </>
  );
}
