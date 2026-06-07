import type { IncomingMessage, ServerResponse } from "http";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Pool } from "pg";

type AuthAction = "register" | "login" | "me" | "logout";
type AuthRequest = IncomingMessage & { body?: unknown };

type DbUser = {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  credit_balance_cents: number;
  plan: string;
};

const SESSION_COOKIE_NAME = "sapienda_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const scrypt = promisify(scryptCallback);

let pool: Pool | null = null;

function getPool() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function publicUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    creditBalanceCents: user.credit_balance_cents,
    plan: user.plan,
  };
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return secret;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function signSession(userId: string) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  }));
  const signature = createHmac("sha256", getJwtSecret()).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifySession(token: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;
  const expected = createHmac("sha256", getJwtSecret()).update(`${header}.${payload}`).digest("base64url");
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
  if (!parsed.sub || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed.sub;
}

function parseCookies(req: IncomingMessage) {
  const header = req.headers.cookie ?? "";
  return Object.fromEntries(header.split(";").map((item) => {
    const [key, ...value] = item.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }).filter(([key]) => Boolean(key)));
}

function setSessionCookie(res: ServerResponse, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`);
}

function clearSessionCookie(res: ServerResponse) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

async function readJsonBody(req: AuthRequest) {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scrypt(password, salt, 64) as Buffer;
  return { salt, hash: hash.toString("base64url") };
}

async function verifyPassword(password: string, salt: string, storedHash: string) {
  const hash = await scrypt(password, salt, 64) as Buffer;
  const stored = Buffer.from(storedHash, "base64url");
  return stored.length === hash.length && timingSafeEqual(stored, hash);
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getAction(req: IncomingMessage): AuthAction | null {
  const path = new URL(req.url || "/", "https://sapienda.local").pathname;
  const action = path.split("/").filter(Boolean).at(-1);
  return action === "register" || action === "login" || action === "me" || action === "logout" ? action : null;
}

async function findUserByEmail(email: string) {
  const result = await getPool().query<DbUser>("select * from users where email = $1 limit 1", [email]);
  return result.rows[0] ?? null;
}

async function findUserById(id: string) {
  const result = await getPool().query<DbUser>("select * from users where id = $1 limit 1", [id]);
  return result.rows[0] ?? null;
}

async function createUser(email: string, displayName: string, passwordHash: string, passwordSalt: string) {
  const result = await getPool().query<DbUser>(
    `insert into users (email, display_name, password_hash, password_salt)
     values ($1, $2, $3, $4)
     returning *`,
    [email, displayName, passwordHash, passwordSalt],
  );
  return result.rows[0];
}

async function getUserFromCookie(req: IncomingMessage) {
  const token = parseCookies(req)[SESSION_COOKIE_NAME];
  if (!token) return null;
  const userId = verifySession(token);
  if (!userId) return null;
  return findUserById(userId);
}

export default async function handler(req: AuthRequest, res: ServerResponse) {
  const action = getAction(req);
  if (!action) return sendJson(res, 404, { message: "Auth route not found." });

  try {
    if (action === "me" && req.method === "GET") {
      const user = await getUserFromCookie(req);
      if (!user) return sendJson(res, 401, { message: "Not authenticated" });
      return sendJson(res, 200, { user: publicUser(user) });
    }

    if (action === "logout" && req.method === "POST") {
      clearSessionCookie(res);
      return sendJson(res, 200, { ok: true });
    }

    if ((action === "register" || action === "login") && req.method === "POST") {
      const body = await readJsonBody(req);
      const email = normalizeEmail(body.email);
      const password = normalizeString(body.password);

      if (!email.includes("@") || password.length < 8) {
        return sendJson(res, 400, { message: "Use a valid email and a password with at least 8 characters." });
      }

      const existingUser = await findUserByEmail(email);

      if (action === "register") {
        if (existingUser) return sendJson(res, 409, { message: "This email is already registered." });
        const displayName = normalizeString(body.displayName) || email.split("@")[0] || "Sapienda User";
        const { salt, hash } = await hashPassword(password);
        const createdUser = await createUser(email, displayName, hash, salt);
        const token = signSession(createdUser.id);
        setSessionCookie(res, token);
        return sendJson(res, 201, { user: publicUser(createdUser) });
      }

      if (!existingUser || !(await verifyPassword(password, existingUser.password_salt, existingUser.password_hash))) {
        return sendJson(res, 401, { message: "Email or password is incorrect." });
      }

      const token = signSession(existingUser.id);
      setSessionCookie(res, token);
      return sendJson(res, 200, { user: publicUser(existingUser) });
    }

    return sendJson(res, 405, { message: "Method Not Allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth request failed.";
    return sendJson(res, 500, { message });
  }
}
