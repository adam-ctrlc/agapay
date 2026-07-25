import { useState } from "react";
import { Pressable, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { At, CaretRight, Lock, MapTrifold, Tag } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Field } from "@/components/ui/field";
import { IconInput } from "@/components/ui/icon-input";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/list-group";
import { TextLink } from "@/components/ui/text-link";
import { LogoTile } from "@/components/brand/logo-tile";

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-8 items-center gap-3">
        <LogoTile size={84} radius={26} mark={56} />
        <View className="items-center gap-0.5">
          <Text variant="title">AyudaLock</Text>
          <Text variant="subtitle" className="text-center">
            The Last-Mile Relief Engine
          </Text>
        </View>
      </View>

      <View className="mt-8 gap-4">
        <View className="gap-0.5">
          <Text variant="heading">Sign in</Text>
          <Text variant="caption">Access your relief programs.</Text>
        </View>

        <Field label="Email or username" error={error}>
          <IconInput
            icon={<At size={20} color={PH_COLORS.mutedForeground} />}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com or username"
          />
        </Field>

        <Field label="Password">
          <IconInput
            icon={<Lock size={20} color={PH_COLORS.mutedForeground} />}
            togglePassword
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            placeholder="Your password"
          />
        </Field>

        <Button
          label="Sign in"
          onPress={onSubmit}
          loading={loading}
          disabled={!identifier.trim() || !password}
        />

        <View className="flex-row items-center justify-center gap-1">
          <Text variant="caption">New to AyudaLock?</Text>
          <TextLink href="/(auth)/register">Create an account</TextLink>
        </View>
      </View>

      <SectionLabel>No account needed</SectionLabel>
      <View className="overflow-hidden rounded-3xl border border-border bg-card">
        <Link href="/(auth)/prices" asChild>
          <Pressable
            android_ripple={null}
            className="flex-row items-center gap-3 border-b border-border px-4 py-3.5 active:opacity-70"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#fdf1cf" }}
            >
              <Tag size={20} color="#8a6800" weight="duotone" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-foreground">
                Price Watch
              </Text>
              <Text className="text-[12px] text-muted-foreground">
                Fuel, fare, and market prices today
              </Text>
            </View>
            <CaretRight size={16} color={PH_COLORS.mutedForeground} />
          </Pressable>
        </Link>

        <Link href="/(auth)/impact" asChild>
          <Pressable
            android_ripple={null}
            className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#fce8ea" }}
            >
              <MapTrifold size={20} color={PH_COLORS.red} weight="duotone" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-foreground">
                Impact map
              </Text>
              <Text className="text-[12px] text-muted-foreground">
                Live hazards, rainfall, and brownouts by province
              </Text>
            </View>
            <CaretRight size={16} color={PH_COLORS.mutedForeground} />
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
