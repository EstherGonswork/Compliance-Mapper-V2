export type RegionId = "us" | "eu" | "uk" | "in" | "cn" | "au";
export type EquipId = "steam" | "hotwater" | "vesselpart";
export type UnitId = "bar" | "psi" | "kgcm2";
export type CategoryId = "sep" | "I" | "II" | "III" | "IV";

/** One band of a pressure ladder. The first band whose limit the pressure does not pass is used. */
export interface PressureBand {
  /** Upper limit in psig. Use Infinity for the last band. */
  max: number;
  /** True when a pressure equal to max belongs to this band. */
  inclusive: boolean;
  code: string;
  detail: string;
}

export interface RuleText {
  code: string;
  detail: string;
}

export interface Result {
  code: string;
  detail: string;
  marking: string;
  checklist: string[];
  callout: string | null;
}

export interface EngineInput {
  region: RegionId;
  equip: EquipId;
  /** Pressure as entered, in the chosen unit. Must be greater than zero. */
  pressure: number;
  unit: UnitId;
  /** Vessel volume in litres, or null when left blank. */
  volumeL: number | null;
  category: CategoryId | "";
}

export interface EngineOutput {
  result: Result;
  bar: number;
  psi: number;
  kgcm2: number;
}
