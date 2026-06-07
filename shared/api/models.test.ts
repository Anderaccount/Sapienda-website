import assert from "node:assert/strict";
import { test } from "node:test";
import { getProviderApiKey, getProviderModelId, getRelayChatUrl, MODEL_CATALOG, resolveModel } from "./models";

test("resolveModel returns a known model or the default model", () => {
  assert.equal(resolveModel("deepseek-v4-flash").id, "deepseek-v4-flash");
  assert.equal(resolveModel("missing").id, MODEL_CATALOG[0].id);
  assert.equal(resolveModel(undefined).id, MODEL_CATALOG[0].id);
});

test("provider model id prefers env overrides", () => {
  process.env.MODEL_ID_DEEPSEEK_V4_FLASH = "custom-deepseek";
  assert.equal(getProviderModelId(resolveModel("deepseek-v4-flash")), "custom-deepseek");
  delete process.env.MODEL_ID_DEEPSEEK_V4_FLASH;
});

test("provider api key uses provider-specific env", () => {
  process.env.DEEPSEEK_API_KEY = "deepseek-key";
  process.env.MODEL_RELAY_API_KEY = "relay-key";
  assert.equal(getProviderApiKey(resolveModel("deepseek-v4-pro")), "deepseek-key");
  assert.equal(getProviderApiKey(resolveModel("chatgpt-5-4")), "relay-key");
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.MODEL_RELAY_API_KEY;
});

test("relay chat url normalizes common base urls", () => {
  process.env.MODEL_RELAY_BASE_URL = "https://relay.example/v1";
  assert.equal(getRelayChatUrl(), "https://relay.example/v1/chat/completions");
  process.env.MODEL_RELAY_BASE_URL = "https://relay.example";
  assert.equal(getRelayChatUrl(), "https://relay.example/v1/chat/completions");
  delete process.env.MODEL_RELAY_BASE_URL;
});
