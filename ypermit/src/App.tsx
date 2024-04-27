import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useBlockNumber,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  permit2_abi,
  erc20_abi,
  registry_abi,
  ypermit_abi,
  usdt_abi,
} from "./abi";
import { formatEther, maxUint256, formatUnits, maxUint96 } from "viem";
import { Button, ButtonLoading } from "@/components/ui/button";
import { call, multicall, readContract } from "@wagmi/core";
import { Check, ChevronsUpDown, Rabbit, Snail, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { config } from "./wagmi";
import { toast } from "sonner";
import { Skeleton } from "./components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Separator } from "./components/ui/separator";
import { Toaster } from "./components/ui/sonner";

const permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const registries = [
  "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
  "0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319",
];
const ypermit = "0xf93b0549cD50c849D792f0eAE94A598fA77C7718";
const erc20_abi_overrides = {
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": usdt_abi,
};

function Logo() {
  return (
    <div className="flex space-x-2 items-end">
      <Rabbit className="h-[32px]" /> <div className="text-2xl">yearn</div>
    </div>
  );
}

function TxButton({ label, payload }) {
  const query_client = useQueryClient();
  const { data, isPending, writeContract } = useWriteContract({
    mutation: {
      onError(error, variables, context) {
        toast(
          <div>
            <div className="font-bold">{error.name}</div>
            <div className="text-xs">{error.message}</div>
          </div>
        );
      },
    },
  });
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: data });
  async function submit() {
    writeContract(payload);
  }
  useEffect(() => {
    if (!isSuccess) return;
    query_client.invalidateQueries();
  }, [isSuccess]);
  return (
    <>
      <Button onClick={submit} disabled={isPending || isLoading}>
        {label}
      </Button>
    </>
  );
}

export function SelectToken({ tokens, on_select }) {
  return (
    <>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="select token to deposit" />
        <CommandList>
          {tokens.map((token) => (
            <CommandItem
              key={token.address}
              onSelect={(value) => on_select(token)}
            >
              <span>{token.symbol}</span>
              <CommandShortcut>{token.balance_fmt}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </>
  );
}

function SelectTokenB({ tokens, selected_token, on_select }) {
  const account = useAccount();
  console.log("account", account, account.address);

  const payload = tokens
    .map((token) => ({
      address: token.address,
      abi: erc20_abi,
      functionName: "balanceOf",
      args: [account.address],
    }))
    .concat(
      tokens.map((token) => ({
        address: token.address,
        abi: erc20_abi,
        functionName: "allowance",
        args: [account.address, permit2],
      }))
    );
  console.log("tokens", tokens.length);
  const resp = useReadContracts({ contracts: payload });
  if (!resp.isFetched) return <>no tokens</>;
  const balances = resp.data?.slice(0, tokens.length).map((res) => res.result);
  const allowances = resp.data
    ?.slice(tokens.length, tokens.length * 2)
    .map((res) => res.result);
  console.log(balances);
  console.log(allowances);
  const data = [];
  for (const [i, token] of tokens.entries()) {
    data.push({
      ...token,
      balance: resp.data[i].result,
      allowance: resp.data[tokens.length + i].result,
    });
  }
  console.log(data)

  return (
    <div className="grid gap-2 grid-cols-4 ">
      {data.map((token) => (
        <div
          className={cn(
            "p-2 rounded-lg flex-1",
            selected_token && token.address === selected_token.address
              ? "bg-gray-100 border border-gray-300"
              : "border"
          )}
          key={token.address}
          onClick={(e) => on_select(token)}
        >
          <div className="flex space-x-2">
            {/* some tokens like uni limit max allowance to 96 bits */}
            {token.allowance >= maxUint96 ? (
              <Rabbit className="text-green-500 w-5" />
            ) : (
              <Snail className="text-red-500 w-5" />
            )}
            <div>{token.symbol}</div>
          </div>
          <div className="text-xs text-gray-500 overflow-auto">
            {formatUnits(token.balance, token.decimals)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GrantApproval({ token }) {
  const account = useAccount();
  if (!account.isConnected) return;
  const allowance = useReadContract({
    address: token.address,
    abi: erc20_abi,
    functionName: "allowance",
    args: [account.address, permit2],
  });
  const writer = useWriteContract();
  if (!allowance.isSuccess) return;
  if (allowance.data == 0n) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <Snail className="h-4 w-4" />
          <AlertTitle>{token.symbol} needs approval</AlertTitle>
          <AlertDescription>
            approve permit2 once to get gasless approvals across all supported
            contracts
          </AlertDescription>
        </Alert>
        <div className="flex space-x-2 items-baseline">
          <TxButton
            label="approve"
            payload={{
              abi: erc20_abi_overrides[token.address] ?? erc20_abi,
              address: token.address,
              functionName: "approve",
              args: [permit2, maxUint256],
            }}
          ></TxButton>
          <div className="text-slate-500">
            approve permit2 to pull your {token.symbol}
          </div>
        </div>
      </div>
    );
  } else {
    return <div>have approval</div>;
  }
}

function SignPermit({ token, spender, permit, setPermit }) {
  const { signTypedData } = useSignTypedData({
    mutation: {
      onSuccess(signature, variables) {
        console.log("mut", signature, variables);
        const args = [
          variables.message.permitted.token,
          variables.message.permitted.amount,
          variables.message.deadline,
          signature,
        ];
        setPermit(args);
      },
      onError(error, variables, context) {
        toast(error.message);
      },
    },
  });

  const deadline = BigInt((new Date().valueOf() / 1000 + 86400).toFixed(0));

  return (
    <div className="space-y-4">
      {permit.length ? (
        <Alert>
          <Ticket className="h-4 w-4" />
          <AlertTitle>have permit</AlertTitle>
          <AlertDescription className="overflow-clip">
            {permit[permit.length - 1]}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Rabbit className="h-4 w-4" />
          <AlertTitle>sign permit</AlertTitle>
          <AlertDescription>
            sign to allow the deposit contract to pull your tokens
          </AlertDescription>
        </Alert>
      )}
      <div className="flex space-x-2 items-baseline">
        <Button
          onClick={() =>
            signTypedData({
              domain: {
                name: "Permit2",
                chainId: 1n,
                verifyingContract: permit2,
              },
              types: {
                PermitTransferFrom: [
                  { name: "permitted", type: "TokenPermissions" },
                  { name: "spender", type: "address" },
                  { name: "nonce", type: "uint256" },
                  { name: "deadline", type: "uint256" },
                ],
                TokenPermissions: [
                  { name: "token", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                EIP712Domain: [
                  { name: "name", type: "string" },
                  { name: "chainId", type: "uint256" },
                  { name: "verifyingContract", type: "address" },
                ],
              },
              primaryType: "PermitTransferFrom",
              message: {
                permitted: { token: token.address, amount: 10n ** 18n },
                spender: spender,
                nonce: deadline,
                deadline: deadline,
              },
            })
          }
        >
          sign
        </Button>
        <div className="text-slate-500">
          gassless permit to deposit into a vault
        </div>
      </div>
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
  const [supported_tokens, set_supported_tokens] = useState([]); // [address]
  const [user_tokens, set_user_tokens] = useState([]); // [{token: address, balance: uint}]
  const [selected_token, set_selected_token] = useState(null);

  const account = useAccount();
  const [permit, setPermit] = useState([]);
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: block } = useBlockNumber();
  const [token, setToken] = useState(
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  );
  const { data: results, isSuccess: multi_status } = useReadContracts({
    contracts: [
      {
        abi: erc20_abi,
        address: token,
        functionName: "symbol",
      },
      {
        abi: erc20_abi,
        address: token,
        functionName: "balanceOf",
        args: [account.address],
      },
      {
        abi: erc20_abi,
        address: token,
        functionName: "allowance",
        args: [account.address, permit2],
      },
      // {
      //   abi: registry_abi,
      //   address: registry,
      //   functionName: "latestVault",
      //   args: [token],
      // },
    ],
  });
  const symbol = multi_status ? results[0].result : null;
  const balance = multi_status ? results[1].result : null;
  const allowance = multi_status ? results[2].result : null;
  const vault = null; // multi_status ? results[3].result : null;

  const { data: read_2, isSuccess: read_2_status } = useReadContracts({
    contracts: [
      {
        abi: erc20_abi,
        address: vault,
        functionName: "symbol",
      },
      {
        abi: erc20_abi,
        address: vault,
        functionName: "balanceOf",
        args: [account.address],
      },
    ],
  });

  const vault_symbol = read_2_status ? read_2[0].result : null;
  const vault_balance = read_2_status ? read_2[1].result : null;

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
    set_user_tokens([]);
    async function fetch_user_tokens() {
      // check balances for all supported tokens
      let payload = supported_tokens.map((token) => ({
        address: token,
        abi: erc20_abi,
        functionName: "balanceOf",
        args: [account.address],
      }));
      const balances = await multicall(config, { contracts: payload });
      // filter by non-zero balances
      let token_balances = [];
      for (const [i, token] of supported_tokens.entries()) {
        if (balances[i].result != 0n) {
          token_balances.push({ address: token, balance: balances[i].result });
        }
      }
      // fetch additional metadata like symbol and decimals
      payload = token_balances
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
            address: registries[1],
            abi: registry_abi,
            functionName: "latestVault",
            args: [token.address],
          }))
        );
      const metadata = await multicall(config, { contracts: payload });
      const meta_balances = [];
      const skip = token_balances.length;
      for (const [i, token] of token_balances.entries()) {
        meta_balances.push({
          ...token,
          symbol: metadata[i].result,
          decimals: metadata[skip + i].result,
          vault: metadata[skip * 2 + i].result,
        });
      }
      set_user_tokens(meta_balances);
      console.log("fetched", meta_balances.length, "user balances");
    }
    fetch_user_tokens();
  }, [supported_tokens, account.address]);

  return (
    <div className="p-8 space-y-4 flex flex-col w-[40rem] mx-auto">
      <Logo />
      <div>
        {supported_tokens.length > 0 ? (
          <div className="text-xl">
            supports {supported_tokens.length} tokens
            {user_tokens.length > 0 ? (
              <>, you have {user_tokens.length} tokens</>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <Skeleton className="w-[280px] h-[28px]" />
        )}
      </div>
      <div>
        {/* <SelectToken
          tokens={user_tokens}
          on_select={(token) => set_selected_token(token)}
        /> */}
      </div>

      <SelectTokenB
        tokens={user_tokens}
        selected_token={selected_token}
        on_select={(token) => set_selected_token(token)}
      />

      <Separator />
      <div>
        {selected_token === null ? (
          <div className="text-xl text-slate-400">select a token first</div>
        ) : (
          <>
            <GrantApproval token={selected_token} />
          </>
        )}
      </div>

      <Separator />
      <SignPermit
        token={selected_token}
        spender={ypermit}
        setPermit={setPermit}
        permit={permit}
      />
      <Separator />
      <MakeDeposit />

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
        <h2>permit2 allowance</h2>
        <div>
          wrap:{" "}
          <TxButton
            label="wrap"
            payload={{
              abi: erc20_abi,
              address: token,
              functionName: "deposit",
              value: 10n ** 18n,
            }}
          ></TxButton>
        </div>
        <div>
          balance: {multi_status && formatEther(balance)} {symbol}
        </div>
        <div>allowance: {multi_status && formatEther(allowance)}</div>
        {allowance === 0n && (
          <TxButton
            label="approve"
            payload={{
              abi: erc20_abi,
              address: token,
              functionName: "approve",
              args: [permit2, maxUint256],
            }}
          ></TxButton>
        )}
        <div>vault: {multi_status && vault}</div>
        <div>
          vault balance: {read_2_status && formatEther(vault_balance)}{" "}
          {vault_symbol}
        </div>
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
      <ReactQueryDevtools initialIsOpen={false} />
      <Toaster />
    </div>
  );
}

export default App;
