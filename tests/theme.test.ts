import { describe, expect, it } from "vitest";
import { THEME_KEY, THEME_SCRIPT, isTheme, otherTheme, readTheme, resolveTheme, saveTheme } from "@/lib/theme";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}
const blocked = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
  removeItem: () => { throw new Error("blocked"); },
};

describe("theme storage", () => {
  it("saves and reads a choice", () => {
    const s = fakeStorage();
    expect(readTheme(s)).toBeNull();
    expect(saveTheme(s, "light")).toBe(true);
    expect(readTheme(s)).toBe("light");
    saveTheme(s, "dark");
    expect(readTheme(s)).toBe("dark");
  });
  it("ignores values that are not a theme", () => {
    expect(readTheme(fakeStorage({ [THEME_KEY]: "purple" }))).toBeNull();
    expect(isTheme("light")).toBe(true);
    expect(isTheme(null)).toBe(false);
  });
  it("stays quiet when storage is blocked or missing", () => {
    expect(readTheme(blocked)).toBeNull();
    expect(saveTheme(blocked, "light")).toBe(false);
    expect(readTheme(null)).toBeNull();
    expect(saveTheme(undefined, "dark")).toBe(false);
  });
});

describe("resolveTheme and otherTheme", () => {
  it("lets a saved choice win over the device setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
  it("follows the device setting with no saved choice", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });
  it("flips between the two", () => {
    expect(otherTheme("light")).toBe("dark");
    expect(otherTheme("dark")).toBe("light");
  });
});

describe("no-flash script", () => {
  function run(stored: string | null, throws = false) {
    const attrs: Record<string, string> = {};
    const win = { localStorage: { getItem: () => { if (throws) throw new Error("blocked"); return stored; } } };
    const doc = { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } } };
    new Function("window", "document", THEME_SCRIPT)(win, doc);
    return attrs;
  }
  it("copies a saved theme onto the root element", () => {
    expect(run("light")).toEqual({ "data-theme": "light" });
    expect(run("dark")).toEqual({ "data-theme": "dark" });
  });
  it("leaves the root untouched when nothing valid is saved", () => {
    expect(run(null)).toEqual({});
    expect(run("purple")).toEqual({});
  });
  it("does not throw when storage is blocked", () => {
    expect(run(null, true)).toEqual({});
  });
  it("reads the same key the toggle writes", () => {
    expect(THEME_SCRIPT).toContain(JSON.stringify(THEME_KEY));
  });
});
