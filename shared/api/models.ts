import type { ModelConfig } from "./contracts";

export const MODEL_CATALOG = [
  { id: "claude-opus-4-8", name: "Claude opus 4.8", provider: "Claude", envKeyName: "MODEL_RELAY_CLAUDE_API_KEY", providerModelId: "claude-opus-4-8", providerModelEnvName: "MODEL_ID_CLAUDE_OPUS_4_8" },
  { id: "claude-opus-4-5", name: "Claude opus 4.5", provider: "Claude", envKeyName: "MODEL_RELAY_CLAUDE_API_KEY", providerModelId: "claude-opus-4-5-20251101", providerModelEnvName: "MODEL_ID_CLAUDE_OPUS_4_5" },
  { id: "chatgpt-5-5", name: "ChatGPT 5.5", provider: "ChatGPT", envKeyName: "MODEL_RELAY_GPT_API_KEY", providerModelId: "gpt-5.5", providerModelEnvName: "MODEL_ID_GPT_5_5" },
  { id: "chatgpt-5-4", name: "ChatGPT 5.4", provider: "ChatGPT", envKeyName: "MODEL_RELAY_GPT_API_KEY", providerModelId: "gpt-5.4", providerModelEnvName: "MODEL_ID_GPT_5_4" },
  { id: "deepseek-v4-pro", name: "Deepseek V4 Pro", provider: "Deepseek", envKeyName: "DEEPSEEK_API_KEY", providerModelId: "deepseek-v4-pro", providerModelEnvName: "MODEL_ID_DEEPSEEK_V4_PRO" },
  { id: "deepseek-v4-flash", name: "Deepseek V4 flash", provider: "Deepseek", envKeyName: "DEEPSEEK_API_KEY", providerModelId: "deepseek-v4-flash", providerModelEnvName: "MODEL_ID_DEEPSEEK_V4_FLASH" },
] satisfies ModelConfig[];

export function resolveModel(modelId: unknown) {
  if (typeof modelId !== "string") return MODEL_CATALOG[0];
  return MODEL_CATALOG.find((model) => model.id === modelId) ?? MODEL_CATALOG[0];
}

export function getProviderModelId(model: ModelConfig) {
  return process.env[model.providerModelEnvName]?.trim() || model.providerModelId;
}

export function getProviderApiKey(model: ModelConfig) {
  if (model.provider === "Deepseek") return process.env.DEEPSEEK_API_KEY?.trim() ?? "";
  return process.env[model.envKeyName]?.trim() || process.env.MODEL_RELAY_API_KEY?.trim() || "";
}

export function getRelayChatUrl() {
  const baseUrl = process.env.MODEL_RELAY_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return "";
  if (baseUrl.endsWith("/chat/completions")) return baseUrl;
  if (baseUrl.endsWith("/v1")) return `${baseUrl}/chat/completions`;
  return `${baseUrl}/v1/chat/completions`;
}
