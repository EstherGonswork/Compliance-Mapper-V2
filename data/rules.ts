/**
 * Every threshold, code name and piece of guidance text lives in this file.
 * To change a rule, edit it here. No interface code needs to change.
 *
 * Text templates can use these placeholders, filled in by lib/engine.ts:
 *   {psi} {bar} {kgcm2}        the entered pressure in each unit
 *   {limit}                    the limit of the band that matched (US)
 *   {tempLimit}                the hot water temperature limit in F (US)
 *   {volumeClause}             " and 500 litres" when a volume was entered, otherwise empty
 *   {limitVolume} {limitPressure} {limitPipePressure} {limitDiameter}   India limits
 *   {scopeBar}                 PED/PESR lower scope limit in bar
 *   {law} {marking} {body} {category}   PED/PESR wording that differs between the EU and the UK
 */

import type { CategoryId, EquipId, PressureBand, RegionId, RuleText, UnitId } from "@/lib/types";

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export const CONVERSIONS = {
  psiPerBar: 14.5038,
  kgcm2PerBar: 1.01972,
} as const;

export const UNIT_OPTIONS: { value: UnitId; label: string }[] = [
  { value: "bar", label: "bar" },
  { value: "psi", label: "psi" },
  { value: "kgcm2", label: "kg/cm²" },
];

// ---------------------------------------------------------------------------
// Form options
// ---------------------------------------------------------------------------

export const REGIONS: Record<RegionId, { flag: string; name: string }> = {
  us: { flag: "🇺🇸", name: "United States" },
  eu: { flag: "🇪🇺", name: "European Union" },
  uk: { flag: "🇬🇧", name: "United Kingdom" },
  in: { flag: "🇮🇳", name: "India" },
  cn: { flag: "🇨🇳", name: "China" },
  au: { flag: "🇦🇺", name: "Australia / New Zealand" },
};

export const EQUIPMENT: Record<EquipId, string> = {
  steam: "Steam boiler",
  hotwater: "Hot water boiler",
  vesselpart: "Pressure vessel / boiler part",
};

/** Which optional fields each region uses, and the help text under the volume field. */
export const REGION_FIELDS: Record<RegionId, { volume: boolean; category: boolean; volumeHelp: string }> = {
  us: { volume: false, category: false, volumeHelp: "" },
  eu: { volume: true, category: true, volumeHelp: "Used alongside pressure to help confirm the PED/PESR category." },
  uk: { volume: true, category: true, volumeHelp: "Used alongside pressure to help confirm the PED/PESR category." },
  in: { volume: true, category: false, volumeHelp: "Checked against the 22.75 litre IBR boiler threshold." },
  cn: { volume: false, category: false, volumeHelp: "" },
  au: { volume: false, category: false, volumeHelp: "" },
};

export const CATEGORY_OPTIONS: { value: CategoryId | ""; label: string }[] = [
  { value: "", label: "Not sure: show me the classification logic" },
  { value: "sep", label: "SEP (below Category I)" },
  { value: "I", label: "Category I" },
  { value: "II", label: "Category II" },
  { value: "III", label: "Category III" },
  { value: "IV", label: "Category IV" },
];

// ---------------------------------------------------------------------------
// United States: ASME Boiler and Pressure Vessel Code
// ---------------------------------------------------------------------------

export const US_RULES = {
  /** Hot water boilers stay in Section IV only at or below this temperature. */
  hotWaterTempLimitF: 250,

  /** Pressure ladders in psig, one per equipment type. */
  bands: {
    steam: [
      {
        max: 15,
        inclusive: true,
        code: "ASME BPVC Section IV: Heating Boilers",
        detail:
          "At {psi} psig, this is at or below the {limit} psig threshold that separates heating boilers from power boilers, so Section IV construction rules apply.",
      },
      {
        max: Infinity,
        inclusive: false,
        code: "ASME BPVC Section I: Power Boilers",
        detail:
          "At {psi} psig, this exceeds the {limit} psig threshold, so the part must be built to Section I rules for power boilers.",
      },
    ],
    hotwater: [
      {
        max: 160,
        inclusive: true,
        code: "ASME BPVC Section IV: Heating Boilers",
        detail:
          "At {psi} psig, this is within the Section IV range for hot water boilers (≤{limit} psig and ≤{tempLimit}°F). Confirm design temperature stays at or below {tempLimit}°F: exceeding either limit moves the unit into Section I.",
      },
      {
        max: Infinity,
        inclusive: false,
        code: "ASME BPVC Section I: Power Boilers",
        detail:
          "At {psi} psig, this exceeds the {limit} psig threshold for high-temperature water boilers, so Section I applies.",
      },
    ],
    vesselpart: [
      {
        max: 15,
        inclusive: true,
        code: "Below Section VIII scope",
        detail:
          "At {psi} psig, this falls below the {limit} psig threshold that triggers Section VIII. Check the relevant component standard instead.",
      },
      {
        max: 3000,
        inclusive: true,
        code: "ASME BPVC Section VIII, Division 1",
        detail:
          "At {psi} psig, this sits in the standard Section VIII Division 1 range. Division 2 is available as an alternative if the manufacturer wants higher allowable stresses in exchange for more rigorous design-by-analysis and NDE.",
      },
      {
        max: 10000,
        inclusive: false,
        code: "ASME BPVC Section VIII, Division 2",
        detail:
          "At {psi} psig, this is in a range where Division 2's alternative, more rigorous rules are commonly applied.",
      },
      {
        max: Infinity,
        inclusive: false,
        code: "ASME BPVC Section VIII, Division 3",
        detail: "At {psi} psig, this is in ultra-high-pressure territory, where Division 3 rules apply.",
      },
    ],
  } satisfies Record<EquipId, PressureBand[]>,

  marking: {
    vesselpart: "ASME 'U' Certification Mark (Section VIII)",
    boiler: "ASME 'S' Certification Mark (Section I power boilers); Section IV units typically carry the 'H' mark",
  },

  checklist: [
    "Materials sourced and certified to Section II",
    "Welding procedures and welder qualifications per Section IX",
    "Nondestructive examination per Section V",
    "Manufacturer's Data Report signed by an Authorized Inspector",
    "National Board registration: recommended for cross-border recognition",
  ],
};

// ---------------------------------------------------------------------------
// India: Indian Boiler Regulations, 1950
// ---------------------------------------------------------------------------

export const INDIA_RULES = {
  boiler: {
    /** A "boiler" under the Act has capacity above this many litres... */
    limitVolume: 22.75,
    /** ...or gauge pressure above this many kg/cm2. */
    limitPressure: 1,
    certified: {
      code: "Indian Boiler Regulations (IBR), 1950: full certification applies",
      detail:
        'This exceeds the IBR threshold for a "boiler" under the Act: capacity above {limitVolume} litres (measured from the feed check valve to the main steam stop valve) or gauge pressure above {limitPressure} kg/cm². Full IBR certification is required before the unit can be installed in India.',
    } satisfies RuleText,
    underThreshold: {
      code: "Check against IBR's boiler definition",
      detail:
        "At {kgcm2} kg/cm²{volumeClause}, this is under both IBR thresholds ({limitVolume} litres / {limitPressure} kg/cm² gauge) as entered. Confirm the exact capacity measurement before ruling out certification.",
    } satisfies RuleText,
  },
  pipe: {
    /** Pipes and fittings need IBR certification above this pressure above atmospheric... */
    limitPressure: 3.5,
    /** ...or when the internal diameter exceeds this many millimetres. */
    limitDiameter: 254,
    above: {
      code: "IBR steam pipe certification applies",
      detail:
        "At {kgcm2} kg/cm², this exceeds the {limitPipePressure} kg/cm² threshold above atmospheric pressure, so the pipe or fitting needs IBR certification regardless of diameter.",
    } satisfies RuleText,
    below: {
      code: "Check diameter against the IBR pipe threshold",
      detail:
        "At {kgcm2} kg/cm², this is below the {limitPipePressure} kg/cm² pressure threshold. IBR certification is still required if the pipe's internal diameter exceeds {limitDiameter}mm.",
    } satisfies RuleText,
  },
  marking: "Inspecting Authority endorsement (Central Boilers Board-recognized) on the relevant IBR form",
  checklist: [
    "Design submitted to the Inspecting Authority, then CBB (Delhi) and the state Chief Inspector of Boilers for approval: manufacturing cannot begin before that sign-off",
    "Material inspection and certification (Form IV for steelmakers)",
    "Pressure parts inspection during fabrication",
    "Component-specific forms: III (boiler), IIIA (pipe), IIIB (tube/source material), IIIC (fittings, mountings, valves)",
    "Welder qualification tests, valid two years contingent on continuous employment on qualified work",
  ],
};

// ---------------------------------------------------------------------------
// European Union (PED 2014/68/EU) and United Kingdom (PESR 2016)
// ---------------------------------------------------------------------------

export const PED_RULES = {
  /** At or below this pressure in bar the regulation does not apply on pressure grounds. */
  scopeBar: 0.5,

  /** Wording that differs between the two regimes. */
  variants: {
    eu: { law: "PED 2014/68/EU", marking: "CE", body: "EU Notified Body" },
    uk: { law: "PESR 2016", marking: "UKCA", body: "UK Approved Body" },
  },

  outOfScope: {
    code: "Outside {law} scope",
    detail:
      "At {bar} bar, this is at or below the {scopeBar} bar threshold, so the regulation does not apply on this basis. No {marking} marking is required.",
    marking: "None required",
    checklist: [
      "Confirm no other directive applies, such as the Machinery Directive, before treating this as fully exempt.",
    ],
  },

  /** Used when the buyer already knows the category. */
  categories: {
    sep: {
      module: "Sound Engineering Practice: no third-party involvement",
      doc: "Manufacturer self-certifies design and construction quality. No Declaration of Conformity or marking required.",
    },
    I: {
      module: "Module A: manufacturer self-declaration",
      doc: "{marking} marking applied without {body} involvement.",
    },
    II: {
      module: "Modules A2 / D1 / E1",
      doc: "Limited {body} involvement: periodic surveillance of production.",
    },
    III: {
      module: "Modules B+D / B+F / B+C2 / H",
      doc: "Full type or design examination, plus quality assurance or unit verification, by a {body}.",
    },
    IV: {
      module: "Modules B+D / B+F / G / H1",
      doc: "Most rigorous tier: full quality assurance with design examination, or one-off unit verification, by a {body}.",
    },
  } satisfies Record<CategoryId, { module: string; doc: string }>,

  withCategory: {
    code: "{law}: Category {category}",
    markingSep: "None",
    marking: "{marking} marking + Declaration of Conformity",
    checklist: [
      "Technical file: drawings, design calculation report, welding procedures (WPS/WPQR), NDT results, pressure test record",
      "Hydrostatic or pneumatic test pressure per the applicable harmonized standard (commonly EN 13445 for vessels, EN 13480 for piping), typically around 1.4× the maximum allowable pressure, adjusted for temperature",
    ],
    lastItem: "{body} review and sign-off per the assigned conformity module",
    lastItemSep: "Internal design and construction records retained, even without third-party review",
  },

  /** Used when the category is unknown. */
  needsCategory: {
    code: "{law}: in scope, category to confirm",
    detail:
      "At {bar} bar{volumeClause}, this is above the {scopeBar} bar threshold, so classification is required. Category (SEP through IV) is read off Annex II's tables, cross-referencing pressure × volume (or pressure × diameter for piping) against fluid group. Group 1 hazardous fluids reach a higher category at a much lower pressure × volume than Group 2 fluids like steam or water, so the cross-reference needs the full table and cannot be reduced to one number here.",
    marking: "Depends on category: confirm with a {body}, or select a category above to see what it requires",
    checklist: [
      "Confirm fluid group: Group 1 (hazardous: explosive, flammable, toxic, oxidising) or Group 2 (steam, water, compressed air, and similar)",
      "Plot pressure × volume (or pressure × diameter for piping) against the relevant Annex II table for that fluid group and physical state",
      "Once the category is known, select it above for the matching conformity module and documentation list",
    ],
    callout:
      "Don't have the exact category yet? Ask your supplier or {body} for the Annex II table reference they used. That is the fastest way to confirm it.",
  },
};

// ---------------------------------------------------------------------------
// China: Special Equipment Safety Technical Specifications (TSG)
// ---------------------------------------------------------------------------

export const CHINA_RULES = {
  vesselpart: {
    code: "TSG 21-2016: Stationary Pressure Vessels",
    detail:
      "Pressure vessels and boiler parts sold or installed in China fall under TSG 21-2016, built to GB150 (pressure vessels) or GB151 (heat exchangers) as the design and construction standard.",
  } satisfies RuleText,
  boiler: {
    code: "TSG 11-2020: Regulation on Safety Technology for Boilers",
    detail:
      "Boilers fall under TSG 11-2020, administered alongside the relevant GB design standards for boiler materials and construction.",
  } satisfies RuleText,
  marking:
    'SELO license (China Manufacture License, sometimes called the "China stamp"), issued by the State Administration for Market Regulation',
  checklist: [
    "Hazard class (commonly Class I/II/III) assigned per TSG's own pressure, volume, and medium-hazard tables: confirm exact class with a SELO-recognized inspection body",
    "Special Equipment Licensing Office approval before manufacture, installation, alteration, or significant repair",
    "Supervision inspection at each of those stages, not only at final sign-off",
    "Import inspection per TSG 21-2022 for equipment manufactured outside China",
  ],
  callout:
    "Class boundaries depend on pressure, volume, and medium together. Ask your supplier which TSG class they are certifying to.",
};

// ---------------------------------------------------------------------------
// Australia / New Zealand
// ---------------------------------------------------------------------------

export const AU_RULES = {
  vesselpart: {
    code: "AS 1210: Pressure Vessels",
    detail:
      "Pressure vessels and boiler parts are built to AS 1210, which references ASME BPV-VIII, PD 5500, EN 13445, and GB150 as accepted equivalents.",
  } satisfies RuleText,
  boiler: {
    code: "AS 1228: Boilers",
    detail:
      "Boilers are built to AS 1228, which references ASME BPV-I, BS 855/1113/2790, and EN 12952/12953 as accepted equivalents.",
  } satisfies RuleText,
  marking:
    "Design registration number, stamped on the equipment once registered with the state or territory WHS regulator",
  checklist: [
    "Hazard Level assessed under AS 4343 (A through E) based on pressure, volume, temperature, and fluid hazard together: Levels A through D require design registration before manufacture",
    "Design verification certificate from an independent or third-party verifier",
    "Manufacturer's data report and design registration letter shared with the purchaser",
    "In-service inspection per AS/NZS 3788 once installed",
    "Welding and brazing qualification per AS 3992; inspector competencies per AS 4481",
  ],
  callout:
    "Hazard Level depends on pressure, volume, temperature, and fluid type together. Ask your supplier for the AS 4343 hazard level they have assigned.",
};
