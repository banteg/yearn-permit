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
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { permit2_abi, erc20_abi, registry_abi } from "./abi";
import { formatEther, maxUint256 } from "viem";

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
      <button onClick={submit} disabled={isPending || isLoading}>
        {label}
      </button>
    </>
  );
}

function App() {
  const permit2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
  const registry = "0xaF1f5e1c19cB68B30aAD73846eFfDf78a5863319";

  const account = useAccount();
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
      {
        abi: registry_abi,
        address: registry,
        functionName: "latestVault",
        args: [token],
      },
    ],
  });
  const symbol = multi_status ? results[0].result : null;
  const balance = multi_status ? results[1].result : null;
  const allowance = multi_status ? results[2].result : null;
  const latest_vault = multi_status ? results[3].result : null;

  return (
    <>
      <div>
        <h2>block {block?.toString()}</h2>
      </div>
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
        <div>vault: {multi_status && latest_vault}</div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;