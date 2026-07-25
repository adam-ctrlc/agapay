import { useState } from "react";
import { Pressable, View } from "react-native";
import { BookOpen, PencilSimple, Trash } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { GuideCategory, ServiceGuide } from "@/lib/api/guides";
import {
  useCreateGuide,
  useUpdateGuide,
  useDeleteGuide,
  useGuides,
} from "@/lib/queries/guides";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
import { useDialog } from "@/components/ui/dialog";
import { Screen, useScreenScroll } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { GUIDE_CATEGORY_LABEL, GuideIcon } from "@/components/guide-indicators";

const CATEGORIES: GuideCategory[] = [
  "id",
  "benefit",
  "document",
  "relief",
  "tax",
  "work",
  "business",
  "travel",
];

const CATEGORY_OPTIONS: SegmentedOption<GuideCategory>[] = CATEGORIES.map(
  (key) => ({ key, label: GUIDE_CATEGORY_LABEL[key] }),
);

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Splits so the body sits inside the Screen it scrolls. useScreenScroll reads
 * the provider Screen renders, so a component that renders its own Screen
 * would read the default no-op instead.
 */
export function GuidesAdmin() {
  const guides = useGuides();

  return (
    <Screen
      edges={["top"]}
      refreshing={guides.isRefetching}
      onRefresh={() => guides.refetch()}
    >
      <GuidesAdminBody />
    </Screen>
  );
}

function GuidesAdminBody() {
  const guides = useGuides();
  const create = useCreateGuide();
  const update = useUpdateGuide();
  const remove = useDeleteGuide();
  const dialog = useDialog();
  const { scrollToTop } = useScreenScroll();

  const [category, setCategory] = useState<GuideCategory>("id");
  const [agency, setAgency] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [steps, setSteps] = useState("");
  const [whereToGo, setWhereToGo] = useState("");
  const [fees, setFees] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  function reset() {
    setEditingId(null);
    setCategory("id");
    setAgency("");
    setTitle("");
    setSummary("");
    setRequirements("");
    setSteps("");
    setWhereToGo("");
    setFees("");
    setSourceUrl("");
    setNotes("");
  }

  function startEdit(guide: ServiceGuide) {
    setEditingId(guide.id);
    setCategory(guide.category);
    setAgency(guide.agency);
    setTitle(guide.title);
    setSummary(guide.summary);
    setRequirements((guide.requirements ?? []).join("\n"));
    setSteps((guide.steps ?? []).join("\n"));
    setWhereToGo(guide.where_to_go ?? "");
    setFees(guide.fees ?? "");
    setSourceUrl(guide.source_url ?? "");
    setNotes(guide.notes ?? "");
    scrollToTop();
  }

  function post() {
    const reqs = lines(requirements);
    const stepList = lines(steps);
    if (!agency.trim() || !title.trim() || !summary.trim()) {
      dialog.alert("Add an agency, title, and summary first.");
      return;
    }
    if (reqs.length === 0 || stepList.length === 0 || !whereToGo.trim()) {
      dialog.alert("Add at least one requirement, one step, and where to go.");
      return;
    }
    const body = {
      category,
      agency: agency.trim(),
      title: title.trim(),
      summary: summary.trim(),
      requirements: reqs,
      steps: stepList,
      where_to_go: whereToGo.trim(),
      fees: fees.trim() || null,
      source_url: sourceUrl.trim() || null,
      notes: notes.trim() || null,
    };

    if (editingId !== null) {
      update.mutate(
        { id: editingId, body },
        {
          onSuccess: () => {
            reset();
            dialog.alert({
              title: "Updated",
              message: "The guide has been changed.",
            });
          },
          onError: (e) =>
            dialog.alert({
              title: "Could not update",
              message: e instanceof ApiError ? e.message : "Please try again.",
            }),
        },
      );
      return;
    }

    create.mutate(
      {
        category,
        agency: agency.trim(),
        title: title.trim(),
        summary: summary.trim(),
        requirements: reqs,
        steps: stepList,
        where_to_go: whereToGo.trim(),
        fees: fees.trim() || null,
        source_url: sourceUrl.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          reset();
          dialog.alert({
            title: "Published",
            message: "Citizens can now see this guide.",
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not publish",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  async function confirmDelete(id: number, guideTitle: string) {
    const ok = await dialog.confirm({
      title: "Remove guide?",
      message: `"${guideTitle}" will be hidden from citizens.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) remove.mutate(id);
  }

  return (
    <>
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Gabay
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Publish requirement guides for citizens.
        </Text>
      </View>

      <SectionLabel>{editingId === null ? "New guide" : "Edit guide"}</SectionLabel>
      <View className="rounded-3xl border border-border bg-card p-4">
        <View className="gap-3">
          <Field label="Category">
            <ChipRow
              value={category}
              onChange={(next) => setCategory(next)}
              options={CATEGORY_OPTIONS}
            />
          </Field>

          <Field label="Agency">
            <Input
              value={agency}
              onChangeText={setAgency}
              placeholder="SSS, PhilHealth, PSA, LGU..."
            />
          </Field>
          <Field label="Title">
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Get an SSS number and UMID card"
            />
          </Field>
          <Field label="Short summary">
            <Input
              value={summary}
              onChangeText={setSummary}
              multiline
              className="h-20 py-3"
              style={{ textAlignVertical: "top" }}
              placeholder="One or two sentences on what this is for"
            />
          </Field>
          <Field label="Requirements (one per line)">
            <Input
              value={requirements}
              onChangeText={setRequirements}
              multiline
              className="h-28 py-3"
              style={{ textAlignVertical: "top" }}
              placeholder={"PSA birth certificate\nOne valid government ID"}
            />
          </Field>
          <Field label="Steps (one per line)">
            <Input
              value={steps}
              onChangeText={setSteps}
              multiline
              className="h-28 py-3"
              style={{ textAlignVertical: "top" }}
              placeholder={"Register online\nBook an appointment"}
            />
          </Field>
          <Field label="Where to go">
            <Input
              value={whereToGo}
              onChangeText={setWhereToGo}
              multiline
              className="h-20 py-3"
              style={{ textAlignVertical: "top" }}
              placeholder="Any SSS branch, or online at sss.gov.ph"
            />
          </Field>
          <Field label="Fees (optional)">
            <Input value={fees} onChangeText={setFees} placeholder="Free" />
          </Field>
          <Field label="Official website (optional)">
            <Input
              value={sourceUrl}
              onChangeText={setSourceUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://www.sss.gov.ph"
            />
          </Field>
          <Field label="Notes (optional)">
            <Input
              value={notes}
              onChangeText={setNotes}
              multiline
              className="h-20 py-3"
              style={{ textAlignVertical: "top" }}
              placeholder="Bring originals and photocopies"
            />
          </Field>

          <Button
            label={editingId === null ? "Publish guide" : "Save changes"}
            loading={create.isPending || update.isPending}
            disabled={
              !agency.trim() ||
              !title.trim() ||
              !summary.trim() ||
              !requirements.trim() ||
              !steps.trim() ||
              !whereToGo.trim()
            }
            onPress={post}
          />
          {editingId !== null ? (
            <Button variant="outline" label="Cancel edit" onPress={reset} />
          ) : null}
        </View>
      </View>

      <SectionLabel>Published guides</SectionLabel>
      {guides.isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </View>
      ) : (guides.data ?? []).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No guides yet"
          description="Publish one above and citizens will see it under Gabay."
        />
      ) : (
        <View className="gap-3">
          {guides.data?.map((guide) => (
            <View
              key={guide.id}
              className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <GuideIcon category={guide.category} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text variant="label" numberOfLines={1}>
                  {guide.title}
                </Text>
                <Badge variant="secondary" label={guide.agency} />
              </View>
              <Pressable
                onPress={() => startEdit(guide)}
                hitSlop={8}
                className="active:opacity-60"
              >
                <PencilSimple size={19} color={PH_COLORS.blue} />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(guide.id, guide.title)}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Trash size={20} color={PH_COLORS.red} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
