import { CATEGORY_OPTIONS, EQUIPMENT, REGIONS, UNIT_OPTIONS } from "@/data/rules";
import { fmt } from "@/lib/format";
import type { CategoryId, EngineOutput, EquipId, RegionId, UnitId } from "@/lib/types";

export interface FormState {
  region: RegionId;
  equip: EquipId;
  pressure: string;
  unit: UnitId;
  volume: string;
  category: CategoryId | "";
  /** A second region to show beside the first, or empty for a single result. */
  compare: RegionId | "";
}

export const DEFAULT_STATE: FormState = {
  region: "us",
  equip: "steam",
  pressure: "12",
  unit: "bar",
  volume: "",
  category: "",
  compare: "",
};

const isKey = <T extends string>(obj: Record<T, unknown>, value: string | null): value is T =>
  value !== null && Object.prototype.hasOwnProperty.call(obj, value);

/** Reads a form state from a query string. Unknown or missing values fall back to the defaults. */
export function stateFromQuery(query: string): FormState {
  const q = new URLSearchParams(query);
  const region = q.get("region");
  const equip = q.get("equip");
  const unit = q.get("unit");
  const category = q.get("cat");
  const pressure = q.get("p");
  const volume = q.get("vol");
  const compare = q.get("cmp");
  const regionValue: RegionId = isKey(REGIONS, region) ? region : DEFAULT_STATE.region;

  return {
    region: regionValue,
    equip: isKey(EQUIPMENT, equip) ? equip : DEFAULT_STATE.equip,
    pressure: pressure !== null && pressure !== "" && Number.isFinite(Number(pressure)) ? pressure : DEFAULT_STATE.pressure,
    unit: UNIT_OPTIONS.some((u) => u.value === unit) ? (unit as UnitId) : DEFAULT_STATE.unit,
    volume: volume !== null && volume !== "" && Number.isFinite(Number(volume)) ? volume : "",
    category: CATEGORY_OPTIONS.some((c) => c.value === category && c.value !== "") ? (category as CategoryId) : "",
    compare: isKey(REGIONS, compare) && compare !== regionValue ? compare : "",
  };
}

/** Builds a query string that reopens the same inputs. */
export function stateToQuery(s: FormState): string {
  const q = new URLSearchParams();
  q.set("region", s.region);
  q.set("equip", s.equip);
  q.set("p", s.pressure);
  q.set("unit", s.unit);
  if (s.volume !== "") q.set("vol", s.volume);
  if (s.category !== "") q.set("cat", s.category);
  if (s.compare !== "") q.set("cmp", s.compare);
  return q.toString();
}

/** Plain-text summary for the copy button. */
export function buildSummary(s: FormState, out: EngineOutput): string {
  const region = REGIONS[s.region];
  const lines = [
    `Boiler Parts Compliance Mapper`,
    `${region.name} | ${EQUIPMENT[s.equip]}`,
    `Entered pressure: ${fmt(out.bar)} bar / ${fmt(out.psi)} psi / ${fmt(out.kgcm2)} kg/cm²`,
    ``,
    `Applicable code: ${out.result.code}`,
    out.result.detail,
    ``,
    `Marking / certification: ${out.result.marking}`,
    ``,
    `What to request from your supplier:`,
    ...out.result.checklist.map((item) => `- ${item}`),
  ];
  if (out.result.callout) lines.push(``, `Next step: ${out.result.callout}`);
  lines.push(``, `Directional guidance only. Confirm final classification with an accredited certifier.`);
  return lines.join("\n");
}
