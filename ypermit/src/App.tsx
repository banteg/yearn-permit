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

function TxButton({ token }) {
  const query_client = useQueryClient()
  const { data, isPending, writeContract } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: data });
  async function submit() {
    writeContract({
      abi: erc20_abi,
      address: token,
      functionName: "deposit",
      value: 10n ** 18n,
    });
  }
  useEffect(() => {
    if (!isSuccess) return
    query_client.invalidateQueries()
  }, [isSuccess])
  return (
    <>
      <button onClick={submit} disabled={isPending || isLoading}>
        wrap
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
  const { data: results, status: multi_status } = useReadContracts({
    contracts: [
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
      {
        abi: erc20_abi,
        address: token,
        functionName: "symbol",
      },
    ],
  });

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
          token: {multi_status === "success" && results[3].result?.toString()}
        </div>
        <div>
          wrap: <TxButton token={token}></TxButton>
        </div>
        <div>
          balance: {multi_status === "success" && results[0].result?.toString()}
        </div>
        <div>
          allowance:{" "}
          {multi_status === "success" && results[1].result?.toString()}
        </div>
        <div>
          vault: {multi_status === "success" && results[2].result?.toString()}
        </div>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
