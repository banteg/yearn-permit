import { Callout, Skeleton, Strong, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

export function MyCallout({
  color,
  icon,
  title,
  description,
  loading = false,
}: {
  color: string;
  icon: ReactNode;
  title: ReactNode;
  description: string;
  loading?: boolean;
}) {
  return (
    <Skeleton loading={loading}>
      {/* @ts-ignore */}
      <Callout.Root color={color} variant="soft">
        <Callout.Icon>{icon}</Callout.Icon>
        {/* @ts-ignore */}
        <Callout.Text as="div">
          <Text as="p">
            <Strong>{title}</Strong>
          </Text>
          <Text as="p" className="whitespace-pre-wrap">
            {description}
          </Text>
        </Callout.Text>
      </Callout.Root>
    </Skeleton>
  );
}
