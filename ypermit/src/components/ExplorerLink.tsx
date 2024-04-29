import { Link } from "@radix-ui/themes";

export function ExplorerAddress({ address, children }) {
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
