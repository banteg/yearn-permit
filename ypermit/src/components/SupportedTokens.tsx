import { Rabbit } from "lucide-react";

export function LoadingBunny() {
  return (
    <Rabbit className="text-violet-500 inline animate-wiggle h-[1.5rem]" />
  );
}

export function SupportedTokens({
  registry_tokens,
  user_tokens,
}: {
  registry_tokens: bigint | null;
  user_tokens: number | null;
}) {
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
        <span>supports {registry_tokens.toString()} tokens, </span>
        <span className="text-violet-500">
          loading your tokens… <LoadingBunny />
        </span>
      </div>
    );
  }
  // 3. fully loaded
  return (
    <div className="text-xl">
      supports {registry_tokens.toString()} tokens, you have {user_tokens}{" "}
      tokens
    </div>
  );
}
