import { Box, Button, TextField } from "@radix-ui/themes";

export function InputAmount({
  amount,
  set_amount,
  busy = false,
}: {
  amount: string;
  set_amount: Function;
  busy: boolean;
}) {
  return (
    <Box>
      <TextField.Root size="3" className="w-60" value={amount} onChange={(e) => set_amount(e.target.value)}>
        <TextField.Slot side="right" px="1">
          <Button onClick={() => set_amount("max")} disabled={busy}>
            max
          </Button>
        </TextField.Slot>
      </TextField.Root>
    </Box>
  );
}
