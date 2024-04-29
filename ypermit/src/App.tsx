import { GrantApproval } from "@/components/GrantApproval";
import { MakeDeposit } from "@/components/MakeDeposit";
import { SelectToken } from "@/components/SelectToken";
import { SignPermit } from "@/components/SignPermit";
import { SupportedTokens } from "@/components/SupportedTokens";
import { TxButton } from "@/components/TxButton";
import { Separator } from "@/components/ui/separator";
import { registry_abi, weth_abi, ypermit_abi } from "@/constants/abi";
import { registries, weth, ypermit } from "@/constants/addresses";
import { Permit } from "@/hooks/useSignPermit";
import { Token } from "@/types";
import { Box, Container, Flex } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { maxUint96 } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
} from "wagmi";

function Logo() {
  return (
    <div className="flex space-x-2 items-end">
      <Rabbit className="h-[32px]" /> <div className="text-2xl">yearn</div>
    </div>
  );
}


function App() {
  // account
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  // app state
  const [selected_token, set_selected_token] = useState<Token | null>(null);
  const [permit, set_permit] = useState<Permit | null>(null);
  const [is_busy, set_busy] = useState(false);

  // everything needed to render the frontend is bundled in one call
  const user_info = useReadContract({
    address: ypermit,
    abi: ypermit_abi,
    functionName: "fetch_user_info",
    args: [account.address!],
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
    ? registry_num_tokens.data.reduce((acc, val) => acc + val.result, 0n)
    : null;

  // computed lists of tokens and vaults of user
  const user_tokens: Token[] | null = useMemo(() => {
    return user_info.isSuccess
      ? user_info.data.filter(
          (value) => value.token_balance > 1n && value.latest
        )
      : null;
  }, [user_info.data]);

  const user_vaults: Token[] | null = useMemo(() => {
    return user_info.isSuccess
      ? user_info.data.filter((value) => value.vault_balance > 1n)
      : null;
  }, [user_info.data]);

  // ui steps
  const is_connected = account.isConnected;
  const is_selected = selected_token !== null;
  const is_approved = selected_token?.permit2_allowance ?? 0n >= maxUint96;
  const is_permitted = permit !== null;

  // invalidate permit by token address
  useEffect(() => {
    if (permit === null || selected_token == null) return;
    if (permit.message.permitted.token !== selected_token.address) {
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
          user_tokens={user_tokens?.length ?? null}
        />
        <SelectToken
          tokens={user_tokens}
          selected_token={selected_token}
          on_select={(token: Token) => set_selected_token(token)}
          busy={is_busy}
        />
        {is_selected && (
          <GrantApproval token={selected_token} set_busy={set_busy} />
        )}

        {is_approved && (
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

        <Box className="h-[20rem]"></Box>
        <Separator />

        {/* todo */}
        <div>
          <h2>Account</h2>

          <div>
            status: {account.status}
            <br />
            addresses: {JSON.stringify(account.addresses)}
            <br />
            chainId: {account.chainId}
          </div>

          {account.status === "connected" && (
            <button type="button" onClick={() => disconnect()}>
              Disconnect
            </button>
          )}
        </div>

        <div>
          <h2>Connect</h2>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
            >
              {connector.name}
            </button>
          ))}
          <div>{status}</div>
          <div>{error?.message}</div>
        </div>

        <div>
          <h2>send deposit</h2>
          {permit !== null ? (
            <TxButton
              label="deposit with permit"
              payload={{
                abi: ypermit_abi,
                address: ypermit,
                functionName: "deposit",
                args: permit,
              }}
              set_busy={set_busy}
            ></TxButton>
          ) : (
            <>no permit</>
          )}
        </div>
        <TxButton
          label="wrap"
          payload={{
            abi: weth_abi,
            address: weth,
            functionName: "deposit",
            value: 10n ** 18n,
          }}
          set_busy={set_busy}
        ></TxButton>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </Flex>
      <Toaster richColors toastOptions={{ duration: 10000 }} />
    </Container>
  );
}

export default App;
