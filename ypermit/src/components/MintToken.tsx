import { erc20_mint_abi } from "@/constants/abi";
import type { Token } from "@/types";
import { to_wei } from "@/utils";
import { Code, Flex, Text } from "@radix-ui/themes";
import { useAccount } from "wagmi";
import { ExplorerAddress } from "./ExplorerLink";
import { TokenLogo } from "./SelectToken";
import { TxButton } from "./TxButton";

interface MintTokenProps {
  token: Token;
  busy: boolean;
  set_busy: (value: boolean) => void;
}

export function MintToken({ token, busy, set_busy }: MintTokenProps) {
  const account = useAccount();
  const mint_amount = "100";
  const payload = {
    address: token.token,
    abi: erc20_mint_abi,
    functionName: "mint",
    args: [account.address, to_wei(mint_amount, token.decimals)],
  };

  if (!token) return;
  return (
    <Flex gap="4" direction="column" className="items-baseline">
      <Text size="5">
        mint <TokenLogo address={token.token} /> {token.symbol}
      </Text>
      <Flex gap="2" className="items-baseline">
        <TxButton
          label="mint"
          description={`${token.symbol} mint`}
          payload={payload}
          disabled={busy}
          set_busy={set_busy}
        />
        <Code truncate>
          <ExplorerAddress address={token.token}>{token.symbol}</ExplorerAddress>
          .mint({mint_amount})
        </Code>
      </Flex>
    </Flex>
  );
}
