import {
  AU_RULES,
  CHINA_RULES,
  CONVERSIONS,
  INDIA_RULES,
  PED_RULES,
  US_RULES,
} from "@/data/rules";
import { fill, fmt } from "@/lib/format";
import type { EngineInput, EngineOutput, EquipId, PressureBand, Result } from "@/lib/types";

/** Pressures that differ by less than this are treated as equal, so 15 psi stays exactly on the 15 psig line. */
const EPS = 1e-9;
const gt = (a: number, b: number) => a > b + EPS;
const le = (a: number, b: number) => a <= b + EPS;
const lt = (a: number, b: number) => a < b - EPS;

/** Converts the entered pressure into all three units without rounding drift on the unit that was typed. */
export function convertPressure(value: number, unit: EngineInput["unit"]) {
  let bar: number;
  if (unit === "bar") bar = value;
  else if (unit === "psi") bar = value / CONVERSIONS.psiPerBar;
  else bar = value / CONVERSIONS.kgcm2PerBar;

  return {
    bar,
    psi: unit === "psi" ? value : bar * CONVERSIONS.psiPerBar,
    kgcm2: unit === "kgcm2" ? value : bar * CONVERSIONS.kgcm2PerBar,
  };
}

function hasVolume(volumeL: number | null): volumeL is number {
  return volumeL !== null && !Number.isNaN(volumeL);
}

function computeUS(equip: EquipId, psi: number): Result {
  const bands: PressureBand[] = US_RULES.bands[equip];
  const found = bands.findIndex((b) => (b.inclusive ? le(psi, b.max) : lt(psi, b.max)));
  const at = found === -1 ? bands.length - 1 : found;
  const band = bands[at];
  // The last band has no upper limit, so its text refers to the limit of the band before it.
  const limit = Number.isFinite(band.max) ? band.max : bands[Math.max(at - 1, 0)].max;
  const vars = { psi: fmt(psi), limit: fmt(limit), tempLimit: US_RULES.hotWaterTempLimitF };

  return {
    code: fill(band.code, vars),
    detail: fill(band.detail, vars),
    marking: equip === "vesselpart" ? US_RULES.marking.vesselpart : US_RULES.marking.boiler,
    checklist: US_RULES.checklist,
    callout: null,
  };
}

function computeIndia(equip: EquipId, kgcm2: number, volumeL: number | null): Result {
  const vars = {
    kgcm2: fmt(kgcm2),
    volumeClause: hasVolume(volumeL) ? ` and ${volumeL} litres` : "",
    limitVolume: INDIA_RULES.boiler.limitVolume,
    limitPressure: INDIA_RULES.boiler.limitPressure,
    limitPipePressure: INDIA_RULES.pipe.limitPressure,
    limitDiameter: INDIA_RULES.pipe.limitDiameter,
  };

  let rule;
  if (equip === "steam" || equip === "hotwater") {
    const overVolume = hasVolume(volumeL) && gt(volumeL, INDIA_RULES.boiler.limitVolume);
    const overPressure = gt(kgcm2, INDIA_RULES.boiler.limitPressure);
    rule = overVolume || overPressure ? INDIA_RULES.boiler.certified : INDIA_RULES.boiler.underThreshold;
  } else {
    rule = gt(kgcm2, INDIA_RULES.pipe.limitPressure) ? INDIA_RULES.pipe.above : INDIA_RULES.pipe.below;
  }

  return {
    code: fill(rule.code, vars),
    detail: fill(rule.detail, vars),
    marking: INDIA_RULES.marking,
    checklist: INDIA_RULES.checklist,
    callout: null,
  };
}

function computePED(
  region: "eu" | "uk",
  bar: number,
  volumeL: number | null,
  category: EngineInput["category"],
): Result {
  const variant = PED_RULES.variants[region];
  const vars = {
    ...variant,
    bar: fmt(bar),
    scopeBar: PED_RULES.scopeBar,
    volumeClause: hasVolume(volumeL) ? ` and ${volumeL} litres` : "",
    category: category === "sep" ? "SEP" : category,
  };

  if (le(bar, PED_RULES.scopeBar)) {
    const rule = PED_RULES.outOfScope;
    return {
      code: fill(rule.code, vars),
      detail: fill(rule.detail, vars),
      marking: rule.marking,
      checklist: rule.checklist,
      callout: null,
    };
  }

  if (category) {
    const info = PED_RULES.categories[category];
    const rule = PED_RULES.withCategory;
    const isSep = category === "sep";
    return {
      code: fill(rule.code, vars),
      detail: `${fill(info.module, vars)}. ${fill(info.doc, vars)}`,
      marking: isSep ? rule.markingSep : fill(rule.marking, vars),
      checklist: [...rule.checklist, fill(isSep ? rule.lastItemSep : rule.lastItem, vars)],
      callout: null,
    };
  }

  const rule = PED_RULES.needsCategory;
  return {
    code: fill(rule.code, vars),
    detail: fill(rule.detail, vars),
    marking: fill(rule.marking, vars),
    checklist: rule.checklist,
    callout: fill(rule.callout, vars),
  };
}

function computeSimple(rules: typeof CHINA_RULES | typeof AU_RULES, equip: EquipId): Result {
  const rule = equip === "vesselpart" ? rules.vesselpart : rules.boiler;
  return {
    code: rule.code,
    detail: rule.detail,
    marking: rules.marking,
    checklist: rules.checklist,
    callout: rules.callout,
  };
}

/** Pure function: the same input always gives the same result, so it is easy to test. */
export function mapCompliance(input: EngineInput): EngineOutput {
  const { bar, psi, kgcm2 } = convertPressure(input.pressure, input.unit);

  let result: Result;
  switch (input.region) {
    case "us":
      result = computeUS(input.equip, psi);
      break;
    case "eu":
    case "uk":
      result = computePED(input.region, bar, input.volumeL, input.category);
      break;
    case "in":
      result = computeIndia(input.equip, kgcm2, input.volumeL);
      break;
    case "cn":
      result = computeSimple(CHINA_RULES, input.equip);
      break;
    case "au":
      result = computeSimple(AU_RULES, input.equip);
      break;
  }

  return { result, bar, psi, kgcm2 };
}
