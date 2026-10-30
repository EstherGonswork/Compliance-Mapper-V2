/** Optional storage for the visitor's key. Every call is safe when browser storage is blocked. */

const KEY = "compliance-mapper.key";
const MODEL = "compliance-mapper.model";

function read(name: string): string | null {
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function write(name: string, value: string): boolean {
  try {
    window.localStorage.setItem(name, value);
    return true;
  } catch {
    return false;
  }
}

function remove(name: string): void {
  try {
    window.localStorage.removeItem(name);
  } catch {
    /* nothing to remove */
  }
}

export const loadKey = (): string => read(KEY) ?? "";
export const saveKey = (key: string): boolean => write(KEY, key);
export const clearKey = (): void => remove(KEY);
export const loadModel = (): string | null => read(MODEL);
export const saveModel = (id: string): boolean => write(MODEL, id);
