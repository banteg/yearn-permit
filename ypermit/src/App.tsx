import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20_abi, registry_abi, ypermit_abi, usdt_abi } from "./abi";
import { formatEther, maxUint256, formatUnits, maxUint96 } from "viem";
import { multicall } from "@wagmi/core";
import { Rabbit, Snail, Sparkle, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "./wagmi";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Separator } from "./components/ui/separator";
import { Toaster } from "./components/ui/sonner";
import {
  Flex,
  Text,
  Button,
  Container,
  Grid,
  Skeleton,
  Box,
  Card,
  Strong,
  Tooltip,
  Avatar,
  Callout,
  Code,
} from "@radix-ui/themes";
import { resolve } from "path";

const permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const registries = [
  "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804",
  "0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319",
];
const latest_registry = registries[registries.length - 1];
const ypermit = "0xf93b0549cD50c849D792f0eAE94A598fA77C7718";
const erc20_abi_overrides = {
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": usdt_abi,
};

interface Token {
  address?: string;
  balance?: bigint;
  allowance?: bigint;
  symbol?: string;
  decimals?: bigint;
  vault?: string;
  logo?: string;
}

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

function TokenCard({
  token,
  selected,
  on_select,
  loading,
}: {
  token: Token;
  selected: boolean;
  on_select: Function;
  loading: boolean;
}) {
  return (
    <Skeleton loading={loading}>
      <Card
        key={token.address}
        onClick={(e) => on_select(token)}
        className={cn("cursor-pointer", selected && "bg-slate-300")}
      >
        <Flex direction="column" gap="1">
          <Flex gap="2">
            <Avatar src={token.logo} size="1" radius="full"></Avatar>
            <Text>{token.symbol}</Text>
            <Box flexGrow="1"></Box>
            {token.allowance! >= maxUint96 && (
              <Tooltip content="gasless approval">
                <Sparkle
                  size="1.5rem"
                  strokeWidth="1"
                  className="text-green-500"
                />
              </Tooltip>
            )}
          </Flex>
          <Text truncate className="text-xs">
            {formatUnits(token.balance as bigint, token.decimals)}{" "}
            {token.symbol}
          </Text>
        </Flex>
      </Card>
    </Skeleton>
  );
}

function SelectToken({
  tokens,
  selected_token,
  on_select,
}: {
  tokens: Token[];
  selected_token: Token;
  on_select: Function;
}) {
  const account = useAccount();
  const is_loading_tokens = tokens === null;
  const tokens_to_render = tokens
    ? tokens
    : [...Array(4).entries()].map((i, e) => ({
        symbol: "YFI",
        balance: 0n,
        address: i,
      }));

  // 1. load balances and allowances
  const resp = useReadContracts({
    contracts:
      tokens === null
        ? []
        : tokens
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
            ),
  });
  if (tokens !== null && resp.isSuccess) {
    for (const [i, token] of tokens.entries()) {
      tokens_to_render[i] = {
        ...tokens[i],
        balance: resp.data[i].result,
        allowance: resp.data[tokens.length + i].result,
        logo: `https://assets.smold.app/api/token/1/${token.address}/logo.svg`,
      };
    }
  }

  return (
    <Grid columns="4" gap="2">
      {tokens_to_render.map((token) => (
        <TokenCard
          key={token.address}
          token={token}
          selected={selected_token && token.address == selected_token.address}
          loading={is_loading_tokens || resp.isFetching}
          on_select={on_select}
        />
      ))}
    </Grid>
  );
  return;
  // const account = useAccount();
  // console.log("account", account, account.address);

  // const payload = tokens
  //   .map((token) => ({
  //     address: token.address,
  //     abi: erc20_abi,
  //     functionName: "balanceOf",
  //     args: [account.address],
  //   }))
  // .concat(
  //   tokens.map((token) => ({
  //     address: token.address,
  //     abi: erc20_abi,
  //     functionName: "allowance",
  //     args: [account.address, permit2],
  //   }))
  //   );
  // console.log("tokens", tokens.length);
  // const resp = useReadContracts({ contracts: payload });
  // if (!resp.isSuccess) return;
  // const balances = resp.data?.slice(0, tokens.length).map((res) => res.result);
  // const allowances = resp.data
  //   ?.slice(tokens.length, tokens.length * 2)
  //   .map((res) => res.result);
  // console.log(balances);
  // console.log(allowances);
  // const data = [];
  // for (const [i, token] of tokens.entries()) {
  //   data.push({
  //     ...token,
  //     balance: resp.data[i].result,
  //     allowance: resp.data[tokens.length + i].result,
  //   });
  // }
  // console.log(data);

  // return (
  //   <div className="grid gap-2 grid-cols-4">
  //     {data.map((token) => (
  //       <div
  //         className={cn(
  //           "p-2 rounded-lg flex-1",
  //           selected_token && token.address === selected_token.address
  //             ? "border border-gray-300 bg-gray-200"
  //             : "border"
  //         )}
  //         key={token.address}
  //         onClick={(e) => on_select(token)}
  //       >
  //         <div className="flex space-x-2">
  //           {/* some tokens like uni limit max allowance to 96 bits */}
  //           {token.allowance >= maxUint96 ? (
  //             <Rabbit className="text-green-500 w-5" />
  //           ) : (
  //             <Snail className="text-red-500 w-5" />
  //           )}
  //           <div>{token.symbol}</div>
  //         </div>
  //         <div className="text-xs text-gray-500 overflow-auto">
  //           {formatUnits(token.balance, token.decimals)}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // );
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

export function GrantApproval({ token }) {
  if (token === null) return;
  const account = useAccount();
  if (!account.isConnected) return;
  const allowance = useReadContract({
    address: token.address,
    abi: erc20_abi,
    functionName: "allowance",
    args: [account.address, permit2],
  });
  if (!allowance.isSuccess) return;
  if (allowance.data == 0n) {
    return (
      <Flex direction="column" gap="4">
        <Callout.Root color="red" variant="soft">
          <Callout.Icon>
            <Snail size="1.3rem" />
          </Callout.Icon>
          <Callout.Text>
            <Flex direction="column" gap="">
              <Strong>{token.symbol} needs approval</Strong>
              <Text>
                approve permit2 once to get gasless approvals across all
                supported contracts
              </Text>
            </Flex>
          </Callout.Text>
        </Callout.Root>
        <Flex gap="2" className="items-baseline">
          <TxButton
            label="approve"
            payload={{
              abi: erc20_abi_overrides[token.address] ?? erc20_abi,
              address: token.address,
              functionName: "approve",
              args: [permit2, maxUint256],
            }}
          ></TxButton>
          <Code>{token.symbol}.approve(<a href={`https://etherscan.io/address/${permit2}`} target="_blank">permit2</a>, max_uint256)</Code>
        </Flex>
      </Flex>
    );
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
        <GrantApproval token={selected_token} />

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
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
      </Flex>
    </Container>
  );
}

export default App;
