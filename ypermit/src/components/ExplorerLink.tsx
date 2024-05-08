import { Link } from "@radix-ui/themes";
import type { ReactNode } from "react";
import type { Address } from "viem";
import { useChainId, useChains } from "wagmi";

export function ExplorerAddress({
  address,
  children,
}: {
  address: Address;
  children: ReactNode;
}) {
  const chains = useChains();
  const chain_id = useChainId();
  const chain = chains.find((chain) => chain.id === chain_id);
  const explorer = chain?.blockExplorers?.default.url;

  return (
    <Link href={`${explorer}/address/${address}`} target="_blank" color="violet">
      {children}
    </Link>
  );
}
