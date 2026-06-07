import type { IncomingMessage, ServerResponse } from "http";
import type { ConversationDTO, MessageDTO } from "../shared/api/contracts";
import { getUserId } from "./_lib/auth";
import { getPool } from "./_lib/db";
import { readJsonBody, sendJson } from "./_lib/http";

type ApiRequest = IncomingMessage & { body?: unknown };
type DbConversation = {
  id: string;
  user_id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  summary: string;
  created_at: string;
  updated_at: string;
};
type DbMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  parts: unknown;
  status: "streaming" | "complete" | "error";
  model_id: string | null;
  input_tokens: number;
  output_tokens: number;
  credit_used: string;
  created_at: string;
};

function mapConversation(row: DbConversation): ConversationDTO {
  return {
    id: row.id,
    title: row.title,
    pinned: row.pinned,
    archived: row.archived,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: DbMessage): MessageDTO {
  const creditUsed = Number(row.credit_used || 0);
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    parts: Array.isArray(row.parts) ? row.parts : [],
    status: row.status,
    modelId: row.model_id,
    createdAt: row.created_at,
    usage: creditUsed || row.input_tokens || row.output_tokens ? {
      creditsUsed: creditUsed,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
    } : undefined,
  };
}

async function listConversations(userId: string) {
  const result = await getPool().query<DbConversation>(
    `select * from conversations
     where user_id = $1 and archived = false
     order by pinned desc, updated_at desc
     limit 80`,
    [userId],
  );
  return result.rows.map(mapConversation);
}

async function getConversation(userId: string, id: string) {
  const conversationResult = await getPool().query<DbConversation>(
    "select * from conversations where id = $1 and user_id = $2 limit 1",
    [id, userId],
  );
  const conversation = conversationResult.rows[0];
  if (!conversation) return null;
  const messagesResult = await getPool().query<DbMessage>(
    "select * from messages where conversation_id = $1 order by created_at asc",
    [id],
  );
  return {
    ...mapConversation(conversation),
    messages: messagesResult.rows.map(mapMessage),
  };
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  try {
    const userId = getUserId(req);
    if (!userId) return sendJson(res, 401, { message: "Not authenticated" });

    if (req.method === "GET") {
      const url = new URL(req.url || "/", "https://sapienda.local");
      const id = url.searchParams.get("id");
      if (id) {
        const conversation = await getConversation(userId, id);
        if (!conversation) return sendJson(res, 404, { message: "Conversation not found." });
        return sendJson(res, 200, { conversation });
      }
      return sendJson(res, 200, { conversations: await listConversations(userId) });
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : "New chat";
      const result = await getPool().query<DbConversation>(
        "insert into conversations (user_id, title) values ($1, $2) returning *",
        [userId, title],
      );
      return sendJson(res, 201, { conversation: { ...mapConversation(result.rows[0]), messages: [] } });
    }

    if (req.method === "PATCH") {
      const body = await readJsonBody(req);
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) return sendJson(res, 400, { message: "Conversation id is required." });
      const current = await getConversation(userId, id);
      if (!current) return sendJson(res, 404, { message: "Conversation not found." });
      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : current.title;
      const pinned = typeof body.pinned === "boolean" ? body.pinned : current.pinned;
      const archived = typeof body.archived === "boolean" ? body.archived : current.archived;
      const result = await getPool().query<DbConversation>(
        `update conversations
         set title = $1, pinned = $2, archived = $3, updated_at = now()
         where id = $4 and user_id = $5
         returning *`,
        [title, pinned, archived, id, userId],
      );
      return sendJson(res, 200, { conversation: mapConversation(result.rows[0]) });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url || "/", "https://sapienda.local");
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { message: "Conversation id is required." });
      await getPool().query("delete from conversations where id = $1 and user_id = $2", [id, userId]);
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 405, { message: "Method Not Allowed" });
  } catch (error) {
    return sendJson(res, 500, { message: error instanceof Error ? error.message : "Conversation request failed." });
  }
}
