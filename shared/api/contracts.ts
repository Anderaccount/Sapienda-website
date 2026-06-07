export type ModelProvider = "Claude" | "ChatGPT" | "Deepseek";

export type ModelConfig = {
  id: string;
  name: string;
  provider: ModelProvider;
  envKeyName: string;
  providerModelId: string;
  providerModelEnvName: string;
};

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "code"; language: string; code: string }
  | {
      type: "chart";
      chartType: "line" | "bar" | "area" | "pie";
      title: string;
      description: string;
      data: Array<Record<string, string | number>>;
      xKey: string;
      yKeys: string[];
    }
  | { type: "file"; name: string; fileType: string; size: string; description: string; url: string }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "image"; src: string; alt: string; title?: string }
  | { type: "source"; title: string; url: string; description?: string };

export type ChatStreamEvent =
  | { type: "status"; label: string }
  | { type: "conversation"; conversationId: string; userMessageId: string; assistantMessageId: string; title: string }
  | { type: "text-delta"; delta: string }
  | { type: "artifact"; part: Extract<MessagePart, { type: "source" }> }
  | { type: "memory-suggestion"; memory: { id: string; type: string; content: string } }
  | { type: "error"; message: string }
  | { type: "done" };

export type ConversationDTO = {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageDTO = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  status: "streaming" | "complete" | "error";
  modelId: string | null;
  createdAt: string;
  usage?: {
    creditsUsed: number;
    inputTokens: number;
    outputTokens: number;
  };
};

export type MemoryDTO = {
  id: string;
  type: string;
  layer: "short_term" | "long_term";
  category: "profile" | "task_constraint" | "decision";
  content: string;
  keywords: string[];
  importance: number;
  confidence: number;
  sourceConversationId: string | null;
  status: "suggested" | "active" | "dismissed";
  expiresAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  dormant: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SkillDTO = {
  id: string;
  authorId: string;
  name: string;
  description: string;
  category: string;
  repoUrl?: string | null;
  systemPrompt: string;
  examples: string[];
  tags: string[];
  icon: string;
  iconColor: string;
  badge: string | null;
  status: string;
  starCount: number;
  downloadCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};
