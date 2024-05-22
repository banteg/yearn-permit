import { useChainId, useChains } from "wagmi";

export function useExplorerLink() {
  const chains = useChains();
  const chain_id = useChainId();
  const chain = chains.find((chain) => chain.id === chain_id);
  return chain?.blockExplorers?.default.url;
}
