import type { EngineOutput } from "@/lib/types";

export interface GlanceRow {
  label: string;
  a: string;
  b: string;
}

/** Rows for the side by side table. */
export function glanceRows(a: EngineOutput, b: EngineOutput): GlanceRow[] {
  return [
    { label: "Applicable code", a: a.result.code, b: b.result.code },
    { label: "Marking / certification", a: a.result.marking, b: b.result.marking },
    { label: "Items to request", a: String(a.result.checklist.length), b: String(b.result.checklist.length) },
    {
      label: "Open step",
      a: a.result.callout ? "Yes, see the card" : "None",
      b: b.result.callout ? "Yes, see the card" : "None",
    },
  ];
}
