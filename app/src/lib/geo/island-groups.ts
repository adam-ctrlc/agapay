import { PH_PROVINCES, PH_VIEWBOX } from "@/lib/geo/ph-provinces";

export type IslandGroup = "luzon" | "visayas" | "mindanao";

export const ISLAND_GROUP_LABEL: Record<IslandGroup, string> = {
  luzon: "Luzon",
  visayas: "Visayas",
  mindanao: "Mindanao",
};

/**
 * Administrative island group, not a latitude cutoff. Palawan and Mindoro sit
 * far south but belong to Luzon, and Siquijor sits below Camiguin while one is
 * Visayas and the other Mindanao, so geography alone gets these wrong.
 */
const VISAYAS = [
  "PH-AKL",
  "PH-ANT",
  "PH-BIL",
  "PH-BOH",
  "PH-CAP",
  "PH-CEB",
  "PH-EAS",
  "PH-GUI",
  "PH-ILI",
  "PH-LEY",
  "PH-NEC",
  "PH-NER",
  "PH-NSA",
  "PH-WSA",
  "PH-SIG",
  "PH-SLE",
];

const MINDANAO = [
  "PH-AGN",
  "PH-AGS",
  "PH-BAS",
  "PH-BUK",
  "PH-CAM",
  "PH-COM",
  "PH-DAV",
  "PH-DAS",
  "PH-DAO",
  "PH-DIN",
  "PH-LAN",
  "PH-LAS",
  "PH-MG",
  "PH-MSC",
  "PH-MSR",
  "PH-NCO",
  "PH-SAR",
  "PH-SCO",
  "PH-SLU",
  "PH-SUK",
  "PH-SUN",
  "PH-SUR",
  "PH-TAW",
  "PH-ZAN",
  "PH-ZAS",
  "PH-ZSI",
];

const GROUPS: Record<string, IslandGroup> = {};

for (const code of VISAYAS) GROUPS[code] = "visayas";
for (const code of MINDANAO) GROUPS[code] = "mindanao";

export function islandGroupFor(code: string | null | undefined): IslandGroup {
  return (code ? GROUPS[code] : undefined) ?? "luzon";
}

export type ViewBox = { x: number; y: number; w: number; h: number };

function boundsFor(group: IslandGroup): ViewBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const province of PH_PROVINCES) {
    if (islandGroupFor(province.code) !== group) continue;

    const [x0, y0, x1, y1] = province.bbox;
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  }

  const padX = (maxX - minX) * 0.04;
  const padY = (maxY - minY) * 0.04;

  return {
    x: minX - padX,
    y: minY - padY,
    w: maxX - minX + padX * 2,
    h: maxY - minY + padY * 2,
  };
}

const BOUNDS: Record<IslandGroup, ViewBox> = {
  luzon: boundsFor("luzon"),
  visayas: boundsFor("visayas"),
  mindanao: boundsFor("mindanao"),
};

export function islandGroupViewBox(group: IslandGroup): ViewBox {
  return BOUNDS[group];
}

export function provincesInGroup(group: IslandGroup) {
  return PH_PROVINCES.filter((p) => islandGroupFor(p.code) === group);
}

/**
 * Fits the group's bounds to a square-ish frame so a tall group like Luzon is
 * not stretched sideways when it renders at the container's aspect.
 */
export function fitViewBox(box: ViewBox, aspect: number): ViewBox {
  const current = box.w / box.h;

  if (current > aspect) {
    const h = box.w / aspect;
    return { x: box.x, y: box.y - (h - box.h) / 2, w: box.w, h };
  }

  const w = box.h * aspect;
  return { x: box.x - (w - box.w) / 2, y: box.y, w, h: box.h };
}

export const FULL_VIEWBOX: ViewBox = {
  x: 0,
  y: 0,
  w: PH_VIEWBOX.width,
  h: PH_VIEWBOX.height,
};
