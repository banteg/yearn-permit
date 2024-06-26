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
        <Flex gap="1" className="items-baseline">
          <Rabbit className="h-[32px] translate-y-[10px] inline-block relative" />
          <Text size="6" as="span">
            yearn
          </Text>
        </Flex>
      </Box>
      <Flex gap="2">
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
      </Flex>
      <Box flexGrow="1" />
      <Text size="1" truncate>
        {ens.data ? ens.data : account.address}
      </Text>
    </Flex>
  );
}
