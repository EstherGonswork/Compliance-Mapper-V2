import { AI, AI_ERRORS } from "@/data/ai";

export type AiErrorKind = "key" | "limit" | "busy" | "network" | "model" | "bad";

export class AiError extends Error {
  kind: AiErrorKind;
  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ToolCall {
  system: string;
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  user: string;
  apiKey: string;
  model: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

function failFor(status: number, body: unknown): AiError {
  const detail = JSON.stringify(body ?? "").toLowerCase();
  if (status === 401 || status === 403) return new AiError("key", AI_ERRORS.key);
  if (status === 429) return new AiError("limit", AI_ERRORS.limit);
  if (status === 400 && detail.includes("credit")) return new AiError("limit", AI_ERRORS.limit);
  if (status === 404) return new AiError("model", AI_ERRORS.model);
  if (status === 529 || status >= 500) return new AiError("busy", AI_ERRORS.busy);
  return new AiError("bad", AI_ERRORS.bad);
}

/**
 * Sends one forced tool call straight from the browser to the Anthropic API with the visitor's own key.
 * Returns the tool input. The key is used for this request and never stored here.
 */
export async function callTool(call: ToolCall): Promise<unknown> {
  const key = call.apiKey.trim();
  if (!key) throw new AiError("key", AI_ERRORS.noKey);
  if (!key.startsWith(AI.keyPrefix)) throw new AiError("key", AI_ERRORS.badKeyShape);

  const fetchImpl: FetchLike = call.fetchImpl ?? ((input, init) => fetch(input, init));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), call.timeoutMs ?? AI.timeoutMs);

  let res: Response;
  try {
    res = await fetchImpl(AI.endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": AI.version,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: call.model,
        max_tokens: AI.maxTokens,
        system: call.system,
        tools: [call.tool],
        tool_choice: { type: "tool", name: call.tool.name },
        messages: [{ role: "user", content: call.user }],
      }),
    });
  } catch {
    throw new AiError("network", AI_ERRORS.network);
  } finally {
    clearTimeout(timer);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw failFor(res.status, data);

  const reply = data as { stop_reason?: string; content?: Array<{ type: string; name?: string; input?: unknown }> } | null;
  if (!reply || reply.stop_reason === "max_tokens") throw new AiError("bad", AI_ERRORS.bad);
  const block = reply.content?.find((b) => b.type === "tool_use" && b.name === call.tool.name);
  if (!block) throw new AiError("bad", AI_ERRORS.bad);
  return block.input;
}
