import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ChatMessagePart =
  | { type: "text"; text: string }
  | { type: "code"; language: string; code: string }
  | {
      type: "chart";
      chartType: "line" | "bar" | "area" | "pie";
      title: string;
      description: string;
      data: Array<Record<string, string | number>>;
      xKey: string;
      yKeys: string[];
    }
  | { type: "file"; name: string; fileType: string; size: string; description: string; url: string }
  | { type: "table"; columns: string[]; rows: string[][] };

type ChatStreamEvent =
  | { type: "status"; label: string }
  | { type: "text-delta"; delta: string }
  | { type: "artifact"; part: ChatMessagePart }
  | { type: "error"; message: string }
  | { type: "done" };

type ModelProvider = "Claude" | "ChatGPT" | "Deepseek";

interface ModelProviderConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  envKeyName: string;
  providerModelId?: string;
  providerModelEnvName?: string;
}

const MODEL_PROVIDER_CATALOG: ModelProviderConfig[] = [
  { id: "claude-opus-4-8", name: "Claude opus 4.8", provider: "Claude", envKeyName: "MODEL_RELAY_CLAUDE_API_KEY", providerModelId: "claude-opus-4-8", providerModelEnvName: "MODEL_ID_CLAUDE_OPUS_4_8" },
  { id: "claude-opus-4-5", name: "Claude opus 4.5", provider: "Claude", envKeyName: "MODEL_RELAY_CLAUDE_API_KEY", providerModelId: "claude-opus-4-5-20251101", providerModelEnvName: "MODEL_ID_CLAUDE_OPUS_4_5" },
  { id: "chatgpt-5-5", name: "ChatGPT 5.5", provider: "ChatGPT", envKeyName: "MODEL_RELAY_GPT_API_KEY", providerModelId: "gpt-5.5", providerModelEnvName: "MODEL_ID_GPT_5_5" },
  { id: "chatgpt-5-4", name: "ChatGPT 5.4", provider: "ChatGPT", envKeyName: "MODEL_RELAY_GPT_API_KEY", providerModelId: "gpt-5.4", providerModelEnvName: "MODEL_ID_GPT_5_4" },
  { id: "deepseek-v4-pro", name: "Deepseek V4 Pro", provider: "Deepseek", envKeyName: "DEEPSEEK_API_KEY", providerModelId: "deepseek-v4-pro", providerModelEnvName: "MODEL_ID_DEEPSEEK_V4_PRO" },
  { id: "deepseek-v4-flash", name: "Deepseek V4 flash", provider: "Deepseek", envKeyName: "DEEPSEEK_API_KEY", providerModelId: "deepseek-v4-flash", providerModelEnvName: "MODEL_ID_DEEPSEEK_V4_FLASH" },
];

function resolveModelProvider(modelId: unknown): ModelProviderConfig {
  if (typeof modelId !== "string") return MODEL_PROVIDER_CATALOG[0];
  return MODEL_PROVIDER_CATALOG.find((model) => model.id === modelId) ?? MODEL_PROVIDER_CATALOG[0];
}

function hasProviderKey(model: ModelProviderConfig): boolean {
  return Boolean(getProviderApiKey(model));
}

function getProviderApiKey(model: ModelProviderConfig): string {
  if (model.provider === "Deepseek") return process.env.DEEPSEEK_API_KEY?.trim() ?? "";
  return process.env[model.envKeyName]?.trim() || process.env.MODEL_RELAY_API_KEY?.trim() || "";
}

function getProviderModelId(model: ModelProviderConfig): string {
  const envModelId = model.providerModelEnvName ? process.env[model.providerModelEnvName]?.trim() : "";
  return envModelId || model.providerModelId || model.id;
}

function buildDemoArtifacts(prompt: string): ChatMessagePart[] {
  const wantsChart = /chart|图表|可视化|visual|trend|趋势|usage|用量/i.test(prompt);
  const wantsFile = /file|文件|download|导出|report|报告|生成/i.test(prompt);

  const artifacts: ChatMessagePart[] = [];

  if (wantsChart) {
    artifacts.push({
      type: "chart",
      chartType: "bar",
      title: "Model activity snapshot",
      description: "A compact example of how generated analytics can appear inside a conversation.",
      data: [
        { label: "Mon", input: 42, output: 18 },
        { label: "Tue", input: 54, output: 22 },
        { label: "Wed", input: 48, output: 26 },
        { label: "Thu", input: 63, output: 31 },
        { label: "Fri", input: 72, output: 38 },
      ],
      xKey: "label",
      yKeys: ["input", "output"],
    });
  }

  if (wantsFile) {
    artifacts.push({
      type: "file",
      name: "sapienda-analysis-summary.txt",
      fileType: "TXT",
      size: "18 KB",
      description: "Generated summary file preview. The file protocol is ready for real storage URLs.",
      url: "/api/files/sapienda-analysis-summary.txt",
    });
  }

  artifacts.push({
    type: "table",
    columns: ["Capability", "Status", "Notes"],
    rows: [
      ["Streaming response", "Ready", "Text can arrive in small deltas."],
      ["Charts", "Ready", "Rendered as structured artifacts."],
      ["Files", "Ready", "Displayed as downloadable cards."],
    ],
  });

  artifacts.push({
    type: "code",
    language: "ts",
    code: "type MessagePart = TextPart | ChartPart | FilePart | TablePart | CodePart;",
  });

  return artifacts;
}

function buildDemoResponse(prompt: string, model: ModelProviderConfig, usingMockProvider: boolean): { text: string; artifacts: ChatMessagePart[] } {
  return {
    text: [
      `I am responding through ${model.name}.`,
      "",
      usingMockProvider
        ? `The provider route resolved to ${model.provider}, but ${model.envKeyName} is not configured yet, so this is using the local mock stream.`
        : `The provider route resolved to ${model.provider}. The ${model.envKeyName} environment variable is present, so this is ready to be replaced with the real vendor call.`,
      "",
      "The assistant message can stream text, keep readable Markdown spacing, and attach structured artifacts below the answer. This is the same shape the UI can use when DeepSeek, OpenAI, Anthropic, or another provider returns generated files, charts, or tables.",
      "",
      "Here is a concise breakdown:",
      "- Text stays in a natural left-aligned assistant layout.",
      "- Generated charts and files are rendered as separate blocks.",
      "- Actions such as copy and regenerate sit under the assistant response.",
    ].join("\n"),
    artifacts: buildDemoArtifacts(prompt),
  };
}

async function writeEvent(res: Express["response"], event: ChatStreamEvent) {
  res.write(`${JSON.stringify(event)}\n`);
}

function formatProviderError(error: unknown, serviceName: string, insecureTlsEnvName: string) {
  if (!(error instanceof Error)) return `${serviceName} request failed.`;
  const cause = error.cause as { code?: string; message?: string; hostname?: string } | undefined;
  const tlsErrorCodes = new Set([
    "SELF_SIGNED_CERT_IN_CHAIN",
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "CERT_HAS_EXPIRED",
  ]);
  const tlsHint = cause?.code && tlsErrorCodes.has(cause.code)
    ? `This usually means your proxy/VPN/network is replacing HTTPS certificates. For local testing, set ${insecureTlsEnvName}=true in .env and restart npm run dev. For production, install the proxy root certificate instead.`
    : "";
  const details = [
    error.message,
    cause?.code ? `Network code: ${cause.code}` : "",
    cause?.hostname ? `Host: ${cause.hostname}` : "",
    cause?.message && cause.message !== error.message ? cause.message : "",
    tlsHint,
  ].filter(Boolean);
  return details.join("\n");
}

type DeepSeekStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  } | null;
};

type RelayModelsResponse = {
  data?: Array<{
    id?: string;
    object?: string;
  }>;
};

function normalizeModelIdForMatch(modelId: string) {
  return modelId.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getRelayModelsUrl() {
  const baseUrl = process.env.MODEL_RELAY_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return "";
  if (baseUrl.endsWith("/models")) return baseUrl;
  if (baseUrl.endsWith("/v1")) return `${baseUrl}/models`;
  return `${baseUrl}/v1/models`;
}

async function fetchRelayModelIds(model: ModelProviderConfig) {
  const apiKey = getProviderApiKey(model);
  const modelsUrl = getRelayModelsUrl();
  if (!apiKey || !modelsUrl) return [];

  const response = await fetch(modelsUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) return [];
  const payload = await response.json().catch(() => null) as RelayModelsResponse | null;
  return payload?.data?.map((model) => model.id).filter((id): id is string => Boolean(id)) ?? [];
}

async function getRelayProviderModelId(model: ModelProviderConfig) {
  const requestedModelId = getProviderModelId(model);
  const relayModelIds: string[] = await fetchRelayModelIds(model).catch(() => [] as string[]);
  if (!relayModelIds.length || relayModelIds.includes(requestedModelId)) {
    return requestedModelId;
  }

  const normalizedRequested = normalizeModelIdForMatch(requestedModelId);
  const normalizedUiModel = normalizeModelIdForMatch(model.id);
  const matchedModelId = relayModelIds.find((id) => normalizeModelIdForMatch(id) === normalizedRequested)
    ?? relayModelIds.find((id) => normalizeModelIdForMatch(id) === normalizedUiModel)
    ?? relayModelIds.find((id) => normalizeModelIdForMatch(id).startsWith(normalizedRequested))
    ?? relayModelIds.find((id) => normalizeModelIdForMatch(id).startsWith(normalizedUiModel));

  if (matchedModelId) {
    console.log(`Model relay mapped ${requestedModelId} -> ${matchedModelId}`);
    return matchedModelId;
  }

  console.warn(`Model relay could not find ${requestedModelId}. Available models: ${relayModelIds.slice(0, 30).join(", ")}`);
  return requestedModelId;
}

async function streamDeepSeekResponse(prompt: string, model: ModelProviderConfig, res: Express["response"]) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return false;
  const allowInsecureTls = process.env.DEEPSEEK_ALLOW_INSECURE_TLS === "true";
  if (allowInsecureTls) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn("DEEPSEEK_ALLOW_INSECURE_TLS is enabled. TLS certificate verification is disabled for local development.");
  }

  await writeEvent(res, { type: "status", label: `Connecting to ${model.name}` });

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getProviderModelId(model),
      messages: [
        { role: "system", content: "You are Sapienda, a helpful assistant. Keep responses clear, useful, and well structured." },
        { role: "user", content: prompt },
      ],
      stream: true,
      stream_options: { include_usage: true },
      thinking: { type: "enabled" },
      reasoning_effort: "high",
      max_tokens: 1024,
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`);
  }

  await writeEvent(res, { type: "status", label: `Streaming from ${model.name}` });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let usage: DeepSeekStreamChunk["usage"] = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";

    for (const eventBlock of events) {
      const dataLines = eventBlock
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());

      for (const data of dataLines) {
        if (!data || data === "[DONE]") continue;
        let chunk: DeepSeekStreamChunk;
        try {
          chunk = JSON.parse(data) as DeepSeekStreamChunk;
        } catch {
          continue;
        }
        if (chunk.usage) usage = chunk.usage;
        const delta = chunk.choices?.[0]?.delta;
        const content = delta?.content ?? "";
        const reasoningContent = delta?.reasoning_content ?? "";
        if (reasoningContent) {
          await writeEvent(res, { type: "status", label: "Reasoning" });
        }
        if (content) {
          await writeEvent(res, { type: "text-delta", delta: content });
        }
      }
    }
  }

  if (buffer.trim()) {
    const dataLines = buffer
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());
    for (const data of dataLines) {
      if (!data || data === "[DONE]") continue;
      let chunk: DeepSeekStreamChunk;
      try {
        chunk = JSON.parse(data) as DeepSeekStreamChunk;
      } catch {
        continue;
      }
      if (chunk.usage) usage = chunk.usage;
      const content = chunk.choices?.[0]?.delta?.content ?? "";
      if (content) await writeEvent(res, { type: "text-delta", delta: content });
    }
  }

  if (usage) {
    console.log("DeepSeek usage:", {
      model: getProviderModelId(model),
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cacheHitTokens: usage.prompt_cache_hit_tokens,
      cacheMissTokens: usage.prompt_cache_miss_tokens,
    });
  }

  await writeEvent(res, { type: "done" });
  return true;
}

function getRelayChatCompletionsUrl() {
  const baseUrl = process.env.MODEL_RELAY_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return "";
  if (baseUrl.endsWith("/chat/completions")) return baseUrl;
  if (baseUrl.endsWith("/v1")) return `${baseUrl}/chat/completions`;
  return `${baseUrl}/v1/chat/completions`;
}

async function streamRelayResponse(prompt: string, model: ModelProviderConfig, res: Express["response"]) {
  const apiKey = getProviderApiKey(model);
  const chatCompletionsUrl = getRelayChatCompletionsUrl();
  if (!apiKey || !chatCompletionsUrl) return false;
  const allowInsecureTls = process.env.MODEL_RELAY_ALLOW_INSECURE_TLS === "true";
  if (allowInsecureTls) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn("MODEL_RELAY_ALLOW_INSECURE_TLS is enabled. TLS certificate verification is disabled for local development.");
  }
  const relayModelId = await getRelayProviderModelId(model);

  await writeEvent(res, { type: "status", label: `Connecting to ${model.name}` });

  const response = await fetch(chatCompletionsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: relayModelId,
      messages: [
        { role: "system", content: "You are Sapienda, a helpful assistant. Keep responses clear, useful, and well structured." },
        { role: "user", content: prompt },
      ],
      stream: true,
      max_tokens: 1024,
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Model relay request failed: ${response.status} ${errorText}`);
  }

  await writeEvent(res, { type: "status", label: `Streaming from ${model.name}` });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushEventBlock = async (eventBlock: string) => {
    const dataLines = eventBlock
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());

    for (const data of dataLines) {
      if (!data || data === "[DONE]") continue;
      let chunk: DeepSeekStreamChunk;
      try {
        chunk = JSON.parse(data) as DeepSeekStreamChunk;
      } catch {
        continue;
      }
      const content = chunk.choices?.[0]?.delta?.content ?? "";
      if (content) await writeEvent(res, { type: "text-delta", delta: content });
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    for (const eventBlock of events) {
      await flushEventBlock(eventBlock);
    }
  }

  if (buffer.trim()) {
    await flushEventBlock(buffer);
  }

  await writeEvent(res, { type: "done" });
  return true;
}

async function createProviderResponse(prompt: string, model: ModelProviderConfig) {
  const usingMockProvider = model.provider === "Deepseek"
    ? !hasProviderKey(model)
    : !getProviderApiKey(model) || !getRelayChatCompletionsUrl();

  // Real provider wiring belongs here. Keep all API keys on the server:
  // - Claude/GPT model relay: process.env.MODEL_RELAY_API_KEY + process.env.MODEL_RELAY_BASE_URL
  // - DeepSeek: process.env.DEEPSEEK_API_KEY
  return buildDemoResponse(prompt, model, usingMockProvider);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    return res.json({
      ok: true,
      service: "sapienda-api",
      environment: process.env.NODE_ENV || "development",
      providers: {
        deepseek: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
        relayBaseUrl: Boolean(process.env.MODEL_RELAY_BASE_URL?.trim()),
        relayDefaultKey: Boolean(process.env.MODEL_RELAY_API_KEY?.trim()),
        relayClaudeKey: Boolean(process.env.MODEL_RELAY_CLAUDE_API_KEY?.trim()),
        relayGptKey: Boolean(process.env.MODEL_RELAY_GPT_API_KEY?.trim()),
      },
      modelIds: {
        claudeOpus48: Boolean(process.env.MODEL_ID_CLAUDE_OPUS_4_8?.trim()),
        claudeOpus45: Boolean(process.env.MODEL_ID_CLAUDE_OPUS_4_5?.trim()),
        gpt55: Boolean(process.env.MODEL_ID_GPT_5_5?.trim()),
        gpt54: Boolean(process.env.MODEL_ID_GPT_5_4?.trim()),
        deepseekV4Pro: Boolean(process.env.MODEL_ID_DEEPSEEK_V4_PRO?.trim()),
        deepseekV4Flash: Boolean(process.env.MODEL_ID_DEEPSEEK_V4_FLASH?.trim()),
      },
    });
  });

  app.post("/api/chat", async (req, res) => {
    const prompt = typeof req.body?.message === "string" ? req.body.message : "";
    const selectedModel = resolveModelProvider(req.body?.model);

    if (!prompt.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    res.writeHead(200, {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    });

    if (selectedModel.provider === "Deepseek" && hasProviderKey(selectedModel)) {
      try {
        await streamDeepSeekResponse(prompt, selectedModel, res);
      } catch (error) {
        const message = formatProviderError(error, "DeepSeek", "DEEPSEEK_ALLOW_INSECURE_TLS");
        console.error(message);
        await writeEvent(res, { type: "status", label: "DeepSeek connection failed" });
        await writeEvent(res, {
          type: "error",
          message: `DeepSeek connection failed.\n\n${message}\n\nPlease check your API key, account balance, and network access, then try again.`,
        });
      }
      return res.end();
    }

    if (selectedModel.provider !== "Deepseek" && hasProviderKey(selectedModel)) {
      try {
        const streamed = await streamRelayResponse(prompt, selectedModel, res);
        if (streamed) return res.end();
      } catch (error) {
        const message = formatProviderError(error, "Model relay", "MODEL_RELAY_ALLOW_INSECURE_TLS");
        console.error(message);
        await writeEvent(res, { type: "status", label: "Model relay connection failed" });
        const modelNotFoundHint = message.includes("model_not_found")
          ? "\n\nThe relay is connected, but this upstream model id is not available in your relay group. Check the relay pricing/model list, or update the matching MODEL_ID_* value in .env."
          : "\n\nPlease check MODEL_RELAY_API_KEY, MODEL_RELAY_BASE_URL, account balance, and network access, then try again.";
        await writeEvent(res, {
          type: "error",
          message: `Model relay connection failed.\n\n${message}${modelNotFoundHint}`,
        });
        return res.end();
      }
    }

    const response = await createProviderResponse(prompt, selectedModel);

    await writeEvent(res, { type: "status", label: `Thinking with ${selectedModel.name}` });
    await sleep(260);
    await writeEvent(res, { type: "status", label: `Routing via ${selectedModel.provider}` });

    const chunks = response.text.match(/.{1,42}(\s|$)/g) ?? [response.text];
    for (const chunk of chunks) {
      await sleep(45);
      await writeEvent(res, { type: "text-delta", delta: chunk });
    }

    for (const part of response.artifacts) {
      await sleep(180);
      await writeEvent(res, { type: "artifact", part });
    }

    await writeEvent(res, { type: "done" });
    return res.end();
  });

  app.get("/api/files/:name", (req, res) => {
    const safeName = req.params.name.replace(/[^a-zA-Z0-9._-]/g, "");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName || "sapienda-file.txt"}"`);
    return res.send("Sapienda generated file placeholder.\n\nThis endpoint is ready to be replaced with real artifact storage.");
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  return httpServer;
}
