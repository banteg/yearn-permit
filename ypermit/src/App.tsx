import {
  Button,
  Container,
  Flex,
} from "@radix-ui/themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { multicall } from "@wagmi/core";
import { Rabbit } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { maxUint96 } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
} from "wagmi";
import { GrantApproval } from "./components/GrantApproval";
import { SelectToken } from "./components/SelectToken";
import { SignPermit } from "./components/SignPermit";
import { TxButton } from "./components/TxButton";
import { Separator } from "./components/ui/separator";
import {
  erc20_abi,
  registry_abi,
  weth_abi,
  ypermit_abi,
} from "./constants/abi";
import {
  latest_registry,
  permit2,
  registries,
  weth,
  ypermit,
} from "./constants/addresses";
import { config } from "./wagmi";

function Logo() {
  return (
    <div className="flex space-x-2 items-end">
      <Rabbit className="h-[32px]" /> <div className="text-2xl">yearn</div>
    </div>
  );
}

function LoadingBunny() {
  return (
    <Rabbit className="text-violet-500 inline animate-wiggle h-[1.5rem]" />
  );
}

function SupportedTokens({ registry_tokens, user_tokens }) {
  // 1. loading from registry
  if (registry_tokens === null)
    return (
      <div className="text-xl text-violet-500">
        loading from registry… <LoadingBunny />
      </div>
    );
  // 2. loading user balances
  if (user_tokens === null) {
    return (
      <div className="text-xl">
        <span>supports {registry_tokens.length} tokens, </span>
        <span className="text-violet-500">
          loading your tokens… <LoadingBunny />
        </span>
      </div>
    );
  }
  // 3. fully loaded
  return (
    <div className="text-xl">
      supports {registry_tokens.length} tokens, you have {user_tokens.length}{" "}
      tokens
    </div>
  );
}

function MakeDeposit() {
  return (
    <div className="flex space-x-2 items-baseline">
      <Button>deposit</Button>
      <div className="text-slate-500">into yearn vault</div>
    </div>
  );
}

function App() {
  const account = useAccount();

  const [supported_tokens, set_supported_tokens] = useState<string[] | null>(
    null
  ); // [address]
  const [user_tokens, set_user_tokens] = useState<Token[] | null>(null); // [{token: address, balance: uint}]
  const [selected_token, set_selected_token] = useState<Token | null>(null);

  const allowance = useReadContract({
    address: selected_token?.address,
    abi: erc20_abi,
    functionName: "allowance",
    args: [account.address, permit2],
  });

  // ui steps
  const has_token = selected_token !== null;
  const has_allowance = allowance.data >= maxUint96;
  const has_permit = false;

  const [permit, setPermit] = useState([]);
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    async function fetch_supported_tokens() {
      // registry.numTokens() for each registry
      const num_tokens = await multicall(config, {
        contracts: registries.map((registry) => ({
          address: registry,
          abi: registry_abi,
          functionName: "numTokens",
        })),
      });
      // registry.tokens(n) for each token in each registry
      let payload = [];
      for (const [i, registry] of registries.entries()) {
        const token_range = [...Array(parseInt(num_tokens[i].result)).keys()];
        for (const j of token_range) {
          payload.push({
            address: registry,
            abi: registry_abi,
            functionName: "tokens",
            args: [j],
          });
        }
      }
      let tokens = await multicall(config, { contracts: payload });
      set_supported_tokens(tokens.map((res) => res.result));
      console.log("fetched", tokens.length, "tokens");
    }

    fetch_supported_tokens();
  }, []);

  useEffect(() => {
    if (supported_tokens === null) return;
    set_user_tokens(null);
    async function fetch_user_tokens() {
      if (supported_tokens === null) return;
      // check balances for all supported tokens
      const balances = await multicall(config, {
        contracts: supported_tokens.map((token) => ({
          address: token,
          abi: erc20_abi,
          functionName: "balanceOf",
          args: [account.address],
        })),
      });
      // filter by non-zero balances
      let token_balances = [];
      for (const [i, token] of supported_tokens.entries()) {
        if (balances[i].result != 0n) {
          token_balances.push({ address: token, balance: balances[i].result });
        }
      }
      // fetch additional metadata like symbol and decimals
      const metadata = await multicall(config, {
        contracts: token_balances
          .map((token) => ({
            address: token.address,
            abi: erc20_abi,
            functionName: "symbol",
          }))
          .concat(
            token_balances.map((token) => ({
              address: token.address,
              abi: erc20_abi,
              functionName: "decimals",
            }))
          )
          .concat(
            token_balances.map((token) => ({
              address: latest_registry,
              abi: registry_abi,
              functionName: "latestVault",
              args: [token.address],
            }))
          ),
      });
      const meta_balances = [];
      const skip = token_balances.length;
      for (const [i, token] of token_balances.entries()) {
        const token_meta: Token = {
          ...token,
          symbol: metadata[i].result,
          decimals: metadata[skip + i].result,
          vault: metadata[skip * 2 + i].result,
        };
        meta_balances.push(token_meta);
      }
      set_user_tokens(meta_balances);
      console.log("fetched", meta_balances.length, "user balances");
    }
    fetch_user_tokens();
  }, [supported_tokens, account.address]);

  return (
    <Container width="40rem" py="4">
      <Flex direction="column" gap="4" className="">
        <Logo />
        <SupportedTokens
          registry_tokens={supported_tokens}
          user_tokens={user_tokens}
        />
        <SelectToken
          tokens={user_tokens}
          selected_token={selected_token}
          on_select={(token: Token) => set_selected_token(token)}
        />
        {selected_token && <GrantApproval token={selected_token} />}

        {has_allowance && (
          <SignPermit
            token={selected_token}
            spender={ypermit}
            setPermit={setPermit}
            permit={permit}
          />
        )}
        {has_permit && <MakeDeposit />}

        <Separator />

        <div>
          {allowance.status} {allowance.data?.toString()}
        </div>

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
          {permit.length ? (
            <TxButton
              label="deposit with permit"
              payload={{
                abi: ypermit_abi,
                address: ypermit,
                functionName: "deposit",
                args: permit,
              }}
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
        ></TxButton>
        <ReactQueryDevtools initialIsOpen={false} />
      </Flex>
      <Toaster richColors toastOptions={{ duration: 10000 }} />
    </Container>
  );
}

export default App;
