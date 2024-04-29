import { ypermit_abi } from "@/constants/abi";
import { ypermit } from "../constants/addresses";
import { Permit } from "./useSignPermit";

export function useDepositArgs(permit: Permit) {
  const args = permit !== null && [
    permit.message.permitted.token,
    permit.message.permitted.amount,
    permit.message.deadline,
    permit.signature,
  ];
  return {
    payload: {
      address: ypermit,
      abi: ypermit_abi,
      functionName: "deposit",
      args: args,
    },
  };
}
