import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Basket, Storefront } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { RegisterPayload, UserRole } from "@/lib/api/auth";
import { useSignupLocations } from "@/lib/queries/locations";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionLabel } from "@/components/ui/list-group";
import { TextLink } from "@/components/ui/text-link";
import { LogoTile } from "@/components/brand/logo-tile";

const ROLES: {
  key: UserRole;
  label: string;
  hint: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    key: "citizen",
    label: "Citizen",
    hint: "Claim relief",
    icon: (active) => (
      <Basket
        size={22}
        color={active ? PH_COLORS.white : PH_COLORS.blue}
        weight="duotone"
      />
    ),
  },
  {
    key: "merchant",
    label: "Merchant",
    hint: "Release goods",
    icon: (active) => (
      <Storefront
        size={22}
        color={active ? PH_COLORS.white : PH_COLORS.blue}
        weight="duotone"
      />
    ),
  },
];

export default function Register() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [locationId, setLocationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const locations = useSignupLocations(role === "merchant");

  function fieldError(key: string) {
    return fieldErrors[key]?.[0];
  }

  const mismatch = confirm.length > 0 && password !== confirm;

  async function onSubmit() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        name,
        username: username || undefined,
        email: email.trim(),
        password,
        password_confirmation: confirm,
        role,
        phone: phone || undefined,
      };
      if (role === "merchant") payload.location_id = locationId ?? undefined;

      await signUp(payload);
      router.replace("/");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.errors) setFieldErrors(e.errors);
      } else {
        setError("Unable to create your account.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="mt-4 items-center gap-3">
        <LogoTile size={66} radius={21} mark={44} />
        <View className="items-center gap-0.5">
          <Text className="text-[24px] font-bold leading-tight text-foreground">
            Create account
          </Text>
          <Text className="text-center text-[13px] text-muted-foreground">
            Join Agapay to access relief programs.
          </Text>
        </View>
      </View>

      <SectionLabel>I am a</SectionLabel>
      <View className="flex-row gap-3">
        {ROLES.map((r) => {
          const active = role === r.key;

          return (
            <Pressable
              key={r.key}
              onPress={() => setRole(r.key)}
              android_ripple={null}
              className={cn(
                "flex-1 items-center gap-2 rounded-3xl border p-4 active:opacity-80",
                active ? "border-primary bg-primary" : "border-border bg-card",
              )}
            >
              <View
                className={cn(
                  "h-11 w-11 items-center justify-center rounded-2xl",
                  active ? "bg-white/15" : "bg-secondary",
                )}
              >
                {r.icon(active)}
              </View>
              <View className="items-center">
                <Text
                  className={cn(
                    "text-[15px] font-bold",
                    active ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {r.label}
                </Text>
                <Text
                  className={cn(
                    "text-[11px]",
                    active ? "text-white/70" : "text-muted-foreground",
                  )}
                >
                  {r.hint}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Your details</SectionLabel>
      <View className="gap-3 rounded-3xl border border-border bg-card p-4">
        <Field label="Full name" error={fieldError("name")}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Juan Dela Cruz"
          />
        </Field>
        <Field label="Username" error={fieldError("username")}>
          <Input
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="juandc"
          />
        </Field>
        <Field label="Email" error={fieldError("email")}>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Mobile" error={fieldError("phone")}>
          <Input
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="09xxxxxxxxx"
          />
        </Field>
      </View>

      {role === "merchant" ? (
        <>
          <SectionLabel>Assigned store</SectionLabel>
          {locations.isLoading ? (
            <Skeleton className="h-40 w-full rounded-3xl" />
          ) : (
            <View className="overflow-hidden rounded-3xl border border-border bg-card">
              {(locations.data ?? []).map((loc, index, all) => {
                const active = locationId === loc.id;

                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => setLocationId(loc.id)}
                    android_ripple={null}
                    className={cn(
                      "flex-row items-center gap-3 px-4 py-3.5 active:opacity-70",
                      index !== all.length - 1 && "border-b border-border",
                      active && "bg-secondary",
                    )}
                  >
                    <View
                      className={cn(
                        "h-5 w-5 items-center justify-center rounded-full border-2",
                        active ? "border-primary" : "border-border",
                      )}
                    >
                      {active ? (
                        <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-foreground">
                        {loc.name}
                      </Text>
                      <Text className="text-[12px] text-muted-foreground">
                        {loc.type === "kadiwa_store"
                          ? "Kadiwa store"
                          : "Gas station"}
                        {loc.barangay ? ` · ${loc.barangay}` : ""}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
          {fieldError("location_id") ? (
            <Text className="text-[13px] text-destructive">
              {fieldError("location_id")}
            </Text>
          ) : null}
        </>
      ) : null}

      <SectionLabel>Password</SectionLabel>
      <View className="gap-3 rounded-3xl border border-border bg-card p-4">
        <Field label="Password" error={fieldError("password")}>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
          />
        </Field>
        <Field
          label="Confirm password"
          error={mismatch ? "Passwords do not match." : undefined}
        >
          <Input
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Re-enter your password"
          />
        </Field>
      </View>

      {error ? (
        <View className="rounded-3xl p-4" style={{ backgroundColor: "#fce8ea" }}>
          <Text className="text-[13px] font-semibold text-destructive">
            {error}
          </Text>
        </View>
      ) : null}

      <Button
        label="Create account"
        onPress={onSubmit}
        loading={loading}
        disabled={
          !name.trim() ||
          !email.trim() ||
          !password ||
          !confirm ||
          mismatch ||
          (role === "merchant" && locationId === null)
        }
      />

      <View className="items-center py-1">
        <TextLink href="/(auth)/login">I already have an account</TextLink>
      </View>
    </Screen>
  );
}
