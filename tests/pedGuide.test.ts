import { describe, expect, it } from "vitest";
import { PED_TABLES, type PedTable } from "@/data/ped";
import { guideCategory, pickTable } from "@/lib/pedGuide";

const vessel = (state: "gas" | "liquid", group: 1 | 2, ps: number, size: number | null) =>
  guideCategory({ kind: "vessel", state, group, pressureBar: ps, size });
const piping = (state: "gas" | "liquid", group: 1 | 2, ps: number, size: number | null) =>
  guideCategory({ kind: "piping", state, group, pressureBar: ps, size });

describe("table choice", () => {
  it("maps every answer to the right Annex II table", () => {
    const pick = (kind: any, state: any, group: any) => pickTable(kind, state, group)?.id;
    expect(pick("vessel", "gas", 1)).toBe(1);
    expect(pick("vessel", "gas", 2)).toBe(2);
    expect(pick("vessel", "liquid", 1)).toBe(3);
    expect(pick("vessel", "liquid", 2)).toBe(4);
    expect(pick("heated", "gas", 2)).toBe(5);
    expect(pick("piping", "gas", 1)).toBe(6);
    expect(pick("piping", "gas", 2)).toBe(7);
    expect(pick("piping", "liquid", 1)).toBe(8);
    expect(pick("piping", "liquid", 2)).toBe(9);
  });
  it("has nine unique tables", () => {
    expect(PED_TABLES.map((t) => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe("scope and missing size", () => {
  it("treats 0.5 bar and below as outside", () => {
    expect(vessel("gas", 2, 0.5, 100).status).toBe("outside");
    expect(vessel("gas", 2, 0.51, 100).status).not.toBe("outside");
  });
  it("asks for a size when none is given", () => {
    expect(vessel("gas", 2, 5, null).status).toBe("needsSize");
    expect(vessel("gas", 2, 5, 0).status).toBe("needsSize");
    expect(piping("gas", 2, 5, null).message).toContain("DN");
  });
});

describe("entry limits", () => {
  it("Table 1: V over 1 L and PS×V over 25, or PS over 200", () => {
    expect(vessel("gas", 1, 25, 1).status).toBe("sep");
    expect(vessel("gas", 1, 25.1, 1.01).status).toBe("inScope");
    expect(vessel("gas", 1, 5, 5).status).toBe("sep"); // PS×V = 25 sits on the line
    expect(vessel("gas", 1, 5, 5.1).status).toBe("inScope");
    expect(vessel("gas", 1, 200, 0.5).status).toBe("sep");
    expect(vessel("gas", 1, 201, 0.5).status).toBe("inScope");
  });
  it("Table 2: PS×V over 50, or PS over 1000", () => {
    expect(vessel("gas", 2, 10, 5).status).toBe("sep");
    expect(vessel("gas", 2, 10, 5.1).status).toBe("inScope");
    expect(vessel("gas", 2, 1001, 0.1).status).toBe("inScope");
  });
  it("Table 3: PS×V over 200, or PS over 500", () => {
    expect(vessel("liquid", 1, 20, 10).status).toBe("sep");
    expect(vessel("liquid", 1, 20, 10.1).status).toBe("inScope");
    expect(vessel("liquid", 1, 501, 0.1).status).toBe("inScope");
  });
  it("Table 4: PS over 10 and PS×V over 10000, or PS over 1000", () => {
    expect(vessel("liquid", 2, 10, 5000).status).toBe("sep");
    expect(vessel("liquid", 2, 11, 900).status).toBe("sep");
    expect(vessel("liquid", 2, 11, 910).status).toBe("inScope");
    expect(vessel("liquid", 2, 1001, 1).status).toBe("inScope");
  });
  it("Table 5: heated equipment over 2 L", () => {
    const heated = (v: number) => guideCategory({ kind: "heated", state: "gas", group: 2, pressureBar: 12, size: v });
    expect(heated(2).status).toBe("sep");
    expect(heated(2.1).status).toBe("inScope");
  });
  it("Table 6: piping Group 1 gas over DN 25", () => {
    expect(piping("gas", 1, 40, 25).status).toBe("sep");
    expect(piping("gas", 1, 40, 26).status).toBe("inScope");
  });
  it("Table 7: DN over 32 and PS×DN over 1000", () => {
    expect(piping("gas", 2, 40, 25).status).toBe("sep");
    expect(piping("gas", 2, 10, 100).status).toBe("sep"); // PS×DN = 1000 on the line
    expect(piping("gas", 2, 10.1, 100).status).toBe("inScope");
    expect(piping("gas", 2, 100, 32).status).toBe("sep");
  });
  it("Table 8: DN over 25 and PS×DN over 2000", () => {
    expect(piping("liquid", 1, 100, 20).status).toBe("sep");
    expect(piping("liquid", 1, 80, 25).status).toBe("sep");
    expect(piping("liquid", 1, 76, 26).status).toBe("sep"); // PS×DN = 1976, under 2000
    expect(piping("liquid", 1, 80, 26).status).toBe("inScope"); // PS×DN = 2080, DN over 25
    expect(piping("liquid", 1, 100, 26).status).toBe("inScope");
  });
  it("Table 9: PS over 10, DN over 200 and PS×DN over 5000", () => {
    expect(piping("liquid", 2, 10, 600).status).toBe("sep");
    expect(piping("liquid", 2, 30, 200).status).toBe("sep");
    expect(piping("liquid", 2, 30, 201).status).toBe("inScope");
    expect(piping("liquid", 2, 20, 201).status).toBe("sep"); // PS×DN = 4020, under 5000
    expect(piping("liquid", 2, 25, 201).status).toBe("inScope"); // PS×DN = 5025
  });
});

describe("category bands", () => {
  const withBands = (bands: PedTable["bands"]): PedTable[] =>
    PED_TABLES.map((t) => (t.id === 2 ? { ...t, bands } : t));
  const bands: PedTable["bands"] = [
    { category: "I", max: { psv: 100 } },
    { category: "II", max: { psv: 400 } },
    { category: "III", max: { psv: 2000, ps: 100 } },
    { category: "IV", max: {} },
  ];
  const run = (ps: number, v: number) =>
    guideCategory({ kind: "vessel", state: "gas", group: 2, pressureBar: ps, size: v }, withBands(bands));

  it("names the category from the bands", () => {
    expect(run(10, 8)).toMatchObject({ status: "category", category: "I" });
    expect(run(10, 20)).toMatchObject({ status: "category", category: "II" });
    expect(run(10, 100)).toMatchObject({ status: "category", category: "III" });
    expect(run(150, 100)).toMatchObject({ status: "category", category: "IV" });
  });
  it("puts a point on a line in the lower category", () => {
    expect(run(10, 10)).toMatchObject({ category: "I" }); // PS×V = 100 exactly
    expect(run(10, 10.01)).toMatchObject({ category: "II" });
  });
  it("still returns SEP below the entry limits", () => {
    expect(run(5, 5)).toMatchObject({ status: "sep" });
  });
  it("shipped tables name SEP only and leave categories to the table", () => {
    const r = vessel("gas", 2, 12, 500);
    expect(r.status).toBe("inScope");
    expect(r.message).toContain("Table 2");
    expect(r.message).toContain("6000");
  });
});
