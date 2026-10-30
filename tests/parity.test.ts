/**
 * Regression check against the original single-file HTML tool.
 * It loads the calculation code from the old page, runs both versions over a grid of inputs,
 * and expects the same code name, detail, marking, checklist and next step.
 * The only differences allowed are the wording edits listed in REWORDINGS below.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mapCompliance } from "@/lib/engine";
import type { CategoryId, EquipId, RegionId, UnitId } from "@/lib/types";

const html = readFileSync(path.join(__dirname, "fixtures/original-index.html"), "utf8");
const start = html.indexOf("const PSI_PER_BAR");
const end = html.indexOf("function render(");
const original = new Function(
  `${html.slice(start, end)}; return { toBar, PSI_PER_BAR, KGCM2_PER_BAR, computeUS, computeIndia, computePED, computeChina, computeAU };`,
)() as {
  toBar: (v: number, u: string) => number;
  PSI_PER_BAR: number;
  KGCM2_PER_BAR: number;
  computeUS: Function;
  computeIndia: Function;
  computePED: Function;
  computeChina: Function;
  computeAU: Function;
};

/** Wording edits made on purpose in the new version. Each pair is [old text, new text]. */
const REWORDINGS: [string, string][] = [
  [
    "Confirm no other directive applies \u2014 e.g. the Machinery Directive \u2014 before treating this as fully exempt.",
    "Confirm no other directive applies, such as the Machinery Directive, before treating this as fully exempt.",
  ],
  [
    "pressure × volume \u2014 or pressure × diameter for piping \u2014 against fluid group",
    "pressure × volume (or pressure × diameter for piping) against fluid group",
  ],
  [
    "so that cross-reference isn't reducible to a single number here.",
    "so the cross-reference needs the full table and cannot be reduced to one number here.",
  ],
  [
    "for the Annex II table reference they used \u2014 that's the fastest way to confirm it.",
    "for the Annex II table reference they used. That is the fastest way to confirm it.",
  ],
  [") \u2014 typically around", "), typically around"],
  [
    "Class boundaries depend on pressure, volume, and medium together \u2014 ask your supplier which TSG class they're certifying to rather than inferring it from pressure alone.",
    "Class boundaries depend on pressure, volume, and medium together. Ask your supplier which TSG class they are certifying to.",
  ],
  [
    "Hazard Level depends on pressure, volume, temperature, and fluid type together \u2014 ask your supplier for the AS 4343 hazard level they've assigned rather than estimating it from pressure alone.",
    "Hazard Level depends on pressure, volume, temperature, and fluid type together. Ask your supplier for the AS 4343 hazard level they have assigned.",
  ],
];

function normalise(text: string): string {
  let out = text;
  for (const [from, to] of REWORDINGS) out = out.split(from).join(to);
  return out.replace(/\s\u2014\s/g, ": ");
}

function runOriginal(region: RegionId, equip: EquipId, value: number, unit: UnitId, volume: number | null, cat: string) {
  const bar = original.toBar(value, unit);
  const psi = bar * original.PSI_PER_BAR;
  const kgcm2 = bar * original.KGCM2_PER_BAR;
  switch (region) {
    case "us": return original.computeUS(equip, psi);
    case "eu": return original.computePED(bar, volume, cat, false);
    case "uk": return original.computePED(bar, volume, cat, true);
    case "in": return original.computeIndia(equip, kgcm2, volume);
    case "cn": return original.computeChina(equip);
    case "au": return original.computeAU(equip);
  }
}

describe("matches the original HTML tool", () => {
  const regions: RegionId[] = ["us", "eu", "uk", "in", "cn", "au"];
  const equips: EquipId[] = ["steam", "hotwater", "vesselpart"];
  const units: UnitId[] = ["bar", "psi", "kgcm2"];
  const values = [0.3, 0.5, 0.75, 1.5, 3.7, 4.2, 12, 17, 22, 150, 170, 3100, 8000, 12000];
  const volumes = [null, 10, 25, 500];
  const cats = ["", "sep", "I", "II", "III", "IV"];

  it("gives the same answer across the whole input grid", () => {
    let compared = 0;
    for (const region of regions)
      for (const equip of equips)
        for (const unit of units)
          for (const value of values)
            for (const volumeL of volumes)
              for (const category of cats) {
                const expected = runOriginal(region, equip, value, unit, volumeL, category);
                const actual = mapCompliance({ region, equip, pressure: value, unit, volumeL, category: category as CategoryId | "" }).result;
                const label = `${region}/${equip}/${value}${unit}/vol ${volumeL}/cat ${category}`;
                expect(normalise(expected.code), label).toBe(actual.code);
                expect(normalise(expected.detail), label).toBe(actual.detail);
                expect(normalise(expected.marking), label).toBe(actual.marking);
                expect(expected.checklist.map(normalise), label).toEqual(actual.checklist);
                expect(expected.callout === null ? null : normalise(expected.callout), label).toBe(actual.callout);
                compared++;
              }
    expect(compared).toBeGreaterThan(10000);
  });
});
