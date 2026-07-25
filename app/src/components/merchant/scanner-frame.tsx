import { View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Camera } from "phosphor-react-native";

import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const CORNER = "absolute h-8 w-8 border-white";

/**
 * Shared by Redeem and the offline queue: both read the same voucher QR and
 * both have to handle the permission states before a camera can mount.
 */
export function ScannerFrame({
  height = 288,
  paused = false,
  caption,
  onScan,
}: {
  height?: number;
  paused?: boolean;
  caption?: string;
  onScan: (data: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={{ height }}>
        <Skeleton className="h-full w-full rounded-[28px]" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <EmptyState
        icon={Camera}
        title="Camera access needed"
        description="The camera is used only to read voucher QR codes. Nothing is recorded."
        action={<Button label="Enable camera" onPress={requestPermission} />}
      />
    );
  }

  return (
    <View className="gap-3">
      <View
        className="w-full overflow-hidden rounded-[28px] bg-black"
        style={{ height }}
      >
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={paused ? undefined : ({ data }) => onScan(data)}
        />

        <View pointerEvents="none" className="absolute inset-0">
          <View
            className={cn(CORNER, "left-5 top-5 rounded-tl-2xl border-l-4 border-t-4")}
          />
          <View
            className={cn(CORNER, "right-5 top-5 rounded-tr-2xl border-r-4 border-t-4")}
          />
          <View
            className={cn(
              CORNER,
              "bottom-5 left-5 rounded-bl-2xl border-b-4 border-l-4",
            )}
          />
          <View
            className={cn(
              CORNER,
              "bottom-5 right-5 rounded-br-2xl border-b-4 border-r-4",
            )}
          />
        </View>
      </View>

      {caption ? (
        <Text className="text-center text-[13px] text-muted-foreground">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
