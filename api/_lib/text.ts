export function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractKeywords(text: string) {
  const normalized = normalizeText(text);
  const latinWords = normalized.match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [];
  const cjkWords = normalized.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
  const stopWords = new Set([
    "the", "and", "for", "with", "this", "that", "what", "how", "can", "you", "your",
    "我想", "请你", "帮我", "这个", "那个", "一下", "可以", "需要", "默认",
  ]);
  return Array.from(new Set([...latinWords, ...cjkWords]
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !stopWords.has(word))))
    .slice(0, 16);
}
