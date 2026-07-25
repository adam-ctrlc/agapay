import { Pressable, View } from "react-native";
import { Link, type Href } from "expo-router";

import { Text } from "@/components/ui/text";

export function ActionTile({
  href,
  icon,
  label,
  tint,
}: {
  href: Href;
  icon: React.ReactNode;
  label: string;
  tint: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable className="flex-1 gap-2 active:opacity-70">
        <View
          className="h-16 w-full items-center justify-center rounded-3xl"
          style={{ backgroundColor: tint }}
        >
          {icon}
        </View>
        <Text
          numberOfLines={1}
          className="text-center text-[11px] font-semibold text-foreground"
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}
