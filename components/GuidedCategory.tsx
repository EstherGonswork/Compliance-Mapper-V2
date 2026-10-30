"use client";

import { useMemo, useState } from "react";
import { COPY } from "@/data/copy";
import {
  GROUP_OPTIONS,
  GUIDE_TEXT,
  KIND_OPTIONS,
  STATE_OPTIONS,
  type PedGroup,
  type PedKind,
  type PedState,
} from "@/data/ped";
import { guideCategory } from "@/lib/pedGuide";
import type { CategoryId } from "@/lib/types";

interface Props {
  /** Pressure from the main form in bar, or null when it is not valid yet. */
  pressureBar: number | null;
  /** Volume typed in the main form, used to fill the size box when the guide opens. */
  initialVolume: string;
  applied: CategoryId | "";
  onApply: (category: CategoryId) => void;
}

export function GuidedCategory({ pressureBar, initialVolume, applied, onApply }: Props) {
  const g = COPY.guide;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PedKind>("vessel");
  const [state, setState] = useState<PedState>("gas");
  const [group, setGroup] = useState<PedGroup>(2);
  const [size, setSize] = useState(initialVolume);
  const sizeNumber = size.trim() === "" ? null : Number(size);

  const result = useMemo(() => {
    if (pressureBar === null) return null;
    return guideCategory({
      kind,
      state,
      group,
      pressureBar,
      size: sizeNumber !== null && Number.isFinite(sizeNumber) ? sizeNumber : null,
    });
  }, [pressureBar, kind, state, group, sizeNumber]);

  const sizeKind = kind === "piping" ? "dn" : "volume";
  const applyCategory = result && (result.status === "sep" || result.status === "category") ? result.category : null;

  return (
    <div className="bt-guide">
      <button
        type="button"
        className="bt-copy"
        aria-expanded={open}
        aria-controls="bt-guide-panel"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? g.close : g.open}
      </button>

      {open && (
        <div id="bt-guide-panel" className="bt-guide-panel" role="group" aria-label={g.title}>
          <div className="bt-guide-grid">
            <div className="bt-field">
              <label htmlFor="bt-g-kind">{g.kind}</label>
              <select id="bt-g-kind" value={kind} onChange={(e) => setKind(e.target.value as PedKind)}>
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {kind !== "heated" && (
              <>
                <div className="bt-field">
                  <label htmlFor="bt-g-state">{g.state}</label>
                  <select id="bt-g-state" value={state} onChange={(e) => setState(e.target.value as PedState)}>
                    {STATE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bt-field">
                  <label htmlFor="bt-g-group">{g.group}</label>
                  <select id="bt-g-group" value={group} onChange={(e) => setGroup(Number(e.target.value) as PedGroup)}>
                    {GROUP_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="bt-field">
              <label htmlFor="bt-g-size">{sizeKind === "dn" ? g.dn : g.volume}</label>
              <input
                id="bt-g-size"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
          </div>

          <p className="bt-guide-result" aria-live="polite">
            {pressureBar === null ? "Enter a valid operating pressure above to use the guide." : result?.message}
          </p>

          {result && result.status !== "outside" && result.status !== "needsSize" && (
            <p className="bt-note">{result.table.label}</p>
          )}

          <div className="bt-guide-actions">
            {applyCategory && (
              <button type="button" className="bt-copy" onClick={() => onApply(applyCategory)}>
                {applyCategory === "sep" ? g.useSep : `${g.useCategory} ${applyCategory}`}
              </button>
            )}
            {applyCategory && applied === applyCategory && <span className="bt-note">{g.applied}</span>}
          </div>
          <p className="bt-note">{GUIDE_TEXT.note}</p>
        </div>
      )}
    </div>
  );
}
