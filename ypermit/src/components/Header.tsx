import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";

export function Logo() {
  const account = useAccount();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const ens = useEnsName({ address: account.address });

  return (
    <Flex gap="2" className="items-baseline">
      <Box className="translate-y-[2px]">
        <Rabbit className="h-[32px] mr-1 -translate-y-[2px] inline relative" />
        <Text size="6">yearn</Text>
      </Box>
      {account.status === "connected" ? (
        <>
          <Button
            variant="soft"
            size="1"
            onClick={() => disconnect.disconnect()}
          >
            disconnect
          </Button>
        </>
      ) : (
        connect.connectors.map((connector) => (
          <Button
            variant="soft"
            size="1"
            key={connector.uid}
            onClick={() => connect.connect({ connector })}
          >
            {connector.name.toLowerCase()}
          </Button>
        ))
      )}
      <Box flexGrow="1" />
      <Text size="1">{ens.data ? ens.data : account.address}</Text>
    </Flex>
  );
}
