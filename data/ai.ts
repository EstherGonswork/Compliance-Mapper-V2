/**
 * Settings and messages for the optional AI explainer. Edit this file to add a model or reword an error.
 * The visitor's key goes only to the endpoint below.
 */

export const AI = {
  endpoint: "https://api.anthropic.com/v1/messages",
  version: "2023-06-01",
  maxTokens: 900,
  timeoutMs: 60_000,
  keyPrefix: "sk-ant-",
  consoleUrl: "https://console.anthropic.com/settings/keys",
};

export const MODELS = [
  { id: "claude-haiku-5-5", label: "Haiku 5.5 (fastest, lowest cost)" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5 (more careful, higher cost)" },
];

export const DEFAULT_MODEL = MODELS[0].id;

export const AI_ERRORS = {
  noKey: "Add your Anthropic API key to use the AI explainer.",
  badKeyShape: "That does not look like an Anthropic key. Keys start with sk-ant-.",
  key: "Anthropic did not accept this key. Check that it is copied in full and still active.",
  limit: "The key has reached a rate limit or has no credit left. Wait a minute or check the balance in the Anthropic console.",
  busy: "Anthropic is busy right now. Try again in a moment.",
  network: "The request did not reach Anthropic. Check the connection and try again.",
  model: "Anthropic could not find that model. Pick another model and try again.",
  bad: "The AI reply could not be read. Try again, or use the written explanation.",
};

export const AI_COPY = {
  summary: "Optional: AI explanations with your own key",
  intro:
    "The written explanation is free and needs no key. Add an Anthropic key to also get an AI explanation and three questions to put to your supplier.",
  keyLabel: "Anthropic API key",
  keyPlaceholder: "sk-ant-...",
  remember: "Remember on this device",
  forget: "Forget key",
  modelLabel: "Model",
  warning:
    "Your key stays in this browser and goes only to api.anthropic.com. Use a key with a low spend limit, and delete it in the console when you are done.",
  getKey: "Get a key in the Anthropic console",
  button: "Explain with AI",
  busy: "Asking Claude...",
  needKey: "Add a key in the AI box at the bottom of the page to use this.",
  heading: "AI explanation",
  questions: "Questions to ask your supplier",
  caution: "AI text is guidance. Check it against the rules above.",
};
