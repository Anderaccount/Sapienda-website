import assert from "node:assert/strict";
import { test } from "node:test";
import type { IncomingMessage, ServerResponse } from "http";
import { clearSessionCookie, getUserId, parseCookies, setSessionCookie, signSession, verifySession } from "./auth";

test("signSession and verifySession round trip a user id", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = signSession("user-123");
  assert.equal(verifySession(token), "user-123");
});

test("verifySession rejects a tampered token", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = signSession("user-123");
  assert.equal(verifySession(`${token.slice(0, -1)}x`), null);
});

test("parseCookies decodes cookie values", () => {
  const req = { headers: { cookie: "sapienda_session=abc%20123; theme=light" } } as IncomingMessage;
  assert.deepEqual(parseCookies(req), {
    sapienda_session: "abc 123",
    theme: "light",
  });
});

test("getUserId reads the signed session cookie", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = signSession("user-456");
  const req = { headers: { cookie: `sapienda_session=${encodeURIComponent(token)}` } } as IncomingMessage;
  assert.equal(getUserId(req), "user-456");
});

test("session cookie helpers set secure cookie headers", () => {
  process.env.NODE_ENV = "production";
  const headers = new Map<string, string>();
  const res = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
  } as unknown as ServerResponse;

  setSessionCookie(res, "token");
  assert.match(headers.get("Set-Cookie") ?? "", /HttpOnly/);
  assert.match(headers.get("Set-Cookie") ?? "", /Secure/);

  clearSessionCookie(res);
  assert.match(headers.get("Set-Cookie") ?? "", /Max-Age=0/);
});
