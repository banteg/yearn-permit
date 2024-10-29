import { useExplorerLink } from "@/hooks/useExplorerLink";
import { Link } from "@radix-ui/themes";
import type { ReactNode } from "react";
import type { Address } from "viem";

export function ExplorerAddress({
  address,
  children,
}: {
  address: Address;
  children: ReactNode;
}) {
  const explorer = useExplorerLink();

  return (
    <Link href={`${explorer}/address/${address}`} target="_blank" color="violet">
      {children}
    </Link>
  );
}
