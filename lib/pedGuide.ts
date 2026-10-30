import { fill, fmt } from "@/lib/format";
import {
  GUIDE_TEXT,
  PED_TABLES,
  type Condition,
  type Measure,
  type PedGroup,
  type PedKind,
  type PedState,
  type PedTable,
} from "@/data/ped";
import { PED_RULES } from "@/data/rules";
import type { CategoryId } from "@/lib/types";

export interface GuideInput {
  kind: PedKind;
  state: PedState;
  group: PedGroup;
  pressureBar: number;
  /** Litres for vessels and heated equipment, millimetres of DN for piping. */
  size: number | null;
}

export type GuideResult =
  | { status: "outside"; message: string }
  | { status: "needsSize"; message: string; table: PedTable }
  | { status: "sep"; message: string; table: PedTable; category: "sep" }
  | { status: "category"; message: string; table: PedTable; category: CategoryId }
  | { status: "inScope"; message: string; table: PedTable };

export function pickTable(kind: PedKind, state: PedState, group: PedGroup, tables: PedTable[] = PED_TABLES): PedTable | undefined {
  if (kind === "heated") return tables.find((t) => t.kind === "heated");
  return tables.find((t) => t.kind === kind && t.state === state && t.group === group);
}

function measuresFor(table: PedTable, ps: number, size: number): Record<Measure, number> {
  const v = table.size === "volume" ? size : 0;
  const dn = table.size === "dn" ? size : 0;
  return { ps, v, dn, psv: ps * v, psdn: ps * dn };
}

const holds = (c: Condition, m: Record<Measure, number>) => m[c.measure] > c.gt;
const reaches = (table: PedTable, m: Record<Measure, number>) => table.entry.some((all) => all.every((c) => holds(c, m)));

const LABELS: Record<Measure, string> = { ps: "PS", v: "volume", dn: "DN", psv: "PS × V", psdn: "PS × DN" };

function describeMeasure(table: PedTable, m: Record<Measure, number>): string {
  if (table.size === "dn") return `PS × DN = ${fmt(m.psdn)} bar·mm (DN ${fmt(m.dn)})`;
  return `PS × V = ${fmt(m.psv)} bar·L (${fmt(m.v)} L)`;
}

/** Names the table, the SEP outcome, and the category when the table has bands. */
export function guideCategory(
  input: GuideInput,
  tables: PedTable[] = PED_TABLES,
  scopeBar: number = PED_RULES.scopeBar,
): GuideResult {
  if (!(input.pressureBar > scopeBar)) {
    return {
      status: "outside",
      message: `At ${fmt(input.pressureBar)} bar the part is at or below ${scopeBar} bar, so the regulation does not apply on pressure grounds.`,
    };
  }
  const table = pickTable(input.kind, input.state, input.group, tables);
  if (!table) throw new Error("No Annex II table matches these answers");

  if (input.size === null || !(input.size > 0)) {
    return { status: "needsSize", message: GUIDE_TEXT.needsSize[table.size], table };
  }

  const m = measuresFor(table, input.pressureBar, input.size);
  const vars = { table: table.label, ps: fmt(input.pressureBar), measure: describeMeasure(table, m) };

  if (!reaches(table, m)) {
    return { status: "sep", message: fill(GUIDE_TEXT.sep, vars), table, category: "sep" };
  }

  const band = table.bands.find((b) =>
    (Object.keys(b.max) as Measure[]).every((k) => m[k] <= (b.max[k] as number)),
  );
  if (band) {
    return { status: "category", message: fill(GUIDE_TEXT.category, { ...vars, category: band.category }), table, category: band.category };
  }
  return { status: "inScope", message: fill(GUIDE_TEXT.inScope, vars), table };
}

export { LABELS as MEASURE_LABELS };
