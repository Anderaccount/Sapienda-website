import type { IncomingMessage, ServerResponse } from "http";

type VercelRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, unknown>;
};

type VercelResponse = ServerResponse & {
  json?: (body: unknown) => void;
  status?: (statusCode: number) => VercelResponse;
};

function sendJson(res: VercelResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function getPath(req: VercelRequest) {
  const rawUrl = req.url || "/";
  return new URL(rawUrl, "https://sapienda.local").pathname;
}

function getHealthPayload() {
  return {
    ok: true,
    service: "sapienda-api",
    environment: process.env.NODE_ENV || "production",
    providers: {
      database: Boolean(process.env.DATABASE_URL?.trim()),
      jwtSecret: Boolean(process.env.JWT_SECRET?.trim()),
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
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = getPath(req);

  if (path === "/api/health" || path === "/health") {
    sendJson(res, 200, getHealthPayload());
    return;
  }

  sendJson(res, 404, {
    ok: false,
    message: "API route not found.",
  });
}
