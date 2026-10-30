"use client";

import { useState } from "react";
import { AI_COPY } from "@/data/ai";
import { COPY } from "@/data/copy";
import { AiError } from "@/lib/aiClient";
import { explainWithAi, type AiExplanation } from "@/lib/aiExplain";
import { explain } from "@/lib/explain";
import type { FormState } from "@/lib/share";
import type { EngineOutput, RegionId } from "@/lib/types";

interface Props {
  region: RegionId;
  state: FormState;
  output: EngineOutput;
  apiKey: string;
  model: string;
}

type Status = "idle" | "loading" | "done" | "error";

export function Explainer({ region, state, output, apiKey, model }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [ai, setAi] = useState<AiExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const written = explain(region, output);
  const hasKey = apiKey.trim() !== "";

  async function run() {
    setStatus("loading");
    setError(null);
    try {
      setAi(await explainWithAi(region, state, output, apiKey, model));
      setStatus("done");
    } catch (e) {
      setError(e instanceof AiError ? e.message : "Something went wrong. Try again.");
      setStatus("error");
    }
  }

  return (
    <details className="bt-explain">
      <summary>{COPY.explain.summary}</summary>
      <div className="bt-explain-body">
        {written.sections.map((s) => (
          <div key={s.heading} className="bt-explain-block">
            <h4>{s.heading}</h4>
            <p>{s.text}</p>
          </div>
        ))}

        <div className="bt-explain-ai">
          <button type="button" className="bt-copy" onClick={run} disabled={!hasKey || status === "loading"}>
            {status === "loading" ? AI_COPY.busy : AI_COPY.button}
          </button>
          {!hasKey && <span className="bt-note">{AI_COPY.needKey}</span>}
        </div>

        {status === "error" && error && (
          <p className="bt-error" role="alert">
            {error}
          </p>
        )}

        {status === "done" && ai && (
          <div className="bt-ai-result" aria-live="polite">
            <h4>{AI_COPY.heading}</h4>
            <p>{ai.explanation}</p>
            <h4>{AI_COPY.questions}</h4>
            <ul className="bt-checklist">
              {ai.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="bt-note">{AI_COPY.caution}</p>
          </div>
        )}
      </div>
    </details>
  );
}
