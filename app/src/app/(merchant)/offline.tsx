import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckCircle, CloudArrowUp, Lightning, Trash, WarningCircle } from "phosphor-react-native";

import type { BatchItem, BatchResult } from "@/lib/api/redemptions";
import { useOfflineSync } from "@/lib/queries/redemptions";
import { useVoucherKey } from "@/lib/queries/voucher-key";
import { tokenFromQrPayload, verifyVoucherToken } from "@/lib/voucher/verify";
import { uuidv4 } from "@/lib/uuid";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
import { StatTile } from "@/components/dashboard/stat-tile";
import { ScannerFrame } from "@/components/merchant/scanner-frame";
import {
  SCAN_MODES,
  manualPlaceholder,
  type ScanMode,
} from "@/components/merchant/scan-modes";

type Tag = "verified" | "expired" | "unverified";

type QueuedItem = BatchItem & { tag: Tag };

const QUEUE_KEY = "ayudalock.offline_queue";

const TAG_LABELS: Record<Tag, string> = {
  verified: "signature verified",
  expired: "expired",
  unverified: "unverified",
};

function resultVariant(status: BatchResult["status"]) {
  switch (status) {
    case "accepted":
      return "success" as const;
    case "duplicate":
      return "muted" as const;
    default:
      return "destructive" as const;
  }
}

function tagVariant(tag: Tag) {
  switch (tag) {
    case "verified":
      return "success" as const;
    case "expired":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

export default function MerchantOffline() {
  const [mode, setMode] = useState<ScanMode>("scan");
  const [value, setValue] = useState("");
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const sync = useOfflineSync();
  const voucherKey = useVoucherKey();
  const dialog = useDialog();

  useEffect(() => {
    AsyncStorage.getItem(QUEUE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setQueue(JSON.parse(raw) as QueuedItem[]);
          } catch {
            // ignore corrupted storage
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue, hydrated]);

  function enqueue(item: BatchItem, tag: Tag) {
    setQueue((q) => [...q, { ...item, tag }]);
  }

  async function addToken(raw: string) {
    const token = tokenFromQrPayload(raw);

    if (token === null) {
      setError("That QR code is not a voucher.");
      return;
    }

    const result = await verifyVoucherToken(token, voucherKey.data ?? null);

    switch (result.status) {
      case "verified":
        enqueue(
          { client_uuid: uuidv4(), redeemed_at: new Date().toISOString(), token },
          "verified",
        );
        setNotice(
          `Signature verified offline. Voucher #${result.payload.aid}, expires ${new Date(result.payload.exp * 1000).toLocaleTimeString()}.`,
        );
        setError(null);
        return;
      case "expired":
        setError(
          `This voucher expired at ${new Date(result.payload.exp * 1000).toLocaleTimeString()}. It cannot be redeemed.`,
        );
        setNotice(null);
        return;
      case "invalid_signature":
        setError("Invalid signature. This voucher was not issued by AyudaLock.");
        setNotice(null);
        return;
      case "malformed":
        setError("That code is not a readable voucher.");
        setNotice(null);
        return;
      case "no_key":
        enqueue(
          { client_uuid: uuidv4(), redeemed_at: new Date().toISOString(), token },
          "unverified",
        );
        setNotice("Queued without verification: no signing key cached yet.");
        setError(null);
        return;
    }
  }

  function addSmsCode(code: string) {
    enqueue(
      { client_uuid: uuidv4(), redeemed_at: new Date().toISOString(), sms_code: code },
      "unverified",
    );
    setNotice("SMS codes are confirmed by the server at sync.");
    setError(null);
  }

  async function onManualAdd() {
    const v = value.trim();

    switch (mode) {
      case "sms":
        addSmsCode(v);
        break;
      default:
        await addToken(v);
        break;
    }

    setValue("");
  }

  async function onScan(data: string) {
    if (scanned) return;
    setScanned(true);
    await addToken(data);
  }

  function toBatchItems(items: QueuedItem[]): BatchItem[] {
    return items.map(({ tag: _tag, ...item }) => item);
  }

  const keyReady = voucherKey.data != null;
  const verifiedCount = queue.filter((q) => q.tag === "verified").length;

  return (
    <Screen>
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Offline queue
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Capture redemptions during a brownout, then sync when back online.
        </Text>
      </View>

      <View
        className="flex-row items-center gap-3 rounded-3xl p-4"
        style={{ backgroundColor: keyReady ? "#e1f3ec" : "#fdf1cf" }}
      >
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: keyReady ? "#c7e6d7" : "#f6e3ab" }}
        >
          <Lightning
            size={20}
            color={keyReady ? PH_COLORS.success : "#8a6800"}
            weight="fill"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">
            {keyReady ? "Offline verification ready" : "Signing key not cached"}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {keyReady
              ? "QR vouchers verify on this device without a connection."
              : "Connect once to cache the key, then you can verify offline."}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <StatTile value={String(queue.length)} label="Queued" tint="#e8effb" />
        <StatTile
          value={String(verifiedCount)}
          label="Verified"
          tint="#e1f3ec"
          color={PH_COLORS.success}
        />
        <StatTile
          value={String(queue.length - verifiedCount)}
          label="Unverified"
          tint="#f1f3f6"
        />
      </View>

      <SectionLabel>Add a redemption</SectionLabel>
      <Segmented
        value={mode}
        onChange={(next) => {
          setMode(next);
          setScanned(false);
          setError(null);
          setNotice(null);
        }}
        options={SCAN_MODES}
      />

      {mode === "scan" ? (
        <>
          <ScannerFrame
            height={256}
            paused={scanned}
            caption={
              scanned
                ? undefined
                : "Point the camera at the citizen's voucher QR."
            }
            onScan={onScan}
          />
          {scanned ? (
            <Button
              variant="outline"
              label="Scan another"
              onPress={() => {
                setScanned(false);
                setError(null);
                setNotice(null);
              }}
            />
          ) : null}
        </>
      ) : (
        <View className="flex-row gap-2 rounded-[28px] border border-border bg-card p-4">
          <Input
            className="flex-1"
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            keyboardType={mode === "sms" ? "number-pad" : "default"}
            placeholder={manualPlaceholder(mode)}
          />
          <Button
            variant="secondary"
            label="Add"
            disabled={!value.trim()}
            onPress={onManualAdd}
          />
        </View>
      )}

      {notice ? (
        <View className="flex-row gap-2 rounded-3xl p-4" style={{ backgroundColor: "#e1f3ec" }}>
          <CheckCircle size={18} color={PH_COLORS.success} weight="fill" />
          <Text className="flex-1 text-[13px] text-foreground">{notice}</Text>
        </View>
      ) : null}

      {error ? (
        <View className="flex-row gap-2 rounded-3xl p-4" style={{ backgroundColor: "#fce8ea" }}>
          <WarningCircle size={18} color={PH_COLORS.red} weight="fill" />
          <Text className="flex-1 text-[13px] font-semibold text-destructive">
            {error}
          </Text>
        </View>
      ) : null}

      <SectionLabel>Waiting to sync</SectionLabel>
      {queue.length === 0 ? (
        <EmptyState
          icon={CloudArrowUp}
          title="Nothing queued"
          description="Anything you scan while offline waits here until you are back online and sync."
        />
      ) : (
        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          {queue.map((it, index) => (
            <View
              key={it.client_uuid}
              className={
                index === queue.length - 1
                  ? "flex-row items-center gap-3 px-4 py-3.5"
                  : "flex-row items-center gap-3 border-b border-border px-4 py-3.5"
              }
            >
              <View className="flex-1 gap-1">
                <Text
                  numberOfLines={1}
                  className="text-[14px] font-semibold text-foreground"
                >
                  {it.sms_code ?? `${it.token?.slice(0, 16)}...`}
                </Text>
                <View className="flex-row">
                  <Badge variant={tagVariant(it.tag)} label={TAG_LABELS[it.tag]} />
                </View>
              </View>
              <Pressable
                hitSlop={8}
                android_ripple={null}
                className="active:opacity-60"
                onPress={() =>
                  setQueue((q) =>
                    q.filter((x) => x.client_uuid !== it.client_uuid),
                  )
                }
              >
                <Trash size={19} color={PH_COLORS.red} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Button
        label={
          queue.length === 0
            ? "Nothing to sync"
            : `Sync ${queue.length} redemption${queue.length > 1 ? "s" : ""}`
        }
        loading={sync.isPending}
        disabled={queue.length === 0}
        onPress={() =>
          sync.mutate(toBatchItems(queue), {
            onSuccess: (res) => {
              setResults(res);
              setQueue([]);
            },
            onError: () =>
              dialog.alert({
                title: "Sync failed",
                message: "Check your connection and try again.",
              }),
          })
        }
      />

      {results.length > 0 ? (
        <>
          <SectionLabel>Last sync result</SectionLabel>
          <View className="overflow-hidden rounded-3xl border border-border bg-card">
            {results.map((r, index) => (
              <View
                key={r.client_uuid}
                className={
                  index === results.length - 1
                    ? "flex-row items-center gap-3 px-4 py-3.5"
                    : "flex-row items-center gap-3 border-b border-border px-4 py-3.5"
                }
              >
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-muted-foreground">
                    {r.client_uuid.slice(0, 8)}
                  </Text>
                  {r.reason ? (
                    <Text className="text-xs text-destructive">{r.reason}</Text>
                  ) : null}
                </View>
                <Badge variant={resultVariant(r.status)} label={r.status} />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
