/**
 * Annex II tables of the Pressure Equipment Directive 2014/68/EU (and the matching UK schedule).
 * The guided category question reads this file. Edit it to change a limit or to add category bands.
 *
 * ENTRY LIMITS (verified): below these limits a part is Sound Engineering Practice (SEP), the
 * "Article 4(3)" route. Equipment at or below 0.5 bar sits outside the regulation, see PED_RULES.scopeBar.
 *
 * CATEGORY BANDS (empty): the lines that split Category I, II, III and IV exist in the directive as
 * chart lines. Fill `bands` from the charts to make the guide name the category.
 * Each band lists the largest value of each measure that still belongs to that category.
 * Bands go from Category I upward. The first band whose limits all hold wins.
 * A point exactly on a line belongs to the lower category (Annex II, point 4).
 * Example of one band:  { category: "I", max: { psv: 50, ps: 32 } }
 */

import type { CategoryId } from "@/lib/types";

export type PedKind = "vessel" | "piping" | "heated";
export type PedState = "gas" | "liquid";
export type PedGroup = 1 | 2;

/** ps in bar, v in litres, dn in mm, psv in bar x litres, psdn in bar x mm. */
export type Measure = "ps" | "v" | "psv" | "dn" | "psdn";

export interface Condition {
  measure: Measure;
  /** The measure must be greater than this value. */
  gt: number;
}

export interface CategoryBand {
  category: Exclude<CategoryId, "sep">;
  max: Partial<Record<Measure, number>>;
}

export interface PedTable {
  id: number;
  kind: PedKind;
  state?: PedState;
  group?: PedGroup;
  label: string;
  /** Which size the guide asks for. */
  size: "volume" | "dn";
  /** A part reaches the categories when ANY inner list holds in full. */
  entry: Condition[][];
  bands: CategoryBand[];
}

export const PED_TABLES: PedTable[] = [
  {
    id: 1, kind: "vessel", state: "gas", group: 1, size: "volume",
    label: "Table 1: pressure vessel, Group 1 gas",
    entry: [[{ measure: "v", gt: 1 }, { measure: "psv", gt: 25 }], [{ measure: "ps", gt: 200 }]],
    bands: [],
  },
  {
    id: 2, kind: "vessel", state: "gas", group: 2, size: "volume",
    label: "Table 2: pressure vessel, Group 2 gas",
    entry: [[{ measure: "v", gt: 1 }, { measure: "psv", gt: 50 }], [{ measure: "ps", gt: 1000 }]],
    bands: [],
  },
  {
    id: 3, kind: "vessel", state: "liquid", group: 1, size: "volume",
    label: "Table 3: pressure vessel, Group 1 liquid",
    entry: [[{ measure: "v", gt: 1 }, { measure: "psv", gt: 200 }], [{ measure: "ps", gt: 500 }]],
    bands: [],
  },
  {
    id: 4, kind: "vessel", state: "liquid", group: 2, size: "volume",
    label: "Table 4: pressure vessel, Group 2 liquid",
    entry: [[{ measure: "ps", gt: 10 }, { measure: "psv", gt: 10000 }], [{ measure: "ps", gt: 1000 }]],
    bands: [],
  },
  {
    id: 5, kind: "heated", size: "volume",
    label: "Table 5: fired or heated equipment (steam or superheated water above 110°C)",
    entry: [[{ measure: "v", gt: 2 }]],
    bands: [],
  },
  {
    id: 6, kind: "piping", state: "gas", group: 1, size: "dn",
    label: "Table 6: piping, Group 1 gas",
    entry: [[{ measure: "dn", gt: 25 }]],
    bands: [],
  },
  {
    id: 7, kind: "piping", state: "gas", group: 2, size: "dn",
    label: "Table 7: piping, Group 2 gas",
    entry: [[{ measure: "dn", gt: 32 }, { measure: "psdn", gt: 1000 }]],
    bands: [],
  },
  {
    id: 8, kind: "piping", state: "liquid", group: 1, size: "dn",
    label: "Table 8: piping, Group 1 liquid",
    entry: [[{ measure: "dn", gt: 25 }, { measure: "psdn", gt: 2000 }]],
    bands: [],
  },
  {
    id: 9, kind: "piping", state: "liquid", group: 2, size: "dn",
    label: "Table 9: piping, Group 2 liquid",
    entry: [[{ measure: "ps", gt: 10 }, { measure: "dn", gt: 200 }, { measure: "psdn", gt: 5000 }]],
    bands: [],
  },
];

export const KIND_OPTIONS: { value: PedKind; label: string }[] = [
  { value: "vessel", label: "Pressure vessel or tank" },
  { value: "piping", label: "Piping" },
  { value: "heated", label: "Fired or heated steam or hot water equipment (above 110°C)" },
];

export const STATE_OPTIONS: { value: PedState; label: string }[] = [
  { value: "gas", label: "Gas or vapour (steam counts here)" },
  { value: "liquid", label: "Liquid (water counts here)" },
];

export const GROUP_OPTIONS: { value: PedGroup; label: string }[] = [
  { value: 2, label: "Group 2: steam, water, air, nitrogen and similar" },
  { value: 1, label: "Group 1: explosive, flammable, toxic or oxidising" },
];

/** Text shown by the guide. Placeholders: {table} {ps} {size} {measure} {category}. */
export const GUIDE_TEXT = {
  needsSize: {
    volume: "Enter the vessel volume in litres to continue.",
    dn: "Enter the nominal size (DN) in millimetres to continue.",
  },
  sep: "Below the entry limits for {table}. This part falls under Sound Engineering Practice (SEP), with no third-party review and no marking.",
  inScope:
    "Above the entry limits for {table}, so the part reaches Category I or higher. Read the exact category off that table in Annex II with PS {ps} bar and {measure}, then pick it in the category field.",
  category: "{table}: Category {category}. This reading is directional, so confirm it with your supplier or a Notified Body.",
  note: "Pressure comes from the field above. The guide uses the Article 4 entry limits of Directive 2014/68/EU. A fluid that is both gas and liquid in service needs the stricter table, so confirm it with a Notified Body.",
};
