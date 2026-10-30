import { describe, expect, it } from "vitest";
import { mapCompliance } from "@/lib/engine";
import type { EngineInput } from "@/lib/types";

const base: EngineInput = {
  region: "us",
  equip: "steam",
  pressure: 10,
  unit: "psi",
  volumeL: null,
  category: "",
};
const run = (patch: Partial<EngineInput>) => mapCompliance({ ...base, ...patch }).result;

describe("United States thresholds", () => {
  it("keeps steam at exactly 15 psig in Section IV", () => {
    expect(run({ pressure: 15, unit: "psi" }).code).toContain("Section IV");
  });
  it("moves steam above 15 psig to Section I", () => {
    expect(run({ pressure: 15.01, unit: "psi" }).code).toContain("Section I:");
  });
  it("keeps hot water at 160 psig in Section IV and moves 161 to Section I", () => {
    expect(run({ equip: "hotwater", pressure: 160 }).code).toContain("Section IV");
    expect(run({ equip: "hotwater", pressure: 161 }).code).toContain("Section I:");
  });
  it("walks the Section VIII ladder", () => {
    const code = (pressure: number) => run({ equip: "vesselpart", pressure }).code;
    expect(code(15)).toBe("Below Section VIII scope");
    expect(code(16)).toContain("Division 1");
    expect(code(3000)).toContain("Division 1");
    expect(code(3001)).toContain("Division 2");
    expect(code(9999)).toContain("Division 2");
    expect(code(10000)).toContain("Division 3");
  });
  it("fills the limit into the text of the last band", () => {
    expect(run({ pressure: 20 }).detail).toContain("exceeds the 15 psig threshold");
  });
});

describe("unit conversion", () => {
  it("keeps the typed value exact in its own unit", () => {
    const out = mapCompliance({ ...base, pressure: 15, unit: "psi" });
    expect(out.psi).toBe(15);
    const kg = mapCompliance({ ...base, region: "in", pressure: 1, unit: "kgcm2" });
    expect(kg.kgcm2).toBe(1);
  });
  it("converts bar to psi", () => {
    expect(mapCompliance({ ...base, pressure: 1, unit: "bar" }).psi).toBeCloseTo(14.5038, 4);
  });
});

describe("India thresholds", () => {
  const india = (patch: Partial<EngineInput>) => run({ region: "in", unit: "kgcm2", ...patch });
  it("needs certification above 22.75 litres", () => {
    expect(india({ pressure: 0.5, volumeL: 22.75 }).code).toContain("Check against");
    expect(india({ pressure: 0.5, volumeL: 22.76 }).code).toContain("full certification");
  });
  it("needs certification above 1 kg/cm2", () => {
    expect(india({ pressure: 1 }).code).toContain("Check against");
    expect(india({ pressure: 1.01 }).code).toContain("full certification");
  });
  it("applies the 3.5 kg/cm2 pipe threshold", () => {
    expect(india({ equip: "vesselpart", pressure: 3.5 }).code).toContain("Check diameter");
    expect(india({ equip: "vesselpart", pressure: 3.6 }).code).toContain("steam pipe");
  });
  it("mentions the entered volume only when there is one", () => {
    expect(india({ pressure: 0.5, volumeL: 10 }).detail).toContain("and 10 litres");
    expect(india({ pressure: 0.5 }).detail).not.toMatch(/ and \d+ litres/);
  });
});

describe("EU and UK pressure equipment rules", () => {
  const ped = (region: "eu" | "uk", patch: Partial<EngineInput>) =>
    run({ region, unit: "bar", pressure: 5, ...patch });

  it("treats 0.5 bar as outside scope and 0.51 as in scope", () => {
    expect(ped("eu", { pressure: 0.5 }).code).toBe("Outside PED 2014/68/EU scope");
    expect(ped("eu", { pressure: 0.51 }).code).toContain("in scope");
  });
  it("uses CE and Notified Body wording for the EU", () => {
    const r = ped("eu", { category: "I" });
    expect(r.detail).toContain("CE marking");
    expect(r.marking).toContain("CE marking");
  });
  it("uses UKCA and Approved Body wording for the UK", () => {
    const r = ped("uk", { category: "III" });
    expect(r.code).toBe("PESR 2016: Category III");
    expect(r.detail).toContain("UK Approved Body");
    expect(r.marking).toContain("UKCA");
  });
  it("shows no marking and an internal records item for SEP", () => {
    const r = ped("eu", { category: "sep" });
    expect(r.marking).toBe("None");
    expect(r.checklist.at(-1)).toContain("Internal design");
  });
  it("adds the next step when the category is unknown", () => {
    const r = ped("uk", { volumeL: 500 });
    expect(r.callout).toContain("UK Approved Body");
    expect(r.detail).toContain("and 500 litres");
  });
});

describe("China and Australia", () => {
  it("picks vessel or boiler wording by equipment", () => {
    expect(run({ region: "cn", equip: "vesselpart" }).code).toContain("TSG 21-2016");
    expect(run({ region: "cn", equip: "steam" }).code).toContain("TSG 11-2020");
    expect(run({ region: "au", equip: "vesselpart" }).code).toContain("AS 1210");
    expect(run({ region: "au", equip: "hotwater" }).code).toContain("AS 1228");
  });
});

describe("rules data hygiene", () => {
  it("leaves no unfilled placeholder and no em dash in any output", () => {
    const regions = ["us", "eu", "uk", "in", "cn", "au"] as const;
    const equips = ["steam", "hotwater", "vesselpart"] as const;
    const cats = ["", "sep", "I", "II", "III", "IV"] as const;
    for (const region of regions)
      for (const equip of equips)
        for (const category of cats)
          for (const pressure of [0.3, 1, 12, 200, 5000, 20000])
            for (const volumeL of [null, 30]) {
              const r = mapCompliance({ region, equip, pressure, unit: "bar", volumeL, category }).result;
              const text = [r.code, r.detail, r.marking, r.callout ?? "", ...r.checklist].join("\n");
              expect(text).not.toMatch(/[{}]/);
              expect(text).not.toContain("\u2014");
            }
  });
});
