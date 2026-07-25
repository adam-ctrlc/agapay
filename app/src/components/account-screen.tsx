import { useState } from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Edge } from "react-native-safe-area-context";
import {
  CalendarBlank,
  ClockCounterClockwise,
  IdentificationBadge,
  Lock,
  SignOut,
} from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/auth";
import { deleteAccount, updatePassword, updateProfile } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/context";
import { useIncidentReports } from "@/lib/queries/incident-reports";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { IconInput } from "@/components/ui/icon-input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog";
import {
  ActionRow,
  Group,
  Row,
  SectionLabel,
} from "@/components/ui/list-group";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { MyReports } from "@/components/reports/my-reports";

const HEADER_COLORS = ["#0b2f8f", "#0038a8", "#1a5ee0"] as const;

type AccountTab = "profile" | "reports";

const ACCOUNT_TABS: SegmentedOption<AccountTab>[] = [
  { key: "profile", label: "Personal info" },
  { key: "reports", label: "My reports" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  citizen: "Citizen",
  merchant: "Merchant",
  lgu_admin: "LGU Admin",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function dateLabel(iso: string | null | undefined) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AccountScreen({
  title,
  edges = [],
}: {
  title?: string;
  edges?: Edge[];
}) {
  const { user, signOut, updateUser } = useAuth();
  const dialog = useDialog();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [middleName, setMiddleName] = useState(user?.middle_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [tab, setTab] = useState<AccountTab>("profile");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [editingPassword, setEditingPassword] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const name = user?.name ?? "-";
  const roleLabel = ROLE_LABELS[user?.role ?? "citizen"];

  /**
   * Only citizens can file reports, so the other roles keep a single-pane
   * account rather than a tab that could only ever be empty.
   */
  const canReport = user?.role === "citizen";
  const showReports = canReport && tab === "reports";

  const reports = useIncidentReports({}, canReport);

  function cancelProfile() {
    setFirstName(user?.first_name ?? "");
    setMiddleName(user?.middle_name ?? "");
    setLastName(user?.last_name ?? "");
    setPhone(user?.phone ?? "");
    setEmail(user?.email ?? "");
    setEditingProfile(false);
  }

  async function onSaveProfile() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      dialog.alert("First name, last name, and email are required.");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });
      updateUser(updated);
      setEditingProfile(false);
      dialog.alert({ title: "Saved", message: "Your profile has been updated." });
    } catch (e) {
      dialog.alert({
        title: "Could not save",
        message: e instanceof ApiError ? e.message : "Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  function cancelPassword() {
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setEditingPassword(false);
  }

  async function onChangePassword() {
    if (!currentPw || !newPw) {
      dialog.alert("Enter your current and new password.");
      return;
    }
    if (newPw !== confirmPw) {
      dialog.alert("Your new passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await updatePassword({
        current_password: currentPw,
        password: newPw,
        password_confirmation: confirmPw,
      });
      cancelPassword();
      dialog.alert({
        title: "Password updated",
        message: "Use it the next time you sign in.",
      });
    } catch (e) {
      dialog.alert({
        title: "Could not update",
        message: e instanceof ApiError ? e.message : "Please try again.",
      });
    } finally {
      setSavingPw(false);
    }
  }

  async function onDeleteAccount() {
    const ok = await dialog.confirm({
      title: "Delete account?",
      message: "This permanently removes your account. This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteAccount();
      await signOut();
    } catch (e) {
      dialog.alert({
        title: "Could not delete",
        message: e instanceof ApiError ? e.message : "Please try again.",
      });
    }
  }

  async function onSignOut() {
    const ok = await dialog.confirm({
      title: "Sign out?",
      message:
        "You will need your email and password to get back in. Anything queued on this device stays saved.",
      confirmLabel: "Sign out",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (!ok) return;

    /**
     * No router.replace here. Clearing the session flips RoleGate to its
     * Redirect, which unmounts this tab navigator. Racing an imperative
     * navigation against that is what threw "action REPLACE with payload
     * {name: 'index'} was not handled by any navigator".
     */
    await signOut();
  }

  return (
    <Screen
      edges={edges}
      refreshing={showReports && reports.isRefetching}
      onRefresh={showReports ? () => reports.refetch() : undefined}
    >
      {title ? (
        <Text className="pt-1 text-[28px] font-bold leading-tight text-foreground">
          {title}
        </Text>
      ) : null}

      <LinearGradient
        colors={HEADER_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, overflow: "hidden" }}
      >
        <View
          pointerEvents="none"
          className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10"
        />
        <View className="flex-row items-center gap-4 p-5">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Text className="text-xl font-bold text-white">
              {initialsOf(name)}
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold text-white" numberOfLines={1}>
              {name}
            </Text>
            {user?.username ? (
              <Text className="text-[13px] text-white/70">
                @{user.username}
              </Text>
            ) : null}
            <View className="mt-0.5 self-start rounded-full bg-white/20 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-white">
                {roleLabel}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {canReport ? (
        <Segmented
          value={tab}
          onChange={(next) => setTab(next)}
          options={ACCOUNT_TABS}
        />
      ) : null}

      {showReports ? <MyReports /> : null}

      {showReports ? null : (
        <>
      <SectionLabel
        action={
          editingProfile ? undefined : (
            <Pressable hitSlop={8} onPress={() => setEditingProfile(true)}>
              <Text className="text-[13px] font-bold text-primary">Edit</Text>
            </Pressable>
          )
        }
      >
        Personal details
      </SectionLabel>

      {editingProfile ? (
        <View className="gap-3 rounded-3xl border border-border bg-card p-4">
          <Field label="First name">
            <Input
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
            />
          </Field>
          <Field label="Middle name">
            <Input
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Middle name (optional)"
            />
          </Field>
          <Field label="Last name">
            <Input
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
            />
          </Field>
          <Field label="Mobile number">
            <Input
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="09xxxxxxxxx"
            />
          </Field>
          <Field label="Email address">
            <Input
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
          </Field>

          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              label="Cancel"
              onPress={cancelProfile}
            />
            <Button
              className="flex-1"
              label="Save"
              loading={savingProfile}
              disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
              onPress={onSaveProfile}
            />
          </View>
        </View>
      ) : (
        <Group>
          <Row label="First name" value={user?.first_name || "Not set"} />
          <Row label="Middle name" value={user?.middle_name || "Not set"} />
          <Row label="Last name" value={user?.last_name || "Not set"} />
          <Row label="Mobile" value={user?.phone || "Not set"} />
          <Row label="Email" value={user?.email || "Not set"} last />
        </Group>
      )}

      <SectionLabel>Identity</SectionLabel>
      <Group>
        <Row
          icon={
            <IdentificationBadge
              size={19}
              color={PH_COLORS.mutedForeground}
              weight="duotone"
            />
          }
          label="Role"
          value={roleLabel}
        />
        <Row
          icon={
            <CalendarBlank
              size={19}
              color={PH_COLORS.mutedForeground}
              weight="duotone"
            />
          }
          label="Member since"
          value={dateLabel(user?.created_at)}
        />
        <Row
          icon={
            <ClockCounterClockwise
              size={19}
              color={PH_COLORS.mutedForeground}
              weight="duotone"
            />
          }
          label="Last updated"
          value={dateLabel(user?.updated_at)}
          last
        />
      </Group>

      <SectionLabel>Security</SectionLabel>

      {editingPassword ? (
        <View className="gap-3 rounded-3xl border border-border bg-card p-4">
          <Field label="Current password">
            <IconInput
              icon={<Lock size={20} color={PH_COLORS.mutedForeground} />}
              togglePassword
              value={currentPw}
              onChangeText={setCurrentPw}
              autoCapitalize="none"
              placeholder="Your current password"
            />
          </Field>
          <Field label="New password">
            <IconInput
              icon={<Lock size={20} color={PH_COLORS.mutedForeground} />}
              togglePassword
              value={newPw}
              onChangeText={setNewPw}
              autoCapitalize="none"
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm new password">
            <IconInput
              icon={<Lock size={20} color={PH_COLORS.mutedForeground} />}
              togglePassword
              value={confirmPw}
              onChangeText={setConfirmPw}
              autoCapitalize="none"
              placeholder="Re-enter new password"
            />
          </Field>
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              label="Cancel"
              onPress={cancelPassword}
            />
            <Button
              className="flex-1"
              label="Update"
              loading={savingPw}
              disabled={!currentPw || !newPw || !confirmPw}
              onPress={onChangePassword}
            />
          </View>
        </View>
      ) : (
        <Group>
          <ActionRow
            icon={<Lock size={19} color={PH_COLORS.blue} weight="duotone" />}
            label="Change password"
            onPress={() => setEditingPassword(true)}
          />
          <ActionRow
            icon={
              <SignOut
                size={19}
                color={PH_COLORS.mutedForeground}
                weight="duotone"
              />
            }
            label="Sign out"
            onPress={onSignOut}
            last
          />
        </Group>
      )}

      <Pressable
        onPress={onDeleteAccount}
        android_ripple={null}
        className="items-center py-2 active:opacity-60"
      >
        <Text className="text-[13px] font-semibold text-destructive">
          Delete my account
        </Text>
      </Pressable>

      <Text className="pb-2 text-center text-[11px] text-muted-foreground">
        Deleting removes your account and all related records permanently.
      </Text>
        </>
      )}
    </Screen>
  );
}
