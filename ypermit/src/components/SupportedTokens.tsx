import { cn } from "@/lib/utils";
import { Text } from "@radix-ui/themes";
import { Rabbit } from "lucide-react";
import { useAccount } from "wagmi";

export function LoadingBunny({
  animation,
}: {
  animation?: "animate-wiggle" | "animate-hop";
}) {
  return (
    <div className="ml-1 -translate-y-[3px] inline-block">
      <Rabbit
        strokeWidth="1.6"
        className={cn(
          "text-violet-500 inline-block relative w-[1.5rem] h-[1.5rem]",
          animation
        )}
      />
    </div>
  );
}

export function SupportedTokens({
  registry_tokens,
  user_tokens,
}: {
  registry_tokens: bigint | null;
  user_tokens: number | null;
}) {
  const account = useAccount();
  // 1. loading from registry
  if (registry_tokens === null)
    return (
      <Text size="5" className="text-violet-500">
        loading from registry… <LoadingBunny animation="animate-hop" />
      </Text>
    );
  // 2. disconnected
  if (account.status === "disconnected") {
    return (
      <Text size="5">
        <span>supports {registry_tokens.toString()} tokens, </span>
        <span className="text-violet-500">
          connect wallet to load <LoadingBunny animation="animate-wiggle" />
        </span>
      </Text>
    );
  }
  // 3. loading user balances
  if (user_tokens === null) {
    return (
      <Text size="5">
        <span>supports {registry_tokens.toString()} tokens, </span>
        <span className="text-violet-500">
          loading your tokens… <LoadingBunny animation="animate-hop" />
        </span>
      </Text>
    );
  }
  // 4. fully loaded
  return (
    <>
      <Text size="5">
        supports {registry_tokens.toString()} tokens, you have {user_tokens}{" "}
        tokens
      </Text>
    </>
  );
}
