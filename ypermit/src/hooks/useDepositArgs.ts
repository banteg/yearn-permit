import { ypermit_abi } from "@/constants/abi";
import { Permit } from "@/types";
import { ypermit } from "../constants/addresses";

export function useDepositArgs(permit: Permit) {
  const args = permit !== null && [
    permit.message.permitted.token,
    permit.message.permitted.amount,
    permit.message.deadline,
    permit.signature,
  ];
  return {
    address: ypermit,
    abi: ypermit_abi,
    functionName: "deposit",
    args: args,
  };
}
