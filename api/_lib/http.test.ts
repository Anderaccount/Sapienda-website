import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { test } from "node:test";
import type { ServerResponse } from "http";
import { formatError, readJsonBody, sendJson, writeEvent } from "./http";

test("readJsonBody returns an existing object body", async () => {
  const body = { ok: true };
  assert.deepEqual(await readJsonBody({ body } as never), body);
});

test("readJsonBody parses streamed JSON", async () => {
  const req = Readable.from([Buffer.from('{"message":"hello"}')]) as never;
  assert.deepEqual(await readJsonBody(req), { message: "hello" });
});

test("sendJson writes status, header, and serialized payload", () => {
  let statusCode = 0;
  let contentType = "";
  let payload = "";
  const res = {
    set statusCode(value: number) {
      statusCode = value;
    },
    get statusCode() {
      return statusCode;
    },
    setHeader(name: string, value: string) {
      if (name === "Content-Type") contentType = value;
    },
    end(value: string) {
      payload = value;
    },
  } as unknown as ServerResponse;

  sendJson(res, 201, { ok: true });
  assert.equal(statusCode, 201);
  assert.equal(contentType, "application/json; charset=utf-8");
  assert.equal(payload, '{"ok":true}');
});

test("writeEvent writes one NDJSON event", async () => {
  let payload = "";
  const res = {
    write(value: string) {
      payload += value;
    },
  } as unknown as ServerResponse;
  await writeEvent(res, { type: "done" });
  assert.equal(payload, '{"type":"done"}\n');
});

test("formatError includes network cause details", () => {
  const error = new Error("request failed", { cause: { code: "ECONNRESET", message: "socket closed" } });
  assert.match(formatError(error), /request failed/);
  assert.match(formatError(error), /ECONNRESET/);
});
