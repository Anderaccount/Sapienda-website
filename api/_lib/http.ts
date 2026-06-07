import type { IncomingMessage, ServerResponse } from "http";
import type { ChatStreamEvent } from "../../shared/api/contracts";

export type ApiRequest = IncomingMessage & { body?: unknown };

export function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export async function readJsonBody(req: ApiRequest) {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function writeEvent(res: ServerResponse, event: ChatStreamEvent) {
  res.write(`${JSON.stringify(event)}\n`);
}

export function formatError(error: unknown) {
  if (!(error instanceof Error)) return "Unknown server error";
  const cause = error.cause as { code?: string; message?: string } | undefined;
  return [error.message, cause?.code ? `Network code: ${cause.code}` : "", cause?.message && cause.message !== error.message ? cause.message : ""]
    .filter(Boolean)
    .join("\n");
}
