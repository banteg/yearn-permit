import { Callout, Strong, Text } from "@radix-ui/themes";

export function MyCallout({ color, icon, title, description }) {
  return (
    <Callout.Root color={color} variant="soft">
      <Callout.Icon>{icon}</Callout.Icon>
      <Callout.Text as="div" truncate>
        <Text as="p">
          <Strong>{title}</Strong>
        </Text>
        <Text truncate as="p">{description}</Text>
      </Callout.Text>
    </Callout.Root>
  );
}
