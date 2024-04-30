import { GrantApproval } from "@/components/GrantApproval";
import { Logo } from "@/components/Header";
import { MakeDeposit } from "@/components/MakeDeposit";
import { SelectToken } from "@/components/SelectToken";
import { SignPermit } from "@/components/SignPermit";
import { SupportedTokens } from "@/components/SupportedTokens";
import { registry_abi, ypermit_abi } from "@/constants/abi";
import { registries, ypermit } from "@/constants/addresses";
import { Permit } from "@/hooks/useSignPermit";
import { Token } from "@/types";
import { Container, Flex, Text } from "@radix-ui/themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { Address, maxUint96 } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
} from "wagmi";

function App() {
  // app state
  const account = useAccount();
  const [selected, set_selected] = useState<Address | null>(null);
  const [permit, set_permit] = useState<Permit | null>(null);
  const [is_busy, set_busy] = useState(false);

  // everything needed to render the frontend is bundled in one call
  const user_info = useReadContract({
    address: ypermit,
    abi: ypermit_abi,
    functionName: "fetch_user_info",
    args: [account.address!],
    query: { retry: 0 },
  });

  // read number of supported tokens
  const registry_num_tokens = useReadContracts({
    contracts: registries.map((registry) => ({
      address: registry,
      abi: registry_abi,
      functionName: "numTokens",
    })),
  });
  const num_tokens = registry_num_tokens.isSuccess
    ? registry_num_tokens.data.reduce(
        (acc, val) => acc + (val.result as bigint),
        0n
      )
    : null;

  // computed lists of tokens and vaults of user
  const user_tokens: Token[] | null = useMemo(
    () =>
      user_info.isSuccess
        ? user_info.data.filter(
            (value) =>
              value.latest &&
              (value.token_balance > 1n || value.vault_balance > 1n)
          )
        : null,
    [user_info.data]
  );

  const user_vaults: Token[] | null = useMemo(
    () =>
      user_info.isSuccess
        ? user_info.data.filter(
            (value) => !value.latest && value.vault_balance > 1n
          )
        : null,
    [user_info.data]
  );

  // @ts-ignore
  const selected_token: Token | null = useMemo(
    () =>
      user_tokens !== null
        ? user_tokens.find((token) => token.token == selected)
        : null,
    [user_tokens, selected]
  );

  // ui steps
  const is_approved =
    selected_token && selected_token.permit2_allowance >= maxUint96;
  const needs_approval = selected_token && !is_approved;
  const is_permitted = permit !== null;
  const has_balance = !!selected_token && selected_token.token_balance > 1n
  const have_migrations = !!user_vaults?.length;

  // invalidate permit by token address
  useEffect(() => {
    if (permit === null || selected_token == null) return;
    if (permit.message.permitted.token !== selected) {
      console.log("invalidate permit from app");
      set_permit(null);
    }
  }, [permit, selected_token]);

  return (
    <Container width="40rem" py="4">
      <Flex direction="column" gap="4" className="">
        <Logo />
        <SupportedTokens
          registry_tokens={num_tokens}
          user_tokens={user_tokens ? user_tokens.length : null}
        />
        <SelectToken
          tokens={user_tokens}
          selected_token={selected_token}
          on_select={(token: Token) => set_selected(token.token)}
          busy={is_busy}
        />
        {needs_approval && (
          <GrantApproval token={selected_token} set_busy={set_busy} />
        )}

        {is_approved && has_balance && (
          <SignPermit
            token={selected_token}
            spender={ypermit}
            permit={permit}
            set_permit={set_permit}
            busy={is_busy}
          />
        )}
        {is_permitted && (
          <MakeDeposit
            token={selected_token}
            permit={permit}
            set_permit={set_permit}
            set_busy={set_busy}
          />
        )}

        {/* todo migrations */}
        {have_migrations && (
          <Flex direction="column" gap="4">
            <Text size="5">migration available</Text>
            <SelectToken tokens={user_vaults} busy={is_busy} />
          </Flex>
        )}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      </Flex>
      <Toaster richColors toastOptions={{ duration: 10000 }} />
    </Container>
  );
}

export default App;
