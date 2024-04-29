import { useState } from "react";
import { toast } from "sonner";
import { Address } from "viem";
import { useSignTypedData } from "wagmi";
import { permit2 } from "../constants/addresses";

interface Permit {
  message: object;
  signature: string;
}

export function useSignPermit() {
  const [permit, set_permit] = useState<Permit | null>(null);
  const signer = useSignTypedData({
    mutation: {
      onSuccess(signature, variables) {
        set_permit({ message: variables.message, signature: signature });
      },
      onError(error, variables) {
        toast.error(error.name, { description: error.message });
      },
    },
  });

  function sign_permit(
    token: Address,
    spender: Address,
    amount: bigint,
    nonce: bigint,
    deadline: bigint
  ) {
    signer.signTypedData({
      domain: {
        name: "Permit2",
        chainId: 1n,
        verifyingContract: permit2,
      },
      types: {
        PermitTransferFrom: [
          { name: "permitted", type: "TokenPermissions" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
        TokenPermissions: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
      },
      primaryType: "PermitTransferFrom",
      message: {
        permitted: { token: token, amount: amount },
        spender: spender,
        nonce: nonce,
        deadline: deadline,
      },
    });
  }

  function consume_permit() {
    set_permit(null);
  }

  return {
    permit,
    sign_permit,
    consume_permit,
  };
}
