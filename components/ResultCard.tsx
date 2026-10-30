import { EQUIPMENT, REGIONS } from "@/data/rules";
import { fmt } from "@/lib/format";
import type { FormState } from "@/lib/share";
import type { EngineOutput, RegionId } from "@/lib/types";
import { Explainer } from "./Explainer";

interface Props {
  region: RegionId;
  state: FormState;
  output: EngineOutput;
  onCopy: () => void;
  copied: boolean;
  apiKey: string;
  model: string;
}

export function ResultCard({ region, state, output, onCopy, copied, apiKey, model }: Props) {
  const { result, bar, psi, kgcm2 } = output;
  const info = REGIONS[region];

  return (
    <div className="bt-result">
      <div className="bt-result-top">
        <div className="bt-result-tag">
          {info.flag} {info.name} · {EQUIPMENT[state.equip]}
        </div>
        <button type="button" className="bt-copy" onClick={onCopy}>
          {copied ? "Copied" : "Copy summary"}
        </button>
      </div>
      <div className="bt-conv">
        Entered as {fmt(bar)} bar ≈ {fmt(psi)} psi ≈ {fmt(kgcm2)} kg/cm²
      </div>

      <section className="bt-section">
        <h3>Applicable code</h3>
        <p className="bt-code-name">{result.code}</p>
        <p className="bt-detail">{result.detail}</p>
      </section>

      <section className="bt-section">
        <h3>Marking / certification</h3>
        <p className="bt-detail">{result.marking}</p>
      </section>

      <section className="bt-section">
        <h3>What to request from your supplier</h3>
        <ul className="bt-checklist">
          {result.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {result.callout && (
        <div className="bt-callout">
          <strong>Next step:</strong> {result.callout}
        </div>
      )}

      <Explainer
        key={`${region}|${state.equip}|${state.pressure}|${state.unit}|${state.volume}|${state.category}`}
        region={region}
        state={state}
        output={output}
        apiKey={apiKey}
        model={model}
      />
    </div>
  );
}
