import { Link } from "@radix-ui/themes";
import { ReactNode } from "react";
import { Address } from "viem";

export function ExplorerAddress({
  address,
  children,
}: {
  address: Address;
  children: ReactNode;
}) {
  return (
    <Link
      href={`https://etherscan.io/address/${address}`}
      target="_blank"
      color="violet"
    >
      {children}
    </Link>
  );
}
