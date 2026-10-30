import { AI, AI_COPY, MODELS } from "@/data/ai";

interface Props {
  apiKey: string;
  onKey: (value: string) => void;
  remember: boolean;
  onRemember: (value: boolean) => void;
  model: string;
  onModel: (id: string) => void;
  onForget: () => void;
}

export function KeyPanel({ apiKey, onKey, remember, onRemember, model, onModel, onForget }: Props) {
  return (
    <details className="bt-ai">
      <summary>{AI_COPY.summary}</summary>
      <div className="bt-ai-body">
        <p className="bt-ai-intro">{AI_COPY.intro}</p>
        <div className="bt-ai-row">
          <div className="bt-field">
            <label htmlFor="bt-key">{AI_COPY.keyLabel}</label>
            <input
              id="bt-key"
              type="password"
              value={apiKey}
              onChange={(e) => onKey(e.target.value)}
              placeholder={AI_COPY.keyPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
          <div className="bt-field">
            <label htmlFor="bt-model">{AI_COPY.modelLabel}</label>
            <select id="bt-model" value={model} onChange={(e) => onModel(e.target.value)}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="bt-ai-actions">
          <label className="bt-check">
            <input type="checkbox" checked={remember} onChange={(e) => onRemember(e.target.checked)} />
            {AI_COPY.remember}
          </label>
          <button type="button" className="bt-copy" onClick={onForget} disabled={!apiKey && !remember}>
            {AI_COPY.forget}
          </button>
          <a href={AI.consoleUrl} target="_blank" rel="noopener noreferrer" className="bt-link">
            {AI_COPY.getKey}
          </a>
        </div>
        <p className="bt-ai-warn">{AI_COPY.warning}</p>
      </div>
    </details>
  );
}
