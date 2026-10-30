import { afterEach, describe, expect, it, vi } from "vitest";
import { clearKey, loadKey, loadModel, saveKey, saveModel } from "@/lib/keyStore";

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("keyStore", () => {
  it("saves, loads and clears a key", () => {
    vi.stubGlobal("window", { localStorage: fakeStorage() });
    expect(loadKey()).toBe("");
    expect(saveKey("sk-ant-abc")).toBe(true);
    expect(loadKey()).toBe("sk-ant-abc");
    clearKey();
    expect(loadKey()).toBe("");
    saveModel("claude-sonnet-5-5");
    expect(loadModel()).toBe("claude-sonnet-5-5");
  });

  it("stays quiet when storage throws", () => {
    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    vi.stubGlobal("window", { localStorage: blocked });
    expect(loadKey()).toBe("");
    expect(saveKey("sk-ant-abc")).toBe(false);
    expect(() => clearKey()).not.toThrow();
    expect(loadModel()).toBeNull();
  });
});
