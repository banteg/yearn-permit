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
import { permit2_abi, erc20_abi, registry_abi, ypermit_abi } from "./abi";
import { formatEther, maxUint256, formatUnits } from "viem";
import { Button, ButtonLoading } from "@/components/ui/button";
import { call, multicall, readContract } from "@wagmi/core";
import { Check, ChevronsUpDown } from "lucide-react";
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

function TxButton({ label, payload }) {
  const query_client = useQueryClient();
  const { data, isPending, writeContract } = useWriteContract();
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
      <button
        onClick={submit}
        disabled={isPending || isLoading}
        className="border-2 border-slate-600 p-1 bg-slate-200"
      >
        {label}
      </button>
    </>
  );
}

export function SelectToken({ tokens }) {
  return (
    <>
      <Command>
        <CommandInput placeholder="select token to deposit" />
        <CommandList>
          {tokens.map((token) => (
            <CommandItem>
              <span>{token.symbol}</span>
              <CommandShortcut>{token.balance_fmt}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </>
  );
}

function App() {
  const permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
  const registries = [
    "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
    "0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319",
  ];
  const ypermit = "0xf93b0549cD50c849D792f0eAE94A598fA77C7718";

  const [supported_tokens, set_supported_tokens] = useState([]); // [address]
  const [user_tokens, set_user_tokens] = useState([]); // [{token: address, balance: uint}]

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

  const deadline = BigInt(parseInt(new Date().valueOf() / 1000 + 86400));

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
    },
  });

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
          token_balances.push({ token: token, balance: balances[i].result });
        }
      }
      // fetch additional metadata like symbol and decimals
      payload = token_balances
        .map((token) => ({
          address: token.token,
          abi: erc20_abi,
          functionName: "symbol",
        }))
        .concat(
          token_balances.map((token) => ({
            address: token.token,
            abi: erc20_abi,
            functionName: "decimals",
          }))
        );
      const metadata = await multicall(config, { contracts: payload });
      const meta_balances = [];
      for (const [i, token] of token_balances.entries()) {
        const decimals = metadata[token_balances.length + i].result;
        meta_balances.push({
          ...token,
          symbol: metadata[i].result,
          decimals: decimals,
          balance_fmt: formatUnits(token.balance, decimals),
        });
      }
      set_user_tokens(meta_balances);
      console.log("fetched", meta_balances.length, "user balances");
    }
    fetch_user_tokens();
  }, [supported_tokens, account.address]);

  return (
    <div className="p-8 space-y-4 flex flex-col w-[40rem] mx-auto">
      <div>
        <h2 className="text-3xl">block {block?.toString()}</h2>
        <div className="text-xl">
          supports {supported_tokens.length} tokens, you have{" "}
          {user_tokens.length} tokens
        </div>
      </div>
      <div>
        <SelectToken tokens={user_tokens} />
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
        <h2>sign permit2</h2>
        <pre>{permit.toString()}</pre>
        <div>
          <button
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
                  permitted: { token: token, amount: 10n ** 18n },
                  spender: ypermit,
                  nonce: deadline,
                  deadline: deadline,
                },
              })
            }
          >
            permit
          </button>
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
    </div>
  );
}

export default App;
