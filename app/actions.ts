"use server";

import { redirect } from "next/navigation";
import { fetchCommunityMatchData } from "../lib/matching/community-data";
import { scoreCommunities } from "../lib/matching/scoring";
import type { MoverPriorities, SliderValue } from "../lib/matching/types";

function readSlider(formData: FormData, key: string): SliderValue | undefined {
  const raw = formData.get(key);
  if (raw === null || raw === "") return undefined;
  const num = Number(raw);
  if (num < 1 || num > 5) return undefined;
  return num as SliderValue;
}

export async function runMatch(formData: FormData) {
  const closeTo = formData.get("closeToCommunityId");

  const priorities: MoverPriorities = {
    lakeAccess: readSlider(formData, "lakeAccess"),
    outdoorAccess: readSlider(formData, "outdoorAccess"),
    paceOfLife: readSlider(formData, "paceOfLife"),
    festivalCulture: readSlider(formData, "festivalCulture"),
    schoolPriority: readSlider(formData, "schoolPriority"),
    closeToCommunityId:
      typeof closeTo === "string" && closeTo.length > 0 ? closeTo : undefined,
  };

  const communities = await fetchCommunityMatchData(priorities.closeToCommunityId);
  const results = scoreCommunities(priorities, communities);
  const top = results.slice(0, 10);

  const closeToCommunityName = priorities.closeToCommunityId
    ? communities.find((c) => c.id === priorities.closeToCommunityId)?.name ?? null
    : null;

  const encoded = encodeURIComponent(
    JSON.stringify({ matches: top, closeToCommunityName })
  );
  redirect(`/results?data=${encoded}`);
}
