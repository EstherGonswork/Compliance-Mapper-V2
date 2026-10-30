"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MODEL, MODELS } from "@/data/ai";
import { COPY } from "@/data/copy";
import { CATEGORY_OPTIONS, EQUIPMENT, REGIONS, REGION_FIELDS, UNIT_OPTIONS } from "@/data/rules";
import { convertPressure, mapCompliance } from "@/lib/engine";
import { clearKey, loadKey, loadModel, saveKey, saveModel } from "@/lib/keyStore";
import {
  buildSummary,
  DEFAULT_STATE,
  stateFromQuery,
  stateToQuery,
  type FormState,
} from "@/lib/share";
import type { CategoryId, EngineOutput, EquipId, RegionId, UnitId } from "@/lib/types";
import { CompareGlance } from "./CompareGlance";
import { GuidedCategory } from "./GuidedCategory";
import { KeyPanel } from "./KeyPanel";
import { ResultCard } from "./ResultCard";

const REGION_IDS = Object.keys(REGIONS) as RegionId[];

export function Mapper() {
  const [state, setState] = useState<FormState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState<RegionId | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);

  // Load any inputs from the link, and any saved key, once the page is in the browser.
  useEffect(() => {
    if (window.location.search) setState(stateFromQuery(window.location.search));
    const saved = loadKey();
    if (saved) {
      setApiKey(saved);
      setRemember(true);
    }
    const savedModel = loadModel();
    if (savedModel && MODELS.some((m) => m.id === savedModel)) setModel(savedModel);
    setReady(true);
  }, []);

  // Keep the address bar in step with the inputs, so any result can be shared as a link.
  useEffect(() => {
    if (!ready) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${stateToQuery(state)}`);
  }, [state, ready]);

  // Keep the saved key in step with the tick box and the field.
  useEffect(() => {
    if (!ready) return;
    if (remember && apiKey) saveKey(apiKey);
    if (!remember) clearKey();
  }, [remember, apiKey, ready]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const regions: RegionId[] = state.compare ? [state.region, state.compare] : [state.region];
  const volumeRegion = regions.find((r) => REGION_FIELDS[r].volume);
  const showVolume = volumeRegion !== undefined;
  const showCategory = regions.some((r) => REGION_FIELDS[r].category);

  const pressure = parseFloat(state.pressure);
  const volume = state.volume !== "" ? parseFloat(state.volume) : null;
  const valid = !Number.isNaN(pressure) && pressure > 0;

  const outputs = useMemo(() => {
    if (!valid) return null;
    return regions.map((region): { region: RegionId; output: EngineOutput } => ({
      region,
      output: mapCompliance({
        region,
        equip: state.equip,
        pressure,
        unit: state.unit,
        volumeL: REGION_FIELDS[region].volume ? volume : null,
        category: REGION_FIELDS[region].category ? state.category : "",
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, state, pressure, volume]);

  const pressureBar = valid ? convertPressure(pressure, state.unit).bar : null;

  const update = (patch: Partial<FormState>) =>
    setState((s) => {
      const next = { ...s, ...patch };
      if (next.compare === next.region) next.compare = "";
      return next;
    });

  function toggleCompare(on: boolean) {
    if (!on) return update({ compare: "" });
    update({ compare: state.region === "eu" ? "us" : "eu" });
  }

  async function copySummary(region: RegionId, output: EngineOutput) {
    const text = buildSummary({ ...state, region }, output);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(region);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 1800);
    } catch {
      window.prompt("Copy this summary:", text);
    }
  }

  function changeModel(id: string) {
    setModel(id);
    saveModel(id);
  }

  function forgetKey() {
    setApiKey("");
    setRemember(false);
    clearKey();
  }

  const volumeHelp = volumeRegion ? REGION_FIELDS[volumeRegion].volumeHelp : "";

  return (
    <div className="bt-root">
      <div className="bt-card">
        <header className="bt-header">
          <p className="bt-eyebrow">{COPY.eyebrow}</p>
          <h1>{COPY.title}</h1>
          <p>{COPY.intro}</p>
        </header>

        <div className="bt-form">
          <div className="bt-field">
            <label htmlFor="bt-region">Target region</label>
            <select
              id="bt-region"
              value={state.region}
              onChange={(e) => update({ region: e.target.value as RegionId })}
            >
              {REGION_IDS.map((id) => (
                <option key={id} value={id}>
                  {REGIONS[id].flag} {REGIONS[id].name}
                </option>
              ))}
            </select>
          </div>

          <div className="bt-field">
            <label htmlFor="bt-equip">Equipment type</label>
            <select
              id="bt-equip"
              value={state.equip}
              onChange={(e) => update({ equip: e.target.value as EquipId })}
            >
              {(Object.keys(EQUIPMENT) as EquipId[]).map((id) => (
                <option key={id} value={id}>
                  {EQUIPMENT[id]}
                </option>
              ))}
            </select>
          </div>

          <div className="bt-field full bt-compare-row">
            <label className="bt-check" htmlFor="bt-compare">
              <input
                id="bt-compare"
                type="checkbox"
                checked={state.compare !== ""}
                onChange={(e) => toggleCompare(e.target.checked)}
              />
              {COPY.compareLabel}
            </label>
            {state.compare !== "" && (
              <div className="bt-field">
                <label htmlFor="bt-region2" className="bt-sr">
                  {COPY.compareSelect}
                </label>
                <select
                  id="bt-region2"
                  value={state.compare}
                  onChange={(e) => update({ compare: e.target.value as RegionId })}
                >
                  {REGION_IDS.filter((id) => id !== state.region).map((id) => (
                    <option key={id} value={id}>
                      {REGIONS[id].flag} {REGIONS[id].name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bt-field">
            <label htmlFor="bt-pressure">Operating pressure</label>
            <div className="bt-pressure-row">
              <input
                id="bt-pressure"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 12"
                step="any"
                min="0"
                value={state.pressure}
                onChange={(e) => update({ pressure: e.target.value })}
              />
              <select
                id="bt-unit"
                aria-label="Pressure unit"
                value={state.unit}
                onChange={(e) => update({ unit: e.target.value as UnitId })}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <small>{COPY.pressureHint}</small>
          </div>

          <div className="bt-field" hidden={!showVolume}>
            <label htmlFor="bt-volume">
              Vessel volume (litres) <span className="bt-opt">optional</span>
            </label>
            <input
              id="bt-volume"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 500"
              step="any"
              min="0"
              value={state.volume}
              onChange={(e) => update({ volume: e.target.value })}
            />
            <small>{volumeHelp}</small>
          </div>

          <div className="bt-field full" hidden={!showCategory}>
            <label htmlFor="bt-category">
              PED/PESR category, if already known <span className="bt-opt">optional</span>
            </label>
            <select
              id="bt-category"
              value={state.category}
              onChange={(e) => update({ category: e.target.value as CategoryId | "" })}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {showCategory && (
              <GuidedCategory
                pressureBar={pressureBar}
                initialVolume={state.volume}
                applied={state.category}
                onApply={(category) => update({ category })}
              />
            )}
          </div>
        </div>

        <div className="bt-results-wrap" aria-live="polite">
          {outputs ? (
            <>
              {outputs.length === 2 && <CompareGlance a={outputs[0]} b={outputs[1]} />}
              <div className={`bt-results-grid ${outputs.length === 2 ? "two" : ""}`}>
                {outputs.map(({ region, output }) => (
                  <ResultCard
                    key={region}
                    region={region}
                    state={state}
                    output={output}
                    onCopy={() => copySummary(region, output)}
                    copied={copied === region}
                    apiKey={apiKey}
                    model={model}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bt-placeholder">{COPY.placeholder}</div>
          )}
        </div>

        <div className="bt-ai-wrap">
          <KeyPanel
            apiKey={apiKey}
            onKey={setApiKey}
            remember={remember}
            onRemember={setRemember}
            model={model}
            onModel={changeModel}
            onForget={forgetKey}
          />
        </div>

        <footer className="bt-disclaimer">{COPY.disclaimer}</footer>
      </div>
    </div>
  );
}
