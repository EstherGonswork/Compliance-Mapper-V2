import { EXPLAINER } from "@/data/explainer";
import { PED_RULES } from "@/data/rules";
import { fill } from "@/lib/format";
import type { EngineOutput, RegionId } from "@/lib/types";

export interface Explanation {
  sections: { heading: string; text: string }[];
}

/** Builds the free written explanation from the rules and the result. No network call. */
export function explain(region: RegionId, out: EngineOutput): Explanation {
  const body = region === "eu" || region === "uk" ? PED_RULES.variants[region].body : "";
  const vars = { body, code: out.result.code };
  const h = EXPLAINER.headings;

  const first = [fill(EXPLAINER.first[region], vars)];
  if ((region === "eu" || region === "uk") && out.result.callout) first.push(fill(EXPLAINER.openCategory, vars));

  return {
    sections: [
      { heading: h.plain, text: fill(EXPLAINER.plain[region], vars) },
      { heading: h.why, text: out.result.detail },
      { heading: h.first, text: first.join(" ") },
      { heading: h.watch, text: fill(EXPLAINER.watch[region], vars) },
    ],
  };
}
