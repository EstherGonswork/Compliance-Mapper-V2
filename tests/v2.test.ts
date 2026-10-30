import { describe, expect, it, vi } from "vitest";
import { AI } from "@/data/ai";
import { REGIONS } from "@/data/rules";
import { AiError } from "@/lib/aiClient";
import { EXPLAIN_TOOL, explainWithAi, factsFrom, normaliseExplanation, SYSTEM_PROMPT, TOOL_NAME } from "@/lib/aiExplain";
import { glanceRows } from "@/lib/compare";
import { mapCompliance } from "@/lib/engine";
import { explain } from "@/lib/explain";
import { DEFAULT_STATE, stateFromQuery, stateToQuery, type FormState } from "@/lib/share";
import type { EngineInput, RegionId } from "@/lib/types";

const REGION_IDS = Object.keys(REGIONS) as RegionId[];
const input = (patch: Partial<EngineInput> = {}): EngineInput => ({
  region: "us", equip: "steam", pressure: 12, unit: "bar", volumeL: null, category: "", ...patch,
});
const state: FormState = { ...DEFAULT_STATE };

describe("share link with compare", () => {
  it("round-trips the second region", () => {
    const s: FormState = { ...DEFAULT_STATE, region: "us", compare: "uk" };
    expect(stateFromQuery(stateToQuery(s))).toEqual(s);
  });
  it("leaves compare out of the link when it is off", () => {
    expect(stateToQuery(DEFAULT_STATE)).not.toContain("cmp");
  });
  it("ignores an unknown or repeated second region", () => {
    expect(stateFromQuery("region=us&cmp=xx").compare).toBe("");
    expect(stateFromQuery("region=us&cmp=us").compare).toBe("");
  });
  it("opens old V1 links with compare off", () => {
    expect(stateFromQuery("region=eu&equip=steam&p=12&unit=bar").compare).toBe("");
  });
});

describe("comparison rows", () => {
  it("lists code, marking, request count and open step for each side", () => {
    const a = mapCompliance(input({ region: "us" }));
    const b = mapCompliance(input({ region: "eu" }));
    const rows = glanceRows(a, b);
    expect(rows.map((r) => r.label)).toEqual(["Applicable code", "Marking / certification", "Items to request", "Open step"]);
    expect(rows[0].a).toBe(a.result.code);
    expect(rows[0].b).toBe(b.result.code);
    expect(rows[3].b).toBe("Yes, see the card");
    expect(rows[3].a).toBe("None");
  });
});

describe("free explainer", () => {
  it("fills every placeholder and avoids em dashes for all regions", () => {
    for (const region of REGION_IDS) {
      const out = mapCompliance(input({ region, volumeL: 500 }));
      const e = explain(region, out);
      expect(e.sections).toHaveLength(4);
      for (const s of e.sections) {
        expect(s.text.length).toBeGreaterThan(0);
        expect(s.text).not.toMatch(/\{\w+\}/);
        expect(s.text).not.toContain("\u2014");
      }
    }
  });
  it("names the EU and UK reviewing bodies", () => {
    expect(explain("eu", mapCompliance(input({ region: "eu" }))).sections[2].text).toContain("EU Notified Body");
    expect(explain("uk", mapCompliance(input({ region: "uk" }))).sections[2].text).toContain("UK Approved Body");
  });
  it("mentions the open category only when the EU result needs one", () => {
    const open = explain("eu", mapCompliance(input({ region: "eu" }))).sections[2].text;
    const set = explain("eu", mapCompliance(input({ region: "eu", category: "II" }))).sections[2].text;
    expect(open).toContain("category is still open");
    expect(set).not.toContain("category is still open");
  });
  it("uses the result detail as the why section", () => {
    const out = mapCompliance(input({ region: "in", equip: "hotwater" }));
    expect(explain("in", out).sections[1].text).toBe(out.result.detail);
  });
});

describe("AI explainer", () => {
  const KEY = "sk-ant-test-123";
  const toolInput = { explanation: "Plain words.", questions: ["Q1?", "Q2?", "Q3?"] };
  const ok = () =>
    new Response(JSON.stringify({ stop_reason: "tool_use", content: [{ type: "tool_use", name: TOOL_NAME, input: toolInput }] }), { status: 200 });
  const out = mapCompliance(input({ region: "eu", volumeL: 500 }));

  it("sends facts from the rules engine and the key only in the header", async () => {
    const f = vi.fn().mockResolvedValue(ok());
    const r = await explainWithAi("eu", state, out, KEY, "claude-haiku-5-5", f);
    expect(r.questions).toHaveLength(3);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe(AI.endpoint);
    expect(init.headers["x-api-key"]).toBe(KEY);
    expect(init.headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    const body = JSON.parse(init.body);
    expect(body.tool_choice).toEqual({ type: "tool", name: TOOL_NAME });
    expect(body.messages[0].content).toContain("<result_to_explain>");
    expect(body.messages[0].content).toContain(out.result.code);
    expect(JSON.stringify(body)).not.toContain(KEY);
    expect(body.system).toBe(SYSTEM_PROMPT);
  });
  it("builds facts without the key or the address", () => {
    const facts = factsFrom("eu", state, out);
    expect(facts.region).toBe("European Union");
    expect(facts.checklist.length).toBeGreaterThan(0);
  });
  it("defines a forced three-question tool", () => {
    expect(EXPLAIN_TOOL.input_schema.required).toEqual(["explanation", "questions"]);
  });
  it.each([[401, "key"], [403, "key"], [429, "limit"], [529, "busy"], [404, "model"], [400, "bad"]])(
    "maps status %i to %s",
    async (status, kind) => {
      const f = vi.fn().mockResolvedValue(new Response("{}", { status }));
      await expect(explainWithAi("eu", state, out, KEY, "m", f)).rejects.toMatchObject({ kind });
    },
  );
  it("rejects a key with the wrong shape before any request", async () => {
    const f = vi.fn();
    await expect(explainWithAi("eu", state, out, "abc", "m", f)).rejects.toMatchObject({ kind: "key" });
    await expect(explainWithAi("eu", state, out, " ", "m", f)).rejects.toMatchObject({ kind: "key" });
    expect(f).not.toHaveBeenCalled();
  });
  it("maps a network failure", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(explainWithAi("eu", state, out, KEY, "m", f)).rejects.toMatchObject({ kind: "network" });
  });
  it("rejects replies with missing parts", () => {
    expect(() => normaliseExplanation(null)).toThrow(AiError);
    expect(() => normaliseExplanation({ explanation: "", questions: ["a"] })).toThrow(AiError);
    expect(() => normaliseExplanation({ explanation: "x", questions: [] })).toThrow(AiError);
  });
  it("trims long text and keeps three questions", () => {
    const r = normaliseExplanation({ explanation: "x".repeat(3000), questions: ["a", "b", "c", "d"] });
    expect(r.explanation.length).toBe(1400);
    expect(r.questions).toHaveLength(3);
  });
});
