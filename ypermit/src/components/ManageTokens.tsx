import { useYpermit } from "@/constants/addresses";
import type { Permit, Token } from "@/types";
import { useMemo } from "react";
import { maxUint96 } from "viem";
import { GrantApproval } from "./GrantApproval";
import { MakeDeposit } from "./MakeDeposit";
import { MakeWithdraw } from "./MakeWithdraw";
import { SelectToken } from "./SelectToken";
import { SignPermit } from "./SignPermit";

type ManageTokensProps = {
  tokens?: Token[];
  selected_token?: Token;
  permit: Permit | null;
  set_permit: (permit: Permit | null) => void;
  set_selected: (token: Token) => void;
  busy: boolean;
  set_busy: (busy: boolean) => void;
};

export function ManageTokens({
  tokens,
  selected_token,
  permit,
  set_permit,
  set_selected,
  busy,
  set_busy,
}: ManageTokensProps) {
  const ypermit = useYpermit();
  const selected_here = useMemo(
    () => tokens?.find((token) => token.vault === selected_token?.vault),
    [tokens, selected_token],
  );
  const is_approved = selected_token && selected_token.permit2_allowance >= maxUint96;
  const has_token_balance = selected_token && selected_token.token_balance > 1n;
  const is_depositable = permit !== null;
  const is_withdrawable = selected_token && selected_token.vault_balance > 1n;

  return (
    <>
      <SelectToken
        tokens={tokens}
        selected_token={selected_token}
        on_select={(token: Token) => set_selected(token)}
        busy={busy}
      />
      {selected_here && selected_token && (
        <>
          {!is_approved && <GrantApproval token={selected_token} busy={busy} set_busy={set_busy} />}
          {is_approved && has_token_balance && (
            <SignPermit token={selected_token} spender={ypermit} permit={permit} set_permit={set_permit} busy={busy} />
          )}
          {is_depositable && (
            <MakeDeposit
              token={selected_token}
              permit={permit}
              set_permit={set_permit}
              busy={busy}
              set_busy={set_busy}
            />
          )}
          {is_withdrawable && <MakeWithdraw token={selected_token} busy={busy} set_busy={set_busy} />}
        </>
      )}
    </>
  );
}
