import { Box, Button, Text, TextField } from "@radix-ui/themes";

export function InputAmount({
  label,
  amount,
  set_amount,
  busy = false,
}: {
  label: string;
  amount: string;
  set_amount: Function;
  busy: bool;
}) {
  return (
    <Box>
      <Text>{label}</Text>
      <TextField.Root
        placeholder={label}
        size="3"
        className="w-60"
        value={amount}
        onChange={(e) => set_amount(e.target.value)}
      >
        <TextField.Slot side="right" px="1">
          <Button onClick={() => set_amount("max")} disabled={busy}>
            max
          </Button>
        </TextField.Slot>
      </TextField.Root>
    </Box>
  );
}
