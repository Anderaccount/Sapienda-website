import type { IncomingMessage, ServerResponse } from "http";
import type { SkillDTO } from "../shared/api/contracts";
import { getUserId } from "./_lib/auth";
import { getPool } from "./_lib/db";
import { readJsonBody, sendJson } from "./_lib/http";

type ApiRequest = IncomingMessage & { body?: unknown };

type DbSkill = {
  id: string;
  author_id: string;
  name: string;
  description: string;
  category: string;
  system_prompt: string;
  examples: string[];
  tags: string[];
  icon: string;
  icon_color: string;
  badge: string | null;
  status: string;
  star_count: number;
  download_count: number;
  rating: string;
  review_count: number;
  created_at: string;
  updated_at: string;
};

type DbComment = {
  id: string;
  skill_id: string;
  user_id: string;
  content: string;
  rating: number;
  helpful_count: number;
  created_at: string;
};

function mapSkill(row: DbSkill): SkillDTO {
  return {
    id: row.id,
    authorId: row.author_id,
    name: row.name,
    description: row.description,
    category: row.category,
    systemPrompt: row.system_prompt,
    examples: row.examples,
    tags: row.tags,
    icon: row.icon,
    iconColor: row.icon_color,
    badge: row.badge,
    status: row.status,
    starCount: row.star_count,
    downloadCount: row.download_count,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComment(row: DbComment) {
  return {
    id: row.id,
    skillId: row.skill_id,
    userId: row.user_id,
    content: row.content,
    rating: row.rating,
    helpfulCount: row.helpful_count,
    createdAt: row.created_at,
  };
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = url.pathname.replace(/\/+$/, "");
  const method = req.method?.toUpperCase() ?? "GET";

  try {
    const db = getPool();

    /* ── GET /api/skills — list ── */
    if (path === "/api/skills" && method === "GET") {
      const category = url.searchParams.get("category");
      const search = url.searchParams.get("search");
      const sort = url.searchParams.get("sort") ?? "rating";

      const conditions: string[] = ['"status" = $1'];
      const params: unknown[] = ["published"];
      let paramIdx = 2;

      if (category) {
        conditions.push(`"category" = $${paramIdx++}`);
        params.push(category);
      }
      if (search) {
        conditions.push(
          `($${paramIdx} = '' OR "name" ILIKE $${paramIdx} OR "description" ILIKE $${paramIdx} OR EXISTS (SELECT 1 FROM unnest("tags") t WHERE t ILIKE $${paramIdx}))`,
        );
        params.push(`%${search}%`);
        paramIdx++;
      }

      const orderBy =
        sort === "downloads"
          ? '"download_count" DESC'
          : sort === "newest"
            ? '"created_at" DESC'
            : '"rating" DESC NULLS LAST, "star_count" DESC';

      const result = await db.query(
        `SELECT * FROM "skills" WHERE ${conditions.join(" AND ")} ORDER BY ${orderBy} LIMIT 100`,
        params,
      );

      sendJson(res, 200, { skills: result.rows.map(mapSkill) });
      return;
    }

    /* ── GET /api/skills/:id — detail ── */
    const detailMatch = path.match(/^\/api\/skills\/([a-zA-Z0-9-]+)$/);
    if (detailMatch && method === "GET") {
      const skillId = detailMatch[1];
      const result = await db.query(`SELECT * FROM "skills" WHERE "id" = $1 AND "status" = 'published'`, [skillId]);
      if (result.rows.length === 0) {
        sendJson(res, 404, { error: "Skill not found" });
        return;
      }
      sendJson(res, 200, { skill: mapSkill(result.rows[0]) });
      return;
    }

    /* ── POST /api/skills — create (auth required) ── */
    if (path === "/api/skills" && method === "POST") {
      const userId = getUserId(req);
      if (!userId) {
        sendJson(res, 401, { error: "Authentication required" });
        return;
      }

      const body = await readJsonBody(req);
      const {
        name,
        description,
        category,
        repoUrl,
        systemPrompt = "",
        examples = [],
        tags = [],
        icon = "Sparkles",
        iconColor = "#7A42D8",
      } = body as Record<string, unknown>;

      if (!name || !description || !category) {
        sendJson(res, 400, { error: "name, description, and category are required" });
        return;
      }

      /* Validate repo URL if provided */
      const repoUrlStr = typeof repoUrl === "string" ? repoUrl.trim() : "";
      if (repoUrlStr) {
        const ghMatch = repoUrlStr.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/);
        if (!ghMatch) {
          sendJson(res, 400, { error: "repoUrl must be a valid GitHub repository URL" });
          return;
        }
      }

      const result = await db.query(
        `INSERT INTO "skills" ("author_id", "name", "description", "category", "repo_url", "system_prompt", "examples", "tags", "icon", "icon_color", "status")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'published')
         RETURNING *`,
        [
          userId,
          name,
          description,
          category,
          repoUrlStr || null,
          systemPrompt,
          Array.isArray(examples) ? examples : [],
          Array.isArray(tags) ? tags : [],
          icon,
          iconColor,
        ],
      );

      sendJson(res, 201, { skill: mapSkill(result.rows[0]) });
      return;
    }

    /* ── POST /api/skills/:id/star — toggle star ── */
    const starMatch = path.match(/^\/api\/skills\/([a-zA-Z0-9-]+)\/star$/);
    if (starMatch && method === "POST") {
      const userId = getUserId(req);
      if (!userId) {
        sendJson(res, 401, { error: "Authentication required" });
        return;
      }

      const skillId = starMatch[1];
      const existing = await db.query(
        `SELECT "id" FROM "skill_stars" WHERE "skill_id" = $1 AND "user_id" = $2`,
        [skillId, userId],
      );

      let starred = false;
      if (existing.rows.length > 0) {
        await db.query(`DELETE FROM "skill_stars" WHERE "skill_id" = $1 AND "user_id" = $2`, [skillId, userId]);
        starred = false;
      } else {
        await db.query(`INSERT INTO "skill_stars" ("skill_id", "user_id") VALUES ($1, $2)`, [skillId, userId]);
        starred = true;
      }

      /* Update aggregated star count */
      const count = await db.query(`SELECT COUNT(*)::int AS c FROM "skill_stars" WHERE "skill_id" = $1`, [skillId]);
      await db.query(`UPDATE "skills" SET "star_count" = $1 WHERE "id" = $2`, [count.rows[0].c, skillId]);

      sendJson(res, 200, { starred, starCount: count.rows[0].c });
      return;
    }

    /* ── GET /api/skills/:id/comments — list comments ── */
    const commentsMatch = path.match(/^\/api\/skills\/([a-zA-Z0-9-]+)\/comments$/);
    if (commentsMatch && method === "GET") {
      const skillId = commentsMatch[1];
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
      const offset = (page - 1) * limit;

      const result = await db.query(
        `SELECT "sc".* FROM "skill_comments" "sc"
         WHERE "sc"."skill_id" = $1
         ORDER BY "sc"."created_at" DESC
         LIMIT $2 OFFSET $3`,
        [skillId, limit, offset],
      );

      sendJson(res, 200, { comments: result.rows.map(mapComment), page, limit });
      return;
    }

    /* ── POST /api/skills/:id/comments — add comment (auth required) ── */
    if (commentsMatch && method === "POST") {
      const userId = getUserId(req);
      if (!userId) {
        sendJson(res, 401, { error: "Authentication required" });
        return;
      }

      const skillId = commentsMatch[1];
      const body = await readJsonBody(req);
      const { content, rating = 5 } = body as Record<string, unknown>;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        sendJson(res, 400, { error: "content is required" });
        return;
      }

      const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));

      await db.query(
        `INSERT INTO "skill_comments" ("skill_id", "user_id", "content", "rating") VALUES ($1, $2, $3, $4)`,
        [skillId, userId, content.trim(), ratingNum],
      );

      /* Update aggregated rating + review count */
      const agg = await db.query(
        `SELECT ROUND(AVG("rating")::numeric, 2) AS avg_rating, COUNT(*)::int AS cnt FROM "skill_comments" WHERE "skill_id" = $1`,
        [skillId],
      );
      await db.query(`UPDATE "skills" SET "rating" = $1, "review_count" = $2 WHERE "id" = $3`, [
        agg.rows[0].avg_rating,
        agg.rows[0].cnt,
        skillId,
      ]);

      sendJson(res, 201, { rating: Number(agg.rows[0].avg_rating), reviewCount: agg.rows[0].cnt });
      return;
    }

    /* ── POST /api/skills/:id/download — bump download count ── */
    const dlMatch = path.match(/^\/api\/skills\/([a-zA-Z0-9-]+)\/download$/);
    if (dlMatch && method === "POST") {
      const skillId = dlMatch[1];
      await db.query(`UPDATE "skills" SET "download_count" = "download_count" + 1 WHERE "id" = $1`, [skillId]);
      sendJson(res, 200, { ok: true });
      return;
    }

    /* ── No match ── */
    sendJson(res, 404, { error: "Not found" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[skills] error:", message);
    sendJson(res, 500, { error: "Internal server error" });
  }
}
