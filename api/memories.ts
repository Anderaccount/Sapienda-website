import type { IncomingMessage, ServerResponse } from "http";
import { createHmac, timingSafeEqual } from "crypto";
import { Pool } from "pg";

type ApiRequest = IncomingMessage & { body?: unknown };
type DbMemory = {
  id: string;
  user_id: string;
  type: string;
  layer: "short_term" | "long_term";
  category: "profile" | "task_constraint" | "decision";
  content: string;
  keywords: string[];
  importance: number;
  confidence: string;
  source_conversation_id: string | null;
  status: "suggested" | "active" | "dismissed";
  expires_at: string | null;
  last_accessed_at: string | null;
  access_count: number;
  dormant: boolean;
  created_at: string;
  updated_at: string;
};

const SESSION_COOKIE_NAME = "sapienda_session";
let pool: Pool | null = null;

function getPool() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, max: 1, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseCookies(req: IncomingMessage) {
  const header = req.headers.cookie ?? "";
  return Object.fromEntries(header.split(";").map((item) => {
    const [key, ...value] = item.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }).filter(([key]) => Boolean(key)));
}

function verifySession(token: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
  if (!parsed.sub || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed.sub;
}

function getUserId(req: IncomingMessage) {
  const token = parseCookies(req)[SESSION_COOKIE_NAME];
  if (!token) return null;
  return verifySession(token);
}

async function readJsonBody(req: ApiRequest) {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function extractKeywords(text: string) {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const latinWords = normalized.match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [];
  const cjkWords = normalized.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  return Array.from(new Set([...latinWords, ...cjkWords])).slice(0, 12);
}

function mapMemory(row: DbMemory) {
  return {
    id: row.id,
    type: row.type,
    layer: row.layer,
    category: row.category,
    content: row.content,
    keywords: row.keywords,
    importance: row.importance,
    confidence: Number(row.confidence || 0),
    sourceConversationId: row.source_conversation_id,
    status: row.status,
    expiresAt: row.expires_at,
    lastAccessedAt: row.last_accessed_at,
    accessCount: row.access_count,
    dormant: row.dormant,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listMemories(userId: string) {
  const result = await getPool().query<DbMemory>(
    `select * from memories
     where user_id = $1 and status <> 'dismissed'
     order by case status when 'active' then 0 when 'suggested' then 1 else 2 end, updated_at desc
     limit 100`,
    [userId],
  );
  return result.rows.map(mapMemory);
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  try {
    const userId = getUserId(req);
    if (!userId) return sendJson(res, 401, { message: "Not authenticated" });

    if (req.method === "GET") {
      return sendJson(res, 200, { memories: await listMemories(userId) });
    }

    if (req.method !== "POST") return sendJson(res, 405, { message: "Method Not Allowed" });

    const body = await readJsonBody(req);
    const action = typeof body.action === "string" ? body.action : "";
    const id = typeof body.id === "string" ? body.id : "";

    if (action === "create") {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (!content) return sendJson(res, 400, { message: "Memory content is required." });
      const type = typeof body.type === "string" && body.type.trim() ? body.type.trim().slice(0, 40) : "preference";
      const layer = body.layer === "short_term" ? "short_term" : "long_term";
      const category = body.category === "task_constraint" || body.category === "decision" || body.category === "profile"
        ? body.category
        : "profile";
      const keywords = Array.isArray(body.keywords) && body.keywords.length
        ? body.keywords.map((keyword) => String(keyword).toLowerCase().trim()).filter(Boolean).slice(0, 12)
        : extractKeywords(content);
      const result = await getPool().query<DbMemory>(
        `insert into memories (user_id, type, layer, category, content, keywords, importance, confidence, source_conversation_id, status)
         values ($1, $2, $3, $4, $5, $6::text[], 3, 0.90, $7, 'active')
         returning *`,
        [userId, type, layer, category, content.slice(0, 500), keywords, typeof body.sourceConversationId === "string" ? body.sourceConversationId : null],
      );
      return sendJson(res, 201, { memory: mapMemory(result.rows[0]), memories: await listMemories(userId) });
    }

    if (action === "clear_all") {
      await getPool().query("delete from memories where user_id = $1", [userId]);
      return sendJson(res, 200, { ok: true, memories: [] });
    }

    if ((action === "activate" || action === "deactivate" || action === "dismiss" || action === "delete" || action === "update") && !id) {
      return sendJson(res, 400, { message: "Memory id is required." });
    }

    if (action === "activate" || action === "deactivate" || action === "dismiss") {
      const status = action === "activate" ? "active" : action === "deactivate" ? "suggested" : "dismissed";
      const result = await getPool().query<DbMemory>(
        "update memories set status = $1, dormant = false, updated_at = now() where id = $2 and user_id = $3 returning *",
        [status, id, userId],
      );
      if (!result.rows[0]) return sendJson(res, 404, { message: "Memory not found." });
      return sendJson(res, 200, { memory: mapMemory(result.rows[0]), memories: await listMemories(userId) });
    }

    if (action === "update") {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (!content) return sendJson(res, 400, { message: "Memory content is required." });
      const keywords = Array.isArray(body.keywords) && body.keywords.length
        ? body.keywords.map((keyword) => String(keyword).toLowerCase().trim()).filter(Boolean).slice(0, 12)
        : extractKeywords(content);
      const result = await getPool().query<DbMemory>(
        "update memories set content = $1, keywords = $2::text[], updated_at = now() where id = $3 and user_id = $4 returning *",
        [content.slice(0, 500), keywords, id, userId],
      );
      if (!result.rows[0]) return sendJson(res, 404, { message: "Memory not found." });
      return sendJson(res, 200, { memory: mapMemory(result.rows[0]), memories: await listMemories(userId) });
    }

    if (action === "delete") {
      await getPool().query("delete from memories where id = $1 and user_id = $2", [id, userId]);
      return sendJson(res, 200, { ok: true, memories: await listMemories(userId) });
    }

    return sendJson(res, 400, { message: "Unsupported memory action." });
  } catch (error) {
    return sendJson(res, 500, { message: error instanceof Error ? error.message : "Memory request failed." });
  }
}
