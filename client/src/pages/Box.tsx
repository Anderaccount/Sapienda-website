import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Plus,
  Search,
  Star,
  TrendingUp,
  Settings,
  Settings2,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Check,
  MoreHorizontal,
  Paperclip,
  Globe,
  Zap,
  X,
  MessageCircle,
  Database,
  Copy,
  Quote,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Square,
  FileText,
  Download,
  BarChart3,
  Image as ImageIcon,
  Cpu,
  Wallet,
  CreditCard,
  Bell,
  Shield,
  User,
  Lock,
  Receipt,
  LogOut,
  Trash2,
  SlidersHorizontal,
  Languages,
  AlertTriangle,
} from "lucide-react";

const MIN_SIDEBAR_WIDTH = 120;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 264;
const KATEX_VERSION = "0.16.22";
const KATEX_CSS_URL = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css`;
const KATEX_JS_URL = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js`;

declare global {
  interface Window {
    katex?: {
      renderToString: (formula: string, options?: {
        displayMode?: boolean;
        throwOnError?: boolean;
        strict?: "ignore" | "warn" | "error" | boolean;
        trust?: boolean;
      }) => string;
    };
  }
}

const navigationItems = [
  { label: "New chat", icon: Plus },
  { label: "Search", icon: Search },
  { label: "Skills", icon: Zap },
  { label: "Usage", icon: TrendingUp },
  { label: "Model", icon: Cpu },
  { label: "Setting", icon: Settings },
];

const SKILL_CATEGORIES = ["Foundation", "Design", "Work & study"] as const;
type SkillCategory = typeof SKILL_CATEGORIES[number];

const SKILLS_DATA: Record<SkillCategory, { name: string; desc: string }[]> = {
  Foundation: [
    { name: "Deep Researcher", desc: "Research any topic with AI-powered depth" },
    { name: "Text Summarizer", desc: "Condense long documents into key points" },
    { name: "Data Analyst", desc: "Interpret and visualize your datasets" },
    { name: "Language Tutor", desc: "Practice conversation in any language" },
    { name: "Writing Coach", desc: "Polish prose and improve clarity" },
    { name: "Brainstorm Pro", desc: "Generate ideas and expand creative thinking" },
  ],
  Design: [
    { name: "UI Critiquer", desc: "Get expert feedback on your interface" },
    { name: "Color Palette", desc: "Create harmonious brand color systems" },
    { name: "Copy Writer", desc: "Write compelling marketing copy fast" },
    { name: "Logo Concept", desc: "Describe and iterate on logo ideas" },
    { name: "Style Guide Gen", desc: "Build consistent design token libraries" },
    { name: "Accessibility Check", desc: "Audit designs for inclusive standards" },
  ],
  "Work & study": [
    { name: "Meeting Notes", desc: "Summarize transcripts into action items" },
    { name: "Email Composer", desc: "Draft professional emails in seconds" },
    { name: "Study Flashcards", desc: "Turn notes into spaced-repetition cards" },
    { name: "Code Reviewer", desc: "Get detailed feedback on your code" },
    { name: "Presentation Deck", desc: "Build slide outlines from any topic" },
    { name: "Task Planner", desc: "Break big goals into actionable steps" },
  ],
};

const SKILL_HERO_SLIDES = [
  {
    tag: "@Canva",
    eyebrow: "Visual workflow",
    title: "Design faster with visual AI workflows",
    description: "Turn rough ideas into polished visual drafts, presentation frames, and content layouts with guided creative skills.",
    action: "View",
    prompt: "/Skills build a campaign moodboard",
    icon: ImageIcon,
    steps: ["Read creative brief", "Generate visual directions", "Prepare reusable layouts"],
    resultText: "A polished moodboard with palette, copy angles, and presentation-ready frames.",
  },
  {
    tag: "@Data",
    eyebrow: "Analysis workflow",
    title: "Turn messy files into clear insight",
    description: "Clean tables, compare patterns, generate charts, and summarize findings without rebuilding the same workflow each time.",
    action: "View",
    prompt: "/Skills analyze this spreadsheet",
    icon: Database,
    steps: ["Clean imported columns", "Compare key segments", "Summarize chart-ready insights"],
    resultText: "A compact analysis brief with trends, outliers, and next-step recommendations.",
  },
  {
    tag: "@Study",
    eyebrow: "Writing workflow",
    title: "Draft, polish, and learn with structure",
    description: "Use focused skills for summaries, writing reviews, study notes, and step-by-step project plans.",
    action: "View",
    prompt: "/Skills turn notes into a plan",
    icon: FileText,
    steps: ["Extract important notes", "Organize structure", "Draft a clear action plan"],
    resultText: "A focused study or writing plan with sections, priorities, and follow-up prompts.",
  },
] as const;

const MODEL_PROVIDERS = ["All models", "Claude", "ChatGPT", "Deepseek"] as const;
type ModelProviderTab = typeof MODEL_PROVIDERS[number];
type ModelProvider = Exclude<ModelProviderTab, "All models">;

const MODEL_CATALOG: Array<{
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  badge: string;
  logoSrc: string;
  recommended?: boolean;
  envKeyName: string;
  baseCreditCost: number;
  inputCacheHitPerMTokens?: number;
  inputCacheMissPerMTokens?: number;
  cacheCreatePerMTokens?: number;
  outputPerMTokens?: number;
}> = [
  { id: "claude-opus-4-8", name: "Claude opus 4.8", provider: "Claude", description: "Best for complex reasoning, writing, and multi-step workflows.", badge: "C", logoSrc: "/model_logo/Claude.svg", recommended: true, envKeyName: "MODEL_RELAY_API_KEY", baseCreditCost: 0, inputCacheHitPerMTokens: 0.495, inputCacheMissPerMTokens: 4.95, cacheCreatePerMTokens: 6.1875, outputPerMTokens: 24.75 },
  { id: "claude-opus-4-5", name: "Claude opus 4.5", provider: "Claude", description: "Focused Claude model for analysis, writing, and everyday productivity.", badge: "C", logoSrc: "/model_logo/Claude.svg", envKeyName: "MODEL_RELAY_API_KEY", baseCreditCost: 0, inputCacheHitPerMTokens: 0.495, inputCacheMissPerMTokens: 4.95, cacheCreatePerMTokens: 6.1875, outputPerMTokens: 24.75 },
  { id: "chatgpt-5-5", name: "ChatGPT 5.5", provider: "ChatGPT", description: "Recommended GPT model for general productivity tasks.", badge: "GPT", logoSrc: "/model_logo/ChatGPT.svg", recommended: true, envKeyName: "MODEL_RELAY_API_KEY", baseCreditCost: 0, inputCacheHitPerMTokens: 0.077, inputCacheMissPerMTokens: 0.77, outputPerMTokens: 4.62 },
  { id: "chatgpt-5-4", name: "ChatGPT 5.4", provider: "ChatGPT", description: "Reliable GPT model for conversation, coding, and structured outputs.", badge: "GPT", logoSrc: "/model_logo/ChatGPT.svg", envKeyName: "MODEL_RELAY_API_KEY", baseCreditCost: 0, inputCacheHitPerMTokens: 0.0385, inputCacheMissPerMTokens: 0.385, outputPerMTokens: 2.31 },
  { id: "deepseek-v4-pro", name: "Deepseek V4 Pro", provider: "Deepseek", description: "Strong DeepSeek model for coding, reasoning, and technical tasks.", badge: "D", logoSrc: "/model_logo/deepseek.svg", envKeyName: "DEEPSEEK_API_KEY", baseCreditCost: 0.04, inputCacheHitPerMTokens: 0.003625, inputCacheMissPerMTokens: 0.435, outputPerMTokens: 0.87 },
  { id: "deepseek-v4-flash", name: "Deepseek V4 flash", provider: "Deepseek", description: "Lower latency DeepSeek model for quick iterations.", badge: "D", logoSrc: "/model_logo/deepseek.svg", recommended: true, envKeyName: "DEEPSEEK_API_KEY", baseCreditCost: 0.025, inputCacheHitPerMTokens: 0.0028, inputCacheMissPerMTokens: 0.14, outputPerMTokens: 0.28 },
];

const recommendedModels = MODEL_CATALOG.filter((model) => model.recommended);

const suggestedPrompts = [
  { label: "Usage chart", prompt: "Create a chart that compares model usage this week", icon: BarChart3 },
  { label: "Report file", prompt: "Generate a short report file from my notes", icon: FileText },
  { label: "Key findings", prompt: "Explain this data and show the key findings", icon: Search },
  { label: "Project plan", prompt: "Draft a project plan with risks and next steps", icon: Database },
];

const SETTINGS_SECTIONS = [
  { id: "account", label: "Account", icon: User },
  { id: "credits", label: "Credits", icon: Wallet },
  { id: "models", label: "Models", icon: Cpu },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "memory", label: "Memory", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
] as const;

type SettingsSection = typeof SETTINGS_SECTIONS[number]["id"];

const topUpAmounts = [10, 25, 50] as const;
const CURRENT_USER_ID = "AW-2048";

type ModelCatalogItem = typeof MODEL_CATALOG[number];

interface UsageRecord {
  id: string;
  createdAt: string;
  sessionId: string;
  messageId: string;
  modelId: string;
  modelName: string;
  provider: ModelProvider;
  inputTokens: number;
  outputTokens: number;
  creditsUsed: number;
}

interface TopUpRecord {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  invoice: string;
}

const modelSpendColors: Record<ModelProvider, string> = {
  Claude: "bg-[#373734]",
  ChatGPT: "bg-[#a682fe]",
  Deepseek: "bg-[#6f806c]",
};

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.trim().length / 4));

const roundCredits = (value: number) => Math.round(value * 100) / 100;

const calculateRequestCost = (model: ModelCatalogItem, inputTokens: number, outputTokens: number) => {
  const inputRate = (model.inputCacheMissPerMTokens ?? model.baseCreditCost * 250) / 1_000_000;
  const outputRate = (model.outputPerMTokens ?? model.baseCreditCost * 650) / 1_000_000;
  return Math.max(0.01, roundCredits(inputTokens * inputRate + outputTokens * outputRate));
};

const formatCredits = (value: number) => `$${value.toFixed(2)}`;

const formatTokenCount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toLocaleString();
};

const formatDateLabel = (isoDate: string) => new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
}).format(new Date(isoDate));

const formatTopUpDate = (isoDate: string) => new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
}).format(new Date(isoDate));

const formatPerMTokensPrice = (value: number) => {
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(2);
  return value.toFixed(2);
};

const createTopUpRecord = (amount: number, status = "Paid"): TopUpRecord => {
  const now = Date.now();
  return {
    id: `topup-${now}`,
    createdAt: new Date(now).toISOString(),
    amount,
    status,
    invoice: `INV-${String(now).slice(-4)}`,
  };
};

type MessagePart =
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

interface Message {
  id: string;
  role: "user" | "assistant";
  status?: "streaming" | "complete" | "error";
  content?: string;
  parts: MessagePart[];
  createdAt: string;
  statusLabel?: string;
  usage?: {
    creditsUsed: number;
    inputTokens: number;
    outputTokens: number;
    modelName: string;
  };
  memorySuggestion?: {
    id: string;
    type: string;
    content: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
  pinned?: boolean;
}

interface AttachedFile {
  id: string;
  name: string;
  size: string;
}

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  creditBalanceCents: number;
  plan: string;
}

interface MemoryItem {
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
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; language: string; code: string; isStreaming?: boolean }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "divider" }
  | { type: "math"; formula: string; display: boolean };

export const Box = (): JSX.Element => {
  const [activeNav, setActiveNav] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODEL_CATALOG[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [view, setView] = useState<"home" | "chat" | "skills" | "usage" | "models" | "settings">("home");
  const [skillsTab, setSkillsTab] = useState<SkillCategory>("Foundation");
  const [skillsSearch, setSkillsSearch] = useState("");
  const [activeSkillHeroIndex, setActiveSkillHeroIndex] = useState(0);
  const [modelProviderTab, setModelProviderTab] = useState<ModelProviderTab>("All models");
  const [modelSearch, setModelSearch] = useState("");
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("account");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [openRecentMenuId, setOpenRecentMenuId] = useState<string | null>(null);
  const [recentMenuPosition, setRecentMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [sessionsHydrated, setSessionsHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<{ text: string; x: number; y: number } | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [modelHistoryIds, setModelHistoryIds] = useState<string[]>(recommendedModels.map((model) => model.id));
  const [balanceCredits, setBalanceCredits] = useState(571.5);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [topUpRecords, setTopUpRecords] = useState<TopUpRecord[]>([]);
  const [creditNotice, setCreditNotice] = useState<string | null>(null);
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number>(25);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(false);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(10);
  const [preferLowCostModel, setPreferLowCostModel] = useState(false);
  const [warnBeforeExpensiveModel, setWarnBeforeExpensiveModel] = useState(true);
  const [autoArtifactsEnabled, setAutoArtifactsEnabled] = useState(true);
  const [showCreditEstimate, setShowCreditEstimate] = useState(true);
  const [replyLanguage, setReplyLanguage] = useState("Auto");
  const [notifyLowBalance, setNotifyLowBalance] = useState(true);
  const [notifyTopUpSuccess, setNotifyTopUpSuccess] = useState(true);
  const [notifyHighSpend, setNotifyHighSpend] = useState(true);
  const [notifyMonthlySummary, setNotifyMonthlySummary] = useState(false);
  const [chatHistoryEnabled, setChatHistoryEnabled] = useState(true);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [katexReady, setKatexReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const recentMenuRef = useRef<HTMLDivElement>(null);
  const selectionToolbarRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const forceScrollToBottomRef = useRef(false);
  const isUserReadingHistoryRef = useRef(false);
  const touchScrollStartYRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const skillHeroDragStartRef = useRef<number | null>(null);

  const collapsed = sidebarWidth < 160;
  const activeChat = sessions.find((s) => s.id === activeChatId) ?? null;
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [sessions]);
  const openRecentSession = sortedSessions.find((session) => session.id === openRecentMenuId) ?? null;
  const modelMenuModels = modelHistoryIds
    .map((id) => MODEL_CATALOG.find((model) => model.id === id))
    .filter((model): model is typeof MODEL_CATALOG[number] => Boolean(model));
  const activeSkillHeroSlide = SKILL_HERO_SLIDES[activeSkillHeroIndex];
  const ActiveSkillHeroIcon = activeSkillHeroSlide.icon;
  const currentUserId = authUser?.id ?? CURRENT_USER_ID;
  const sessionsStorageKey = `sapienda:${currentUserId}:sessions`;
  const activeChatStorageKey = `sapienda:${currentUserId}:activeChatId`;
  const userDisplayName = authUser?.displayName ?? "Ander Wong";
  const userEmail = authUser?.email ?? "ander@sapienda.local";
  const userPlan = authUser?.plan ?? "Free plan";
  const userInitials = userDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SU";
  const totalCreditsUsed = useMemo(() => roundCredits(usageRecords.reduce((sum, record) => sum + record.creditsUsed, 0)), [usageRecords]);
  const totalInputTokens = useMemo(() => usageRecords.reduce((sum, record) => sum + record.inputTokens, 0), [usageRecords]);
  const totalOutputTokens = useMemo(() => usageRecords.reduce((sum, record) => sum + record.outputTokens, 0), [usageRecords]);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const creditsProgress = totalCreditsUsed + balanceCredits > 0
    ? Math.min(100, (totalCreditsUsed / (totalCreditsUsed + balanceCredits)) * 100)
    : 0;
  const averageQuestionCost = calculateRequestCost(selectedModel, 300, 800);

  const usageSummary = useMemo(() => [
    {
      label: "Credits used",
      value: formatCredits(totalCreditsUsed),
      description: `${creditsProgress.toFixed(1)}% of your active credit pool has been used.`,
      progress: creditsProgress,
    },
    {
      label: "Total tokens",
      value: formatTokenCount(totalTokens),
      description: "Input and output tokens across all selected models.",
    },
    {
      label: "Remaining credits",
      value: formatCredits(balanceCredits),
      description: "Estimated balance for the current billing cycle.",
    },
  ], [balanceCredits, creditsProgress, totalCreditsUsed, totalTokens]);

  const creditUsageData = useMemo(() => {
    const grouped = new Map<string, { date: string; credits: number }>();
    [...usageRecords].reverse().forEach((record) => {
      const date = formatDateLabel(record.createdAt);
      const current = grouped.get(date) ?? { date, credits: 0 };
      current.credits += record.creditsUsed;
      grouped.set(date, current);
    });
    const rows = Array.from(grouped.values()).map((row) => ({ ...row, credits: roundCredits(row.credits) }));
    const average = rows.length ? roundCredits(rows.reduce((sum, row) => sum + row.credits, 0) / rows.length) : 0;
    return rows.map((row) => ({ ...row, average }));
  }, [usageRecords]);

  const tokenUsageData = useMemo(() => {
    const grouped = new Map<string, { date: string; input: number; output: number }>();
    [...usageRecords].reverse().forEach((record) => {
      const date = formatDateLabel(record.createdAt);
      const current = grouped.get(date) ?? { date, input: 0, output: 0 };
      current.input += record.inputTokens;
      current.output += record.outputTokens;
      grouped.set(date, current);
    });
    return Array.from(grouped.values());
  }, [usageRecords]);

  const modelSpendData = useMemo(() => {
    const grouped = new Map<string, {
      name: string;
      provider: ModelProvider;
      badge: string;
      color: string;
      tokens: number;
      requests: number;
      spend: number;
    }>();
    usageRecords.forEach((record) => {
      const model = MODEL_CATALOG.find((item) => item.id === record.modelId);
      const current = grouped.get(record.modelId) ?? {
        name: record.modelName,
        provider: record.provider,
        badge: model?.badge ?? record.provider.slice(0, 1),
        color: modelSpendColors[record.provider],
        tokens: 0,
        requests: 0,
        spend: 0,
      };
      current.tokens += record.inputTokens + record.outputTokens;
      current.requests += 1;
      current.spend += record.creditsUsed;
      grouped.set(record.modelId, current);
    });
    return Array.from(grouped.values())
      .sort((a, b) => b.spend - a.spend)
      .map((item) => ({
        name: item.name,
        meta: `${formatTokenCount(item.tokens)} tokens · ${item.requests.toLocaleString()} request${item.requests === 1 ? "" : "s"}`,
        spend: formatCredits(roundCredits(item.spend)),
        badge: item.badge,
        color: item.color,
      }));
  }, [usageRecords]);

  useEffect(() => {
    let active = true;
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!active) return;
        if (!response.ok) {
          setAuthUser(null);
          return;
        }
        const payload = await response.json() as { user?: AuthUser };
        if (payload.user) {
          setAuthUser(payload.user);
          setBalanceCredits(roundCredits(payload.user.creditBalanceCents / 100));
        }
      } catch {
        if (active) setAuthUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    void loadCurrentUser();
    return () => { active = false; };
  }, []);

  const normalizeServerMessage = (message: {
    id: string;
    role: "user" | "assistant";
    content?: string;
    parts?: MessagePart[];
    status?: "streaming" | "complete" | "error";
    createdAt?: string;
    usage?: { creditsUsed?: number; inputTokens?: number; outputTokens?: number; modelName?: string };
  }): Message => ({
    id: message.id,
    role: message.role,
    content: message.content ?? "",
    parts: Array.isArray(message.parts) && message.parts.length ? message.parts : [{ type: "text", text: message.content ?? "" }],
    status: message.status ?? "complete",
    createdAt: message.createdAt ?? new Date().toISOString(),
    usage: message.usage ? {
      creditsUsed: Number(message.usage.creditsUsed ?? 0),
      inputTokens: Number(message.usage.inputTokens ?? 0),
      outputTokens: Number(message.usage.outputTokens ?? 0),
      modelName: message.usage.modelName ?? "Model",
    } : undefined,
  });

  const fetchMemories = useCallback(async () => {
    try {
      const response = await fetch("/api/memories", { credentials: "include" });
      if (!response.ok) return;
      const payload = await response.json() as { memories?: MemoryItem[] };
      setMemories(Array.isArray(payload.memories) ? payload.memories : []);
    } catch {
      setMemories([]);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setSessionsHydrated(false);
    try {
      const response = await fetch("/api/conversations", { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load conversations.");
      const payload = await response.json() as {
        conversations?: Array<{ id: string; title: string; pinned?: boolean; updatedAt: string }>;
      };
      const nextSessions = (payload.conversations ?? []).map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        pinned: conversation.pinned,
        updatedAt: conversation.updatedAt,
        messages: [],
      }));
      setSessions(nextSessions);
      const savedActiveChatId = window.localStorage.getItem(activeChatStorageKey);
      if (savedActiveChatId && nextSessions.some((session) => session.id === savedActiveChatId)) {
        setActiveChatId(savedActiveChatId);
      } else {
        setActiveChatId(null);
      }
    } catch {
      setSessions([]);
      setActiveChatId(null);
    } finally {
      setSessionsHydrated(true);
    }
  }, [activeChatStorageKey]);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations?id=${encodeURIComponent(conversationId)}`, { credentials: "include" });
      if (!response.ok) return;
      const payload = await response.json() as {
        conversation?: { id: string; title: string; pinned?: boolean; updatedAt: string; messages?: Array<Parameters<typeof normalizeServerMessage>[0]> };
      };
      if (!payload.conversation) return;
      setSessions((prev) => prev.map((session) => session.id === conversationId ? {
        ...session,
        title: payload.conversation?.title ?? session.title,
        pinned: payload.conversation?.pinned ?? session.pinned,
        updatedAt: payload.conversation?.updatedAt ?? session.updatedAt,
        messages: (payload.conversation?.messages ?? []).map(normalizeServerMessage),
      } : session));
    } catch {
      // Keep the existing local snapshot if loading fails.
    }
  }, []);

  const createServerConversation = useCallback(async (title: string) => {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error("Unable to create conversation.");
    const payload = await response.json() as { conversation?: { id: string; title: string; pinned?: boolean; updatedAt: string } };
    if (!payload.conversation) throw new Error("Conversation was not returned.");
    return {
      id: payload.conversation.id,
      title: payload.conversation.title,
      pinned: payload.conversation.pinned,
      updatedAt: payload.conversation.updatedAt,
      messages: [],
    } satisfies ChatSession;
  }, []);

  useEffect(() => {
    if (authLoading || !authUser) return;
    void fetchConversations();
    void fetchMemories();
  }, [authLoading, authUser, fetchConversations, fetchMemories]);

  useEffect(() => {
    if (authLoading || authUser) return;
    setSessions([]);
    setActiveChatId(null);
    setMemories([]);
  }, [authLoading, authUser]);

  useEffect(() => {
    if (!sessionsHydrated) return;
    if (activeChatId) {
      window.localStorage.setItem(activeChatStorageKey, activeChatId);
    } else {
      window.localStorage.removeItem(activeChatStorageKey);
    }
  }, [activeChatId, sessionsHydrated, activeChatStorageKey]);

  useEffect(() => {
    if (!activeChatId || !authUser) return;
    const session = sessions.find((item) => item.id === activeChatId);
    if (session && session.messages.length === 0) void loadConversationMessages(activeChatId);
  }, [activeChatId, authUser, sessions, loadConversationMessages]);

  useEffect(() => {
    if (window.katex) {
      setKatexReady(true);
      return;
    }

    if (!document.querySelector('link[data-sapienda-katex="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = KATEX_CSS_URL;
      link.dataset.sapiendaKatex = "true";
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-sapienda-katex="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => setKatexReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = KATEX_JS_URL;
    script.async = true;
    script.dataset.sapiendaKatex = "true";
    script.onload = () => setKatexReady(true);
    script.onerror = () => setKatexReady(false);
    document.head.appendChild(script);
  }, []);

  const getMessagesDistanceFromBottom = () => {
    const scroller = messagesScrollRef.current;
    if (!scroller) return 0;
    return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
  };

  const scrollMessagesToBottom = (behavior: ScrollBehavior = "smooth") => {
    const scroller = messagesScrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior });
  };

  useEffect(() => {
    const distanceFromBottom = getMessagesDistanceFromBottom();
    if (forceScrollToBottomRef.current || (!isUserReadingHistoryRef.current && distanceFromBottom < 160)) {
      scrollMessagesToBottom(forceScrollToBottomRef.current ? "auto" : "smooth");
      forceScrollToBottomRef.current = false;
    }
  }, [activeChat?.messages]);

  /* ── Close menus/modal on outside click ── */
  useEffect(() => {
    if (!showAttachMenu && !showModelMenu && !showSearchModal && !openRecentMenuId && !selectionToolbar) return;
    const handler = (e: MouseEvent) => {
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
      if (showModelMenu && modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
      if (showSearchModal && searchModalRef.current && !searchModalRef.current.contains(e.target as Node)) {
        setShowSearchModal(false);
        setSearchQuery("");
      }
      if (openRecentMenuId && recentMenuRef.current && !recentMenuRef.current.contains(e.target as Node)) {
        setOpenRecentMenuId(null);
        setRecentMenuPosition(null);
      }
      if (selectionToolbar && selectionToolbarRef.current && !selectionToolbarRef.current.contains(e.target as Node)) {
        setSelectionToolbar(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAttachMenu, showModelMenu, showSearchModal, openRecentMenuId, selectionToolbar]);

  /* ── Sidebar resize ── */
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidthRef.current + delta));
      setSidebarWidth(next);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isResizing]);

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    if (authMode === "register" && authForm.password !== authForm.confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    setAuthSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: authForm.displayName,
          email: authForm.email,
          password: authForm.password,
        }),
      });
      const rawText = await response.text();
      let payload: { user?: AuthUser; message?: string } = {};
      try {
        payload = rawText ? JSON.parse(rawText) as typeof payload : {};
      } catch {
        payload = { message: rawText };
      }
      if (!response.ok || !payload.user) {
        throw new Error(payload.message || "Authentication failed.");
      }
      setAuthUser(payload.user);
      setBalanceCredits(roundCredits(payload.user.creditBalanceCents / 100));
      setAuthForm({ displayName: "", email: "", password: "", confirmPassword: "" });
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    setAuthUser(null);
    setSessions([]);
    setActiveChatId(null);
    setSessionsHydrated(false);
    setView("home");
    setActiveNav("");
  };

  /* ── Input ── */
  const resizeTextareaToContent = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 48), 160)}px`;
    el.style.overflowY = el.scrollHeight > 160 ? "auto" : "hidden";
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (creditNotice) setCreditNotice(null);
    resizeTextareaToContent();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAttachFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const nextFiles = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: formatFileSize(file.size),
    }));
    setAttachedFiles((prev) => [...prev, ...nextFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowAttachMenu(false);
  };

  const appendAssistantText = (sessionId: string, messageId: string, delta: string) => {
    setSessions((prev) => prev.map((session) => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        messages: session.messages.map((message) => {
          if (message.id !== messageId) return message;
          const parts = message.parts.length && message.parts[0].type === "text"
            ? message.parts.map((part, index) => index === 0 && part.type === "text" ? { ...part, text: part.text + delta } : part)
            : [{ type: "text" as const, text: delta }, ...message.parts];
          return { ...message, parts, content: `${message.content ?? ""}${delta}` };
        }),
      };
    }));
  };

  const appendAssistantPart = (sessionId: string, messageId: string, part: MessagePart) => {
    setSessions((prev) => prev.map((session) => session.id === sessionId ? {
      ...session,
      messages: session.messages.map((message) => message.id === messageId ? { ...message, parts: [...message.parts, part] } : message),
    } : session));
  };

  const updateAssistantMessage = (sessionId: string, messageId: string, updates: Partial<Message>) => {
    setSessions((prev) => prev.map((session) => session.id === sessionId ? {
      ...session,
      messages: session.messages.map((message) => message.id === messageId ? { ...message, ...updates } : message),
    } : session));
  };

  const addCredits = (amount: number, status = "Paid") => {
    setBalanceCredits((value) => roundCredits(value + amount));
    setTopUpRecords((records) => [createTopUpRecord(amount, status), ...records]);
    setCreditNotice(null);
  };

  const recordCompletedUsage = (
    sessionId: string,
    assistantMessageId: string,
    text: string,
    responseText: string,
    model: ModelCatalogItem,
  ) => {
    const inputTokens = estimateTokens(text);
    const outputTokens = estimateTokens(responseText);
    const creditsUsed = calculateRequestCost(model, inputTokens, outputTokens);
    const record: UsageRecord = {
      id: `usage-${Date.now()}-${assistantMessageId}`,
      createdAt: new Date().toISOString(),
      sessionId,
      messageId: assistantMessageId,
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      inputTokens,
      outputTokens,
      creditsUsed,
    };

    setUsageRecords((records) => [record, ...records]);
    updateAssistantMessage(sessionId, assistantMessageId, {
      usage: { creditsUsed, inputTokens, outputTokens, modelName: model.name },
    });
    setBalanceCredits((current) => {
      const afterCharge = Math.max(0, roundCredits(current - creditsUsed));
      if (autoRechargeEnabled && afterCharge < lowBalanceThreshold) {
        setTopUpRecords((records) => [createTopUpRecord(selectedTopUpAmount, "Auto paid"), ...records]);
        return roundCredits(afterCharge + selectedTopUpAmount);
      }
      return afterCharge;
    });
  };

  const streamAssistantResponse = async (
    sessionId: string,
    assistantMessageId: string,
    text: string,
    modelSnapshot: ModelCatalogItem,
    filesSnapshot: AttachedFile[],
    contextSnapshot: Array<{ role: "user" | "assistant"; content: string }>,
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    let assistantText = "";
    let completed = false;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: sessionId,
          message: text,
          model: modelSnapshot.id,
          memoryEnabled,
          webSearchEnabled,
          contextMessages: contextSnapshot,
          attachments: filesSnapshot.map((file) => ({ name: file.name, size: file.size })),
        }),
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || `Unable to start the chat response. HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        buffer += decoder.decode(result.value ?? new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event:
            | { type: "status"; label: string }
            | { type: "conversation"; conversationId: string; userMessageId: string; assistantMessageId: string; title: string }
            | { type: "text-delta"; delta: string }
            | { type: "artifact"; part: MessagePart }
            | { type: "memory-suggestion"; memory: { id: string; type: string; content: string } }
            | { type: "error"; message: string }
            | { type: "done" };

          try {
            event = JSON.parse(line) as typeof event;
          } catch {
            throw new Error(`The chat stream returned invalid data: ${line.slice(0, 160)}`);
          }

          if (event.type === "conversation") {
            setSessions((prev) => prev.map((session) => session.id === sessionId ? {
              ...session,
              title: event.title || session.title,
              updatedAt: new Date().toISOString(),
            } : session));
          } else if (event.type === "status") {
            updateAssistantMessage(sessionId, assistantMessageId, { statusLabel: event.label });
          } else if (event.type === "text-delta") {
            assistantText += event.delta;
            appendAssistantText(sessionId, assistantMessageId, event.delta);
          } else if (event.type === "artifact") {
            appendAssistantPart(sessionId, assistantMessageId, event.part);
          } else if (event.type === "memory-suggestion") {
            updateAssistantMessage(sessionId, assistantMessageId, { memorySuggestion: event.memory });
            setMemories((prev) => [{
              ...event.memory,
              layer: "short_term",
              category: "task_constraint",
              keywords: [],
              importance: 3,
              confidence: 0.7,
              sourceConversationId: sessionId,
              status: "suggested",
              expiresAt: null,
              lastAccessedAt: null,
              accessCount: 0,
              dormant: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, ...prev]);
          } else if (event.type === "error") {
            completed = false;
            updateAssistantMessage(sessionId, assistantMessageId, {
              status: "error",
              statusLabel: undefined,
              parts: [{ type: "text", text: event.message }],
              content: event.message,
            });
          } else if (event.type === "done") {
            completed = true;
            updateAssistantMessage(sessionId, assistantMessageId, { status: "complete", statusLabel: undefined });
          }
        }
      }
      if (completed) {
        recordCompletedUsage(sessionId, assistantMessageId, text, assistantText, modelSnapshot);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        updateAssistantMessage(sessionId, assistantMessageId, {
          status: "complete",
          statusLabel: undefined,
          parts: [{ type: "text", text: "Generation stopped." }],
          content: "Generation stopped.",
        });
      } else {
        const message = error instanceof Error ? error.message : "The response failed to generate. Please try again.";
        updateAssistantMessage(sessionId, assistantMessageId, {
          status: "error",
          statusLabel: undefined,
          parts: [{ type: "text", text: `The response failed to generate.\n\n${message}` }],
          content: `The response failed to generate.\n\n${message}`,
        });
      }
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isGenerating) return;
    forceScrollToBottomRef.current = true;
    isUserReadingHistoryRef.current = false;
    const modelSnapshot = selectedModel;
    const filesSnapshot = attachedFiles;
    const estimatedCost = calculateRequestCost(modelSnapshot, estimateTokens(text), 800);
    if (balanceCredits < estimatedCost) {
      setCreditNotice(`Your balance is too low for ${modelSnapshot.name}. Add credits before sending.`);
      return;
    }
    const now = Date.now();
    const userMsg: Message = {
      id: `user-${now}`,
      role: "user",
      content: text,
      parts: [{ type: "text", text }],
      status: "complete",
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: Message = {
      id: `assistant-${now}`,
      role: "assistant",
      parts: [],
      status: "streaming",
      createdAt: new Date().toISOString(),
      statusLabel: "Thinking",
    };
    const title = text.slice(0, 22) + (text.length > 22 ? "..." : "");
    let targetSessionId = activeChatId;
    const contextSnapshot = [
      ...(activeChat?.messages ?? []),
      userMsg,
    ]
      .filter((message) => message.status !== "error" && message.role !== "assistant" || Boolean((message.content ?? "").trim() || message.parts.length))
      .map((message) => ({
        role: message.role,
        content: message.parts.map((part) => {
          if (part.type === "text") return part.text;
          if (part.type === "code") return part.code;
          if (part.type === "table") return [part.columns.join("\t"), ...part.rows.map((row) => row.join("\t"))].join("\n");
          if (part.type === "file") return `${part.name} ${part.description}`;
          if (part.type === "source") return `${part.title} ${part.url}`;
          return message.content ?? "";
        }).filter(Boolean).join("\n\n") || message.content || "",
      }))
      .filter((message) => message.content.trim())
      .slice(-16);

    if (view === "home" || !targetSessionId) {
      let serverSession: ChatSession;
      try {
        serverSession = await createServerConversation(title);
      } catch (error) {
        setCreditNotice(error instanceof Error ? error.message : "Unable to create conversation.");
        return;
      }
      const newSession: ChatSession = { ...serverSession, title: serverSession.title || title, messages: [userMsg, assistantMsg], updatedAt: new Date(now).toISOString() };
      setSessions((prev) => [newSession, ...prev]);
      setActiveChatId(newSession.id);
      targetSessionId = newSession.id;
      setView("chat");
    } else {
      setSessions((prev) => prev.map((s) => s.id === targetSessionId ? { ...s, messages: [...s.messages, userMsg, assistantMsg], updatedAt: new Date(now).toISOString() } : s));
    }
    setInputValue("");
    setAttachedFiles([]);
    setCreditNotice(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    if (targetSessionId) void streamAssistantResponse(targetSessionId, assistantMsg.id, text, modelSnapshot, filesSnapshot, contextSnapshot);
  };

  const stopGeneration = () => abortControllerRef.current?.abort();

  const getMessagePlainText = (message: Message) => {
    const text = message.parts.map((part) => {
      if (part.type === "text") return part.text;
      if (part.type === "code") return part.code;
      if (part.type === "file") return `${part.name} - ${part.url}`;
      if (part.type === "source") return `${part.title} - ${part.url}`;
      if (part.type === "table") return [part.columns.join("\t"), ...part.rows.map((row) => row.join("\t"))].join("\n");
      return "";
    }).filter(Boolean).join("\n\n");
    return text || message.content || "";
  };

  const copyMessage = async (message: Message) => {
    await navigator.clipboard.writeText(getMessagePlainText(message));
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId(null), 1200);
  };

  const quoteTextIntoInput = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    const quotedText = cleanText.split("\n").map((line) => `> ${line}`).join("\n");
    setInputValue((current) => current.trim() ? `${current.trim()}\n\n${quotedText}\n\n` : `${quotedText}\n\n`);
    setSelectionToolbar(null);
    window.setTimeout(() => {
      resizeTextareaToContent();
      textareaRef.current?.focus();
    }, 0);
  };

  const deleteMessage = (sessionId: string, messageId: string) => {
    setSessions((prev) => prev.map((session) => {
      if (session.id !== sessionId) return session;
      const targetIndex = session.messages.findIndex((message) => message.id === messageId);
      if (targetIndex === -1) return session;
      const idsToRemove = new Set([messageId]);
      if (session.messages[targetIndex].role === "user" && session.messages[targetIndex + 1]?.role === "assistant") {
        idsToRemove.add(session.messages[targetIndex + 1].id);
      }
      return {
        ...session,
        messages: session.messages.filter((message) => !idsToRemove.has(message.id)),
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  const handleMessageSelection = () => {
    window.setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      const anchorNode = selection?.anchorNode;
      const focusNode = selection?.focusNode;
      const scroller = messagesScrollRef.current;
      if (!selection || !selectedText || !anchorNode || !focusNode || !scroller?.contains(anchorNode) || !scroller.contains(focusNode)) {
        setSelectionToolbar(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        setSelectionToolbar(null);
        return;
      }
      const toolbarWidth = 168;
      setSelectionToolbar({
        text: selectedText,
        x: Math.min(window.innerWidth - toolbarWidth - 12, Math.max(12, rect.left + rect.width / 2 - toolbarWidth / 2)),
        y: Math.max(12, rect.top - 46),
      });
    }, 0);
  };

  const handleMessagesScroll = () => {
    const distanceFromBottom = getMessagesDistanceFromBottom();
    isUserReadingHistoryRef.current = distanceFromBottom > 120;
  };

  const handleMessagesWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY < 0) {
      isUserReadingHistoryRef.current = true;
      forceScrollToBottomRef.current = false;
    }
  };

  const handleMessagesTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchScrollStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleMessagesTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchScrollStartYRef.current === null) return;
    const currentY = event.touches[0]?.clientY ?? touchScrollStartYRef.current;
    if (currentY > touchScrollStartYRef.current + 8) {
      isUserReadingHistoryRef.current = true;
      forceScrollToBottomRef.current = false;
    }
  };

  const applyModel = (model: typeof MODEL_CATALOG[number]) => {
    setSelectedModel(model);
    setModelHistoryIds((prev) => [model.id, ...prev.filter((id) => id !== model.id)].slice(0, 3));
  };

  const changeSkillHeroSlide = (direction: 1 | -1) => {
    setActiveSkillHeroIndex((index) => (index + direction + SKILL_HERO_SLIDES.length) % SKILL_HERO_SLIDES.length);
  };

  const finishSkillHeroDrag = (clientX: number) => {
    if (skillHeroDragStartRef.current === null) return;
    const delta = clientX - skillHeroDragStartRef.current;
    skillHeroDragStartRef.current = null;
    if (Math.abs(delta) < 36) return;
    changeSkillHeroSlide(delta < 0 ? 1 : -1);
  };

  const renderSwitch = (checked: boolean, onChange: (next: boolean) => void) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${checked ? "bg-[#a682fe]" : "bg-[#d7d7d4]"}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  const renderSettingsRow = (
    title: string,
    description: string,
    control: JSX.Element,
  ) => (
    <div className="flex items-center justify-between gap-6 border-b border-[#ecebe8] py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="[font-family:'Inter',Helvetica] text-[14px] font-medium text-[#373734]">{title}</p>
        <p className="mt-1 [font-family:'Inter',Helvetica] text-[12px] leading-relaxed text-[#8c8b86]">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );

  const regenerateLastAssistant = () => {
    if (!activeChat || isGenerating) return;
    forceScrollToBottomRef.current = true;
    isUserReadingHistoryRef.current = false;
    const lastUser = [...activeChat.messages].reverse().find((message) => message.role === "user");
    if (!lastUser) return;
    const modelSnapshot = selectedModel;
    const lastUserText = lastUser.parts.find((part) => part.type === "text")?.text ?? lastUser.content ?? "";
    const estimatedCost = calculateRequestCost(modelSnapshot, estimateTokens(lastUserText), 800);
    if (balanceCredits < estimatedCost) {
      setCreditNotice(`Your balance is too low for ${modelSnapshot.name}. Add credits before regenerating.`);
      return;
    }
    const now = Date.now();
    const assistantMsg: Message = {
      id: `assistant-${now}`,
      role: "assistant",
      parts: [],
      status: "streaming",
      createdAt: new Date().toISOString(),
      statusLabel: "Thinking",
    };
    setSessions((prev) => prev.map((session) => session.id === activeChat.id ? { ...session, messages: [...session.messages, assistantMsg], updatedAt: new Date(now).toISOString() } : session));
    setCreditNotice(null);
    const contextSnapshot = [...activeChat.messages, assistantMsg]
      .filter((message) => message.status !== "error")
      .map((message) => ({
        role: message.role,
        content: getMessagePlainText(message),
      }))
      .filter((message) => message.content.trim())
      .slice(-16);
    void streamAssistantResponse(activeChat.id, assistantMsg.id, lastUserText, modelSnapshot, [], contextSnapshot);
  };

  const startNewChat = () => {
    abortControllerRef.current?.abort();
    setView("home");
    setActiveChatId(null);
    setInputValue("");
    setAttachedFiles([]);
  };

  const startRenameSession = (session: ChatSession) => {
    setRenamingSessionId(session.id);
    setRenameValue(session.title);
    setOpenRecentMenuId(null);
    setRecentMenuPosition(null);
  };

  const commitRenameSession = async () => {
    if (!renamingSessionId) return;
    const nextTitle = renameValue.trim();
    if (nextTitle) {
      setSessions((prev) => prev.map((session) => session.id === renamingSessionId ? { ...session, title: nextTitle, updatedAt: new Date().toISOString() } : session));
      await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: renamingSessionId, title: nextTitle }),
      }).catch(() => undefined);
    }
    setRenamingSessionId(null);
    setRenameValue("");
  };

  const togglePinSession = (sessionId: string) => {
    const target = sessions.find((session) => session.id === sessionId);
    const pinned = !target?.pinned;
    setSessions((prev) => prev.map((session) => session.id === sessionId ? { ...session, pinned: !session.pinned, updatedAt: new Date().toISOString() } : session));
    void fetch("/api/conversations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: sessionId, pinned }),
    }).catch(() => undefined);
    setOpenRecentMenuId(null);
    setRecentMenuPosition(null);
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    void fetch(`/api/conversations?id=${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => undefined);
    if (activeChatId === sessionId) {
      setActiveChatId(null);
      setView("home");
    }
    setOpenRecentMenuId(null);
    setRecentMenuPosition(null);
    setRenamingSessionId(null);
  };

  const toggleRecentMenu = (sessionId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (openRecentMenuId === sessionId) {
      setOpenRecentMenuId(null);
      setRecentMenuPosition(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setOpenRecentMenuId(sessionId);
    setRecentMenuPosition({
      x: Math.min(window.innerWidth - 162, Math.max(12, rect.right - 150)),
      y: Math.min(window.innerHeight - 132, rect.bottom + 6),
    });
  };

  /* ── Shared toolbar pieces (inlined JSX, not sub-components) ── */
  const hasText = !!inputValue.trim();

  const creditStatusJsx = creditNotice && (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f0ee] px-4 py-2 [font-family:'Inter',Helvetica] text-[11px]">
      <button
        type="button"
        onClick={() => { setView("settings"); setActiveNav("Setting"); setSettingsSection("credits"); }}
        className="font-medium text-[#a682fe] hover:text-[#9370e8]"
      >
        {creditNotice}
      </button>
    </div>
  );

  const attachmentChipsJsx = attachedFiles.length > 0 && (
    <div className="flex flex-wrap gap-2 px-4 pt-3">
      {attachedFiles.map((file) => (
        <div key={file.id} className="flex max-w-[240px] items-center gap-2 rounded-xl border border-[#e2e2df] bg-[#f5f5f3] px-3 py-2">
          <FileText size={14} strokeWidth={1.8} className="shrink-0 text-[#8c8b86]" />
          <div className="min-w-0">
            <p className="truncate [font-family:'Inter',Helvetica] text-[12px] font-medium text-[#373734]">{file.name}</p>
            <p className="[font-family:'Inter',Helvetica] text-[10px] text-[#9c9b97]">{file.size}</p>
          </div>
          <button
            type="button"
            onClick={() => setAttachedFiles((prev) => prev.filter((item) => item.id !== file.id))}
            className="shrink-0 rounded-md p-0.5 text-[#9c9b97] hover:bg-[#e2e2df] hover:text-[#373734]"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );

  const attachMenuJsx = (
    <div className="relative" ref={attachMenuRef}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleAttachFiles(event.target.files)}
      />
      <button
        type="button"
        data-testid="button-attach"
        onClick={() => setShowAttachMenu((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9c9b97] transition-colors hover:bg-[#f0f0ee] hover:text-[#373734]"
      >
        <Plus size={16} strokeWidth={2} />
      </button>

      {showAttachMenu && (
        <div className="absolute bottom-full left-0 mb-2 w-[210px] rounded-xl border border-[#e2e2df] bg-white shadow-lg z-50">
          <div className="p-1.5 flex flex-col gap-0.5">
            {/* Add files or photos */}
            <button
              type="button"
              data-testid="attach-menu-files"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f5f5f3]"
            >
              <div className="flex items-center gap-3">
                <Paperclip size={14} strokeWidth={1.8} className="text-[#4b4b48]" />
                <span className="[font-family:'Inter',Helvetica] text-[13px] text-[#373734]">Add files or photos</span>
              </div>
              <span className="[font-family:'Inter',Helvetica] text-[11px] text-[#9c9b97]">⌘</span>
            </button>

            {/* Skills */}
            <button
              type="button"
              data-testid="attach-menu-skills"
              className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f5f5f3]"
            >
              <div className="flex items-center gap-3">
                <Zap size={14} strokeWidth={1.8} className="text-[#4b4b48]" />
                <span className="[font-family:'Inter',Helvetica] text-[13px] text-[#373734]">Skills</span>
              </div>
              <ChevronRight size={13} strokeWidth={2} className="text-[#9c9b97]" />
            </button>

            {/* Web search */}
            <button
              type="button"
              data-testid="attach-menu-web-search"
              onClick={() => setWebSearchEnabled((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f5f5f3]"
            >
              <div className="flex items-center gap-3">
                <Globe size={14} strokeWidth={1.8} className={webSearchEnabled ? "text-[#a682fe]" : "text-[#4b4b48]"} />
                <span className={`[font-family:'Inter',Helvetica] text-[13px] ${webSearchEnabled ? "font-medium text-[#a682fe]" : "text-[#373734]"}`}>Web search</span>
              </div>
              {webSearchEnabled && <Check size={13} strokeWidth={2.5} className="text-[#a682fe]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const modelSelectorJsx = (
    <div className="relative" ref={modelMenuRef}>
      <button
        type="button"
        data-testid="button-model-selector"
        onClick={() => setShowModelMenu((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 [font-family:'Inter',Helvetica] text-[12px] font-medium text-[#4b4b48] hover:bg-[#ebebea]"
      >
        {selectedModel.name}
        <ChevronDown size={12} strokeWidth={2} />
      </button>
      {showModelMenu && (
        <div className="absolute bottom-full right-0 mb-2 w-[260px] rounded-xl border border-[#e2e2df] bg-white shadow-lg z-50">
          <div className="border-b border-[#f0f0ee] px-4 py-2.5">
            <p className="[font-family:'Inter',Helvetica] text-[13px] font-semibold text-[#373734]">Recent models</p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            {modelMenuModels.map((model) => {
              const isSelected = selectedModel.id === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  data-testid={`model-option-${model.id}`}
                  onClick={() => { applyModel(model); setShowModelMenu(false); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f5f5f3]"
                >
                  <div className="text-left">
                    <p className={`[font-family:'Inter',Helvetica] text-[13px] font-medium ${isSelected ? "text-[#a682fe]" : "text-[#373734]"}`}>{model.name}</p>
                    <p className="[font-family:'Inter',Helvetica] text-[11px] text-[#9c9b97]">{model.provider} · {model.description}</p>
                  </div>
                  {isSelected && <Check size={14} strokeWidth={2.5} className="shrink-0 text-[#a682fe]" />}
                </button>
              );
            })}
            <button
              type="button"
              data-testid="button-more-models"
              onClick={() => {
                setShowModelMenu(false);
                setView("models");
                setActiveNav("Model");
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#f5f5f3]"
            >
              <p className="[font-family:'Inter',Helvetica] text-[13px] text-[#373734]">More models</p>
              <ChevronRight size={14} strokeWidth={2} className="text-[#373734]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const sendButtonJsx = (
    <button
      type="button"
      onClick={isGenerating ? stopGeneration : handleSend}
      disabled={!hasText && !isGenerating}
      data-testid="button-send"
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:cursor-default ${
        hasText || isGenerating
          ? "bg-[#a682fe] hover:bg-[#9370e8]"
          : "hover:ring-2 hover:ring-[#a682fe]"
      }`}
    >
      {isGenerating ? (
        <Square size={12} strokeWidth={2.4} className="fill-white text-white" />
      ) : (
        <ArrowUp
          size={15}
          strokeWidth={2.2}
          className={hasText ? "text-white" : "text-[#c0bfba]"}
        />
      )}
    </button>
  );

  const toolbarJsx = (
    <div className="flex items-center justify-between px-4 pb-3">
      {attachMenuJsx}
      <div className="flex items-center gap-2">
        {modelSelectorJsx}
        {sendButtonJsx}
      </div>
    </div>
  );

  const isMarkdownTableSeparator = (line: string) => {
    const cells = line.trim().split("|").filter((cell) => cell.trim());
    return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
  };

  const parseMarkdownTableRow = (line: string) => line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

  const renderMathFormula = (formula: string, displayMode: boolean, key: React.Key) => {
    if (katexReady && window.katex) {
      const html = window.katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
        strict: "ignore",
        trust: false,
      });

      return displayMode ? (
        <div
          key={key}
          className="my-4 overflow-x-auto rounded-xl bg-[#f0f0ee] px-4 py-3 text-[#373734]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <span
          key={key}
          className="inline-block max-w-full overflow-x-auto align-middle"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    return displayMode ? (
      <div key={key} className="my-4 overflow-x-auto rounded-xl bg-[#f0f0ee] px-4 py-3 [font-family:'Menlo','SFMono-Regular',Consolas,monospace] text-[13px] text-[#373734]">
        {formula}
      </div>
    ) : (
      <span key={key} className="rounded-md bg-[#f0f0ee] px-1.5 py-0.5 [font-family:'Menlo','SFMono-Regular',Consolas,monospace] text-[12px] text-[#5f5e59]">
        {formula}
      </span>
    );
  };

  const renderInlineMarkdown = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const pattern = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$\n]+\$)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
      const token = match[0];
      const key = `${token}-${match.index}`;

      if (token.startsWith("[") && token.includes("](")) {
        const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (linkMatch) {
          nodes.push(
            <a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer" className="font-medium text-[#7d5cf2] underline decoration-[#c4b0fd] underline-offset-4 hover:text-[#5f3fd3]">
              {linkMatch[1]}
            </a>
          );
        } else {
          nodes.push(token);
        }
      } else if (token.startsWith("`")) {
        nodes.push(<code key={key} className="rounded-md bg-[#ebebea] px-1.5 py-0.5 [font-family:'Menlo','SFMono-Regular',Consolas,monospace] text-[12px] text-[#373734]">{token.slice(1, -1)}</code>);
      } else if (token.startsWith("**")) {
        nodes.push(<strong key={key} className="font-semibold text-[#2f2f2c]">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("*")) {
        nodes.push(<em key={key} className="italic text-[#4b4b48]">{token.slice(1, -1)}</em>);
      } else if (token.startsWith("$")) {
        nodes.push(renderMathFormula(token.slice(1, -1), false, key));
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
    return nodes;
  };

  const parseMarkdownBlocks = (text: string): MarkdownBlock[] => {
    const lines = text.split("\n");
    const blocks: MarkdownBlock[] = [];
    let paragraph: string[] = [];
    let listItems: string[] = [];
    let orderedListItems: string[] = [];
    let quoteLines: string[] = [];
    let codeLanguage = "";
    let codeLines: string[] = [];
    let inCode = false;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    };

    const flushList = () => {
      if (listItems.length) {
        blocks.push({ type: "list", ordered: false, items: listItems });
        listItems = [];
      }
      if (orderedListItems.length) {
        blocks.push({ type: "list", ordered: true, items: orderedListItems });
        orderedListItems = [];
      }
    };

    const flushQuote = () => {
      if (!quoteLines.length) return;
      blocks.push({ type: "quote", text: quoteLines.join("\n").trim() });
      quoteLines = [];
    };

    const flushLooseBlocks = () => {
      flushParagraph();
      flushList();
      flushQuote();
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();

      if (inCode) {
        if (trimmed.startsWith("```")) {
          blocks.push({ type: "code", language: codeLanguage || "text", code: codeLines.join("\n") });
          codeLanguage = "";
          codeLines = [];
          inCode = false;
        } else {
          codeLines.push(line);
        }
        continue;
      }

      if (trimmed.startsWith("```")) {
        flushLooseBlocks();
        inCode = true;
        codeLanguage = trimmed.slice(3).trim() || "text";
        codeLines = [];
        continue;
      }

      if (!trimmed) {
        flushLooseBlocks();
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushLooseBlocks();
        blocks.push({ type: "divider" });
        continue;
      }

      if (trimmed.startsWith("$$")) {
        flushLooseBlocks();
        const mathLines: string[] = [];
        const firstLine = trimmed.replace(/^\$\$\s?/, "");
        if (firstLine.endsWith("$$") && firstLine.length > 2) {
          blocks.push({ type: "math", formula: firstLine.replace(/\s?\$\$$/, ""), display: true });
          continue;
        }
        if (firstLine) mathLines.push(firstLine);
        while (lines[index + 1] !== undefined) {
          index += 1;
          const mathLine = lines[index].trim();
          if (mathLine.endsWith("$$")) {
            mathLines.push(mathLine.replace(/\s?\$\$$/, ""));
            break;
          }
          mathLines.push(lines[index]);
        }
        blocks.push({ type: "math", formula: mathLines.join("\n").trim(), display: true });
        continue;
      }

      if (trimmed.includes("|") && lines[index + 1] && isMarkdownTableSeparator(lines[index + 1])) {
        flushLooseBlocks();
        const columns = parseMarkdownTableRow(trimmed);
        index += 1;
        const rows: string[][] = [];
        while (lines[index + 1]?.trim().includes("|")) {
          index += 1;
          rows.push(parseMarkdownTableRow(lines[index]));
        }
        blocks.push({ type: "table", columns, rows });
        continue;
      }

      const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
      if (heading) {
        flushLooseBlocks();
        blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph();
        flushQuote();
        orderedListItems = [];
        listItems.push(trimmed.replace(/^[-*]\s+/, ""));
        continue;
      }

      const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
      if (ordered) {
        flushParagraph();
        flushQuote();
        listItems = [];
        orderedListItems.push(ordered[1]);
        continue;
      }

      if (trimmed.startsWith(">")) {
        flushParagraph();
        flushList();
        quoteLines.push(trimmed.replace(/^>\s?/, ""));
        continue;
      }

      flushList();
      flushQuote();
      paragraph.push(trimmed);
    }

    if (inCode) {
      blocks.push({ type: "code", language: codeLanguage || "text", code: codeLines.join("\n"), isStreaming: true });
    }
    flushLooseBlocks();
    return blocks;
  };

  const renderCodeBlock = (language: string, code: string, key: React.Key, isStreaming = false) => (
    <div key={key} className="my-4 overflow-hidden rounded-xl border border-[#292926] bg-[#2f2f2c] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#373734] px-4 py-2">
        <span className="[font-family:'Inter',Helvetica] text-[12px] font-medium text-white/70">{language || "text"}{isStreaming ? " · generating" : ""}</span>
        <button type="button" onClick={() => navigator.clipboard.writeText(code)} className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white" title="Copy code">
          <Copy size={13} />
        </button>
      </div>
      <pre className="max-h-[520px] overflow-auto p-4 [font-family:'Menlo','SFMono-Regular',Consolas,monospace] text-[13px] leading-relaxed text-[#f7f6f2]"><code>{code || " "}</code></pre>
    </div>
  );

  const renderMarkdownTable = (columns: string[], rows: string[][], key: React.Key) => (
    <div key={key} className="my-4 overflow-x-auto rounded-xl border border-[#d7d7d4] bg-white shadow-sm">
      <table className="min-w-full border-collapse [font-family:'Inter',Helvetica] text-[15px]">
        <thead className="bg-[#f0f0ee] text-[#373734]">
          <tr>{columns.map((column, index) => <th key={`${column}-${index}`} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{renderInlineMarkdown(column)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="border-t border-[#e7e6e2]">
              {columns.map((_, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap px-4 py-3 text-[#4b4b48]">{renderInlineMarkdown(row[cellIndex] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTextPart = (text: string) => {
    const blocks = parseMarkdownBlocks(text);
    return blocks.map((block, index) => {
      if (block.type === "heading") {
        const className = block.level === 1
          ? "mt-5 mb-2 text-[18px] font-semibold leading-snug text-[#373734]"
          : block.level === 2
            ? "mt-5 mb-2 text-[18px] font-semibold leading-snug text-[#373734]"
            : "mt-4 mb-1.5 text-[18px] font-semibold leading-snug text-[#373734]";
        const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
        return <Tag key={index} className={className}>{renderInlineMarkdown(block.text)}</Tag>;
      }
      if (block.type === "paragraph") {
        return <p key={index} className="my-3 leading-[1.75] text-[#373734]">{renderInlineMarkdown(block.text)}</p>;
      }
      if (block.type === "list") {
        const Tag = block.ordered ? "ol" : "ul";
        return (
          <Tag key={index} className={`${block.ordered ? "list-decimal" : "list-disc"} my-3 space-y-1.5 pl-5 leading-[1.7] text-[#373734]`}>
            {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}
          </Tag>
        );
      }
      if (block.type === "quote") {
        return <blockquote key={index} className="my-5 border-l-2 border-[#c4b0fd] bg-[#f0f0ee] px-5 py-4 text-[#5f5e59]">{renderInlineMarkdown(block.text)}</blockquote>;
      }
      if (block.type === "code") return renderCodeBlock(block.language, block.code, index, block.isStreaming);
      if (block.type === "table") return renderMarkdownTable(block.columns, block.rows, index);
      if (block.type === "divider") return <hr key={index} className="my-5 border-[#d7d7d4]" />;
      return renderMathFormula(block.formula, block.display, index);
    });
  };

  const renderChartPart = (part: Extract<MessagePart, { type: "chart" }>) => {
    const colors = ["#a682fe", "#373734", "#8c8b86", "#c4b0fd"];
    const chartMargin = { top: 8, right: 16, bottom: 4, left: -18 };

    return (
      <div className="mt-4 rounded-2xl border border-[#d7d7d4] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ede9fe]">
            <BarChart3 size={17} strokeWidth={1.8} className="text-[#a682fe]" />
          </div>
          <div className="min-w-0">
            <p className="[font-family:'Inter',Helvetica] text-[14px] font-semibold text-[#373734]">{part.title}</p>
            <p className="mt-0.5 [font-family:'Inter',Helvetica] text-[12px] leading-relaxed text-[#8c8b86]">{part.description}</p>
          </div>
        </div>
        <div className="h-[230px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {part.chartType === "pie" ? (
              <PieChart>
                <Pie data={part.data} dataKey={part.yKeys[0]} nameKey={part.xKey} innerRadius={42} outerRadius={78} paddingAngle={3}>
                  {part.data.map((entry, index) => <Cell key={`${entry[part.xKey]}-${index}`} fill={colors[index % colors.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ border: "1px solid #d7d7d4", borderRadius: 12, fontFamily: "Inter, Helvetica", fontSize: 12 }} />
              </PieChart>
            ) : part.chartType === "line" || part.chartType === "area" ? (
              <ComposedChart data={part.data} margin={chartMargin}>
                <CartesianGrid stroke="#e7e6e2" vertical={false} />
                <XAxis dataKey={part.xKey} tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ border: "1px solid #d7d7d4", borderRadius: 12, fontFamily: "Inter, Helvetica", fontSize: 12 }} />
                {part.yKeys.map((key, index) => part.chartType === "area" ? (
                  <Area key={key} type="monotone" dataKey={key} fill={colors[index % colors.length]} fillOpacity={0.14} stroke={colors[index % colors.length]} strokeWidth={2.5} />
                ) : (
                  <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                ))}
              </ComposedChart>
            ) : (
              <BarChart data={part.data} margin={chartMargin}>
                <CartesianGrid stroke="#e7e6e2" vertical={false} />
                <XAxis dataKey={part.xKey} tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ border: "1px solid #d7d7d4", borderRadius: 12, fontFamily: "Inter, Helvetica", fontSize: 12 }} />
                {part.yKeys.map((key, index) => <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[6, 6, 0, 0]} />)}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <button type="button" className="mt-3 rounded-lg px-2 py-1 [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86] hover:bg-[#f5f5f3] hover:text-[#373734]">
          Download data
        </button>
      </div>
    );
  };

  const renderMessagePart = (part: MessagePart, index: number) => {
    if (part.type === "text") {
      return <div key={index}>{renderTextPart(part.text)}</div>;
    }
    if (part.type === "code") {
      return renderCodeBlock(part.language, part.code, index);
    }
    if (part.type === "chart") return <div key={index}>{renderChartPart(part)}</div>;
    if (part.type === "file") {
      return (
        <div key={index} className="mt-4 flex items-center gap-3 rounded-2xl border border-[#d7d7d4] bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ede9fe]">
            <FileText size={18} strokeWidth={1.8} className="text-[#a682fe]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate [font-family:'Inter',Helvetica] text-[14px] font-semibold text-[#373734]">{part.name}</p>
            <p className="mt-0.5 truncate [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86]">{part.fileType} · {part.size} · {part.description}</p>
          </div>
          <a href={part.url} download className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c8b86] hover:bg-[#f5f5f3] hover:text-[#373734]">
            <Download size={16} />
          </a>
        </div>
      );
    }
    if (part.type === "table") {
      return renderMarkdownTable(part.columns, part.rows, index);
    }
    if (part.type === "source") {
      return (
        <a
          key={index}
          href={part.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-start gap-3 rounded-2xl border border-[#d7d7d4] bg-white p-4 shadow-sm hover:border-[#c4b0fd]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f3] text-[#8c8b86]">
            <Globe size={16} />
          </div>
          <div className="min-w-0">
            <p className="truncate [font-family:'Inter',Helvetica] text-[13px] font-semibold text-[#373734]">{part.title}</p>
            {part.description && <p className="mt-1 line-clamp-2 [font-family:'Inter',Helvetica] text-[12px] leading-relaxed text-[#8c8b86]">{part.description}</p>}
            <p className="mt-1 truncate [font-family:'Inter',Helvetica] text-[11px] text-[#a682fe]">{part.url}</p>
          </div>
        </a>
      );
    }
    return (
      <div key={index} className="mt-4 rounded-2xl border border-[#d7d7d4] bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-[#8c8b86]"><ImageIcon size={15} />{part.title ?? part.alt}</div>
        <img src={part.src} alt={part.alt} className="max-h-[320px] w-full rounded-xl object-cover" />
      </div>
    );
  };

  const renderTypingDots = (label?: string) => (
    <div className="inline-flex items-center gap-2 align-middle text-[#8c8b86]">
      {label && <span className="[font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">{label}</span>}
      <span className="flex items-center gap-1" aria-label="AI is loading">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a682fe]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a682fe] [animation-delay:140ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a682fe] [animation-delay:280ms]" />
      </span>
    </div>
  );

  const updateMemory = async (id: string, action: "activate" | "deactivate" | "dismiss" | "delete" | "update", content?: string, messageId?: string) => {
    if (action === "dismiss" && messageId && activeChatId) {
      updateAssistantMessage(activeChatId, messageId, { memorySuggestion: undefined });
    }
    if (action === "activate" && messageId && activeChatId) {
      setMemories((prev) => prev.map((memory) => memory.id === id ? { ...memory, status: "active", updatedAt: new Date().toISOString() } : memory));
    }
    const response = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, action, content }),
    });
    if (!response.ok) {
      if (action === "dismiss") void fetchMemories();
      return;
    }
    const payload = await response.json() as { memories?: MemoryItem[] };
    if (Array.isArray(payload.memories)) setMemories(payload.memories);
  };

  const clearAllMemories = async () => {
    const response = await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "clear_all" }),
    });
    if (!response.ok) return;
    const payload = await response.json() as { memories?: MemoryItem[] };
    if (Array.isArray(payload.memories)) setMemories(payload.memories);
  };

  const renderMemorySuggestion = (message: Message) => {
    if (!message.memorySuggestion || !memoryEnabled) return null;
    const remembered = memories.find((memory) => memory.id === message.memorySuggestion?.id)?.status === "active";
    if (remembered) {
      return (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 [font-family:'Inter',Helvetica] text-[12px] text-[#6f50d8]">
          <Check size={13} /> Saved to memory
        </div>
      );
    }
    return (
      <div className="mt-3 max-w-[520px] rounded-2xl border border-[#e4ddff] bg-[#fbf9ff] px-4 py-3">
        <p className="[font-family:'Inter',Helvetica] text-[12px] font-semibold text-[#6f50d8]">Remember this?</p>
        <p className="mt-1 [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#4b4b48]">{message.memorySuggestion.content}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => updateMemory(message.memorySuggestion!.id, "activate", undefined, message.id)}
            className="rounded-full bg-[#373734] px-3 py-1.5 [font-family:'Inter',Helvetica] text-[12px] font-medium text-white hover:bg-[#5f3fd3]"
          >
            Save memory
          </button>
          <button
            type="button"
            onClick={() => updateMemory(message.memorySuggestion!.id, "dismiss", undefined, message.id)}
            className="rounded-full px-3 py-1.5 [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86] hover:bg-[#f0f0ee] hover:text-[#373734]"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  const renderAssistantActions = (message: Message) => (
    <>
      {renderMemorySuggestion(message)}
      <div className="mt-2 flex items-center gap-1 text-[#9c9b97]">
        <button type="button" onClick={() => copyMessage(message)} className="rounded-lg p-1.5 hover:bg-[#ebebea] hover:text-[#373734]" title="Copy">
          {copiedMessageId === message.id ? <Check size={14} className="text-[#a682fe]" /> : <Copy size={14} />}
        </button>
        <button type="button" onClick={regenerateLastAssistant} disabled={isGenerating} className="rounded-lg p-1.5 hover:bg-[#ebebea] hover:text-[#373734] disabled:opacity-40" title="Regenerate">
          <RotateCcw size={14} />
        </button>
        <button type="button" className="rounded-lg p-1.5 hover:bg-[#ebebea] hover:text-[#373734]" title="Like">
          <ThumbsUp size={14} />
        </button>
        <button type="button" className="rounded-lg p-1.5 hover:bg-[#ebebea] hover:text-[#373734]" title="Dislike">
          <ThumbsDown size={14} />
        </button>
      </div>
    </>
  );

  const renderUserActions = (message: Message) => (
    <div className="mt-1.5 flex justify-end gap-1 text-[#9c9b97] opacity-0 transition-opacity group-hover/message:opacity-100">
      <button type="button" onClick={() => copyMessage(message)} className="rounded-lg p-1.5 hover:bg-[#ebebea] hover:text-[#373734]" title="Copy">
        {copiedMessageId === message.id ? <Check size={13} className="text-[#a682fe]" /> : <Copy size={13} />}
      </button>
      <button type="button" onClick={() => quoteTextIntoInput(getMessagePlainText(message))} className="rounded-lg p-1.5 hover:bg-[#ebebea] hover:text-[#373734]" title="Quote">
        <Quote size={13} />
      </button>
      {activeChat && (
        <button type="button" onClick={() => deleteMessage(activeChat.id, message.id)} className="rounded-lg p-1.5 hover:bg-[#fff1f1] hover:text-[#a14b4b]" title="Delete">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );

  const filteredModels = MODEL_CATALOG.filter((model) => {
    const matchesProvider = modelProviderTab === "All models" || model.provider === modelProviderTab;
    const query = modelSearch.trim().toLowerCase();
    const matchesSearch = !query || [model.name, model.provider, model.description].some((value) => value.toLowerCase().includes(query));
    return matchesProvider && matchesSearch;
  });

  if (authLoading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#f5f5f3]">
        <div className="flex items-center gap-3 [font-family:'Inter',Helvetica] text-[14px] text-[#8c8b86]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#a682fe]" />
          Loading Sapienda
        </div>
      </main>
    );
  }

  if (!authUser) {
    const isRegister = authMode === "register";
    return (
      <main className="flex min-h-screen bg-[#f5f5f3] px-6 py-8">
        <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-2xl border border-[#e2e2df] bg-white shadow-sm lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.7fr)]">
          <section
            className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden p-10 lg:flex"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\"), linear-gradient(135deg, #7A42D8 0%, #C9B4F2 48%, #FFF2BC 100%)",
              backgroundBlendMode: "soft-light, normal",
            }}
          >
            <div className="relative z-10">
              <p className="[font-family:'Cardo',Georgia,serif] text-[28px] font-bold text-white/90">Sapienda</p>
              <h1 className="mt-16 max-w-[460px] [font-family:'EB_Garamond',Georgia,serif] text-[56px] font-semibold leading-[0.98] text-[#262622]">
                Work with every model from one calm workspace.
              </h1>
              <p className="mt-5 max-w-[420px] [font-family:'Inter',Helvetica] text-[15px] leading-relaxed text-[#373734]/75">
                Sign in to keep your credits, preferences, and recent conversations tied to your account.
              </p>
            </div>
            <div className="relative z-10 rounded-2xl border border-white/35 bg-white/35 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="[font-family:'Inter',Helvetica] text-[12px] font-semibold uppercase tracking-[0.18em] text-[#373734]/70">Starting balance</span>
                <span className="rounded-full bg-white/65 px-3 py-1 [font-family:'Inter',Helvetica] text-[12px] font-semibold text-[#7A42D8]">$5.00 credits</span>
              </div>
              <p className="mt-3 [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#4b4b48]">
                New accounts receive test credits so you can verify models, usage tracking, and billing flows.
              </p>
            </div>
          </section>

          <section className="flex min-h-[640px] flex-col justify-center px-6 py-10 sm:px-10">
            <div className="mx-auto w-full max-w-[420px]">
              <p className="[font-family:'Cardo',Georgia,serif] text-[26px] font-bold text-[#a682fe] lg:hidden">Sapienda</p>
              <h2 className="mt-6 [font-family:'EB_Garamond',Georgia,serif] text-[42px] font-semibold leading-tight text-[#373734]">
                {isRegister ? "Create account" : "Welcome back"}
              </h2>
              <p className="mt-2 [font-family:'Inter',Helvetica] text-[14px] leading-relaxed text-[#8c8b86]">
                {isRegister ? "Start with a balance account and keep your credits in sync." : "Sign in to continue using your Sapienda workspace."}
              </p>

              <form className="mt-8 flex flex-col gap-4" onSubmit={handleAuthSubmit}>
                {isRegister && (
                  <label className="flex flex-col gap-2">
                    <span className="[font-family:'Inter',Helvetica] text-[13px] font-medium text-[#4b4b48]">Name</span>
                    <input
                      value={authForm.displayName}
                      onChange={(event) => setAuthForm((form) => ({ ...form, displayName: event.target.value }))}
                      className="rounded-xl border border-[#d7d7d4] bg-[#f9f9f7] px-4 py-3 [font-family:'Inter',Helvetica] text-[14px] text-[#373734] outline-none transition-colors focus:border-[#a682fe] focus:bg-white"
                      placeholder="Ander Wong"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-2">
                  <span className="[font-family:'Inter',Helvetica] text-[13px] font-medium text-[#4b4b48]">Email</span>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))}
                    className="rounded-xl border border-[#d7d7d4] bg-[#f9f9f7] px-4 py-3 [font-family:'Inter',Helvetica] text-[14px] text-[#373734] outline-none transition-colors focus:border-[#a682fe] focus:bg-white"
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="[font-family:'Inter',Helvetica] text-[13px] font-medium text-[#4b4b48]">Password</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))}
                    className="rounded-xl border border-[#d7d7d4] bg-[#f9f9f7] px-4 py-3 [font-family:'Inter',Helvetica] text-[14px] text-[#373734] outline-none transition-colors focus:border-[#a682fe] focus:bg-white"
                    placeholder="At least 8 characters"
                    required
                  />
                </label>
                {isRegister && (
                  <label className="flex flex-col gap-2">
                    <span className="[font-family:'Inter',Helvetica] text-[13px] font-medium text-[#4b4b48]">Confirm password</span>
                    <input
                      type="password"
                      value={authForm.confirmPassword}
                      onChange={(event) => setAuthForm((form) => ({ ...form, confirmPassword: event.target.value }))}
                      className="rounded-xl border border-[#d7d7d4] bg-[#f9f9f7] px-4 py-3 [font-family:'Inter',Helvetica] text-[14px] text-[#373734] outline-none transition-colors focus:border-[#a682fe] focus:bg-white"
                      placeholder="Repeat password"
                      required
                    />
                  </label>
                )}

                {authError && (
                  <div className="rounded-xl border border-[#efd1d1] bg-[#fff7f7] px-4 py-3 [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#a14b4b]">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="mt-2 rounded-full bg-[#191918] px-5 py-3 [font-family:'Inter',Helvetica] text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#191918] hover:to-[#5f2fc2] disabled:translate-y-0 disabled:opacity-55"
                >
                  {authSubmitting ? "Working..." : isRegister ? "Create account" : "Sign in"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setAuthMode(isRegister ? "login" : "register");
                  setAuthError(null);
                }}
                className="mt-6 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86] hover:text-[#373734]"
              >
                {isRegister ? "Already have an account? Sign in" : "New to Sapienda? Create an account"}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex h-screen overflow-hidden bg-[#f5f5f3]"
      style={{ userSelect: isResizing ? "none" : undefined, cursor: isResizing ? "col-resize" : undefined }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="relative flex h-full shrink-0 flex-col border-r border-[#e2e2df] bg-[#f5f5f3]"
        style={{ width: sidebarWidth }}
      >
        <div className={`${collapsed ? "px-0 text-center" : "px-5"} pt-4 pb-4`}>
          {collapsed
            ? <span className="[font-family:'Cardo',Helvetica] text-[18px] font-bold text-[#a682fe]">S</span>
            : <span className="[font-family:'Cardo',Helvetica] text-[22px] font-bold text-[#a682fe]">Sapienda</span>
          }
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {navigationItems.map(({ label, icon: Icon }) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                setActiveNav(label);
                if (label === "New chat") startNewChat();
                else if (label === "Search") { setShowSearchModal(true); setSearchQuery(""); }
                else if (label === "Skills") { setView("skills"); }
                else if (label === "Usage") { setView("usage"); }
                else if (label === "Model") { setView("models"); }
                else if (label === "Setting") { setView("settings"); }
                }}
                data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
                title={collapsed ? label : undefined}
                className={`flex min-h-[38px] w-full items-center rounded-xl text-left transition-colors hover:bg-[#ebebea] ${isActive ? "bg-[#ebebea]" : ""} ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
              >
                <Icon className="shrink-0 text-[#4b4b48]" size={16} strokeWidth={1.75} />
                {!collapsed && (
                  <span className="[font-family:'Inter',Helvetica] truncate text-[13px] font-medium text-[#4b4b48]">{label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
            <p className="px-2 [font-family:'Inter',Helvetica] text-[11px] font-semibold uppercase tracking-wide text-[#9c9b97]">Recent</p>
            <div className="mt-2 flex min-h-0 flex-col gap-1 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="mt-1 px-2 [font-family:'Inter',Helvetica] text-[12px] leading-relaxed text-[#b5b4ae]">Your chats will show up here</p>
              ) : (
                sortedSessions.map((session) => (
                  <div
                    key={session.id}
                    data-testid={`chat-session-${session.id}`}
                    className={`group relative flex min-h-[34px] w-full items-center gap-1 rounded-xl px-2 py-1.5 hover:bg-[#ebebea] ${activeChatId === session.id ? "bg-[#ebebea]" : ""}`}
                  >
                    {renamingSessionId === session.id ? (
                      <input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={commitRenameSession}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") commitRenameSession();
                          if (event.key === "Escape") { setRenamingSessionId(null); setRenameValue(""); }
                        }}
                        autoFocus
                        className="min-w-0 flex-1 rounded-md bg-white px-1.5 py-0.5 [font-family:'Inter',Helvetica] text-[12px] text-[#373734] outline-none ring-1 ring-[#c4b0fd]"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setActiveChatId(session.id); setView("chat"); setActiveNav(""); void loadConversationMessages(session.id); }}
                        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      >
                        {session.pinned && <Star size={11} className="shrink-0 fill-[#a682fe] text-[#a682fe]" />}
                        <span className="[font-family:'Inter',Helvetica] truncate text-[12px] text-[#4b4b48]">{session.title}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => toggleRecentMenu(session.id, event)}
                      className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9c9b97] opacity-0 hover:bg-[#dededb] hover:text-[#373734] group-hover:opacity-100"
                      aria-label="Chat actions"
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-[#e2e2df] px-3 py-3">
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            <div className={`flex items-center ${collapsed ? "" : "gap-2"}`}>
              <Avatar className="h-8 w-8 shrink-0 bg-[#373734]">
                <AvatarFallback className="bg-[#373734] text-[11px] font-bold text-white">{userInitials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div>
                  <p className="[font-family:'Inter',Helvetica] text-[12px] font-medium text-[#373734]">{userDisplayName}</p>
                  <p className="[font-family:'Inter',Helvetica] text-[11px] text-[#9c9b97]">{userPlan}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                aria-label="Settings"
                data-testid="button-account-settings"
                onClick={() => { setView("settings"); setActiveNav("Setting"); }}
                className="rounded-md p-1 text-[#9c9b97] hover:bg-[#ebebea] hover:text-[#373734]"
              >
                <Settings2 size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>

        <div
          onMouseDown={onResizeMouseDown}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#a682fe]/30 active:bg-[#a682fe]/50"
          data-testid="sidebar-resize-handle"
        />
      </aside>
      {/* ── Main ── */}
      <section className="relative flex flex-1 flex-col overflow-hidden bg-[#f5f5f3]">
        <AnimatePresence mode="wait">

          {/* HOME VIEW */}
          {view === "home" && (
            <motion.div
              key="home"
              className="flex flex-1 flex-col items-center justify-center px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div className="mb-5 flex items-center gap-2">
                <img src="/figmaAssets/logo-icon-new.png" alt="Sapienda logo" className="h-[38px] w-[38px] shrink-0 object-contain" />
                <h1 className="[font-family:'EB_Garamond',Georgia,serif] text-[38px] font-normal leading-none text-[#373734]">
                  What should I do for you ?
                </h1>
              </div>

              <div className="w-full max-w-[720px]">
                <div className="rounded-2xl border border-[#d7d7d4] bg-white shadow-sm focus-within:border-[#c4b0fd] focus-within:ring-1 focus-within:ring-[#c4b0fd]">
                  {attachmentChipsJsx}
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me everything ..."
                    data-testid="input-message"
                    rows={2}
                    className="max-h-[160px] min-h-[70px] resize-none overflow-hidden rounded-t-2xl border-0 bg-transparent px-5 pt-4 pb-2 [font-family:'Inter',Helvetica] text-[15px] text-[#373734] placeholder:text-[#c0bfba] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {creditStatusJsx}
                  {toolbarJsx}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestedPrompts.map((item) => {
                    const Icon = item.icon;
                    return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setInputValue(item.prompt)}
                      className="flex items-center gap-2 rounded-full border border-[#e2e2df] bg-white px-4 py-2 [font-family:'Inter',Helvetica] text-[12px] text-[#4b4b48] shadow-sm hover:border-[#c4b0fd] hover:text-[#373734]"
                    >
                      <Icon size={13} strokeWidth={1.8} className="shrink-0 text-[#9c9b97]" />
                      {item.label}
                    </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* CHAT VIEW */}
          {view === "chat" && (
            <motion.div
              key="chat"
              className="flex h-full flex-1 flex-col overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div
                ref={messagesScrollRef}
                onScroll={handleMessagesScroll}
                onWheel={handleMessagesWheel}
                onMouseDown={() => {
                  if (getMessagesDistanceFromBottom() > 120) {
                    isUserReadingHistoryRef.current = true;
                    forceScrollToBottomRef.current = false;
                  }
                }}
                onTouchStart={handleMessagesTouchStart}
                onTouchMove={handleMessagesTouchMove}
                onMouseUp={handleMessageSelection}
                onTouchEnd={handleMessageSelection}
                className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
              >
                <div className="mx-auto flex max-w-[760px] flex-col gap-7">
                  {activeChat?.messages.map((msg) => (
                    <div
                      key={msg.id}
                      data-testid={`message-${msg.role}-${msg.id}`}
                      className={`group/message flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "user" ? (
                        <div className="max-w-[75%]">
                          <div className="rounded-2xl bg-[#373734] px-5 py-3">
                            <p className="whitespace-pre-wrap [font-family:'Inter',Helvetica] text-[15px] leading-[1.7] text-white">
                              {msg.parts.find((part) => part.type === "text")?.text ?? msg.content}
                            </p>
                          </div>
                          {renderUserActions(msg)}
                        </div>
                      ) : (
                        <div className="max-w-full flex-1">
                          <div className={`[font-family:'Inter',Helvetica] text-[15px] leading-[1.7] text-[#373734] ${msg.status === "error" && msg.parts.length > 0 ? "rounded-xl border border-[#ead6d6] bg-[#fff7f7] px-4 py-3 text-[#9b4a4a]" : ""}`}>
                            {msg.parts.length > 0 ? msg.parts.map(renderMessagePart) : (
                              renderTypingDots(msg.statusLabel ?? "Thinking")
                            )}
                            {msg.status === "streaming" && msg.parts.length > 0 && (
                              <div className="mt-2">
                                {renderTypingDots()}
                              </div>
                            )}
                            {msg.status === "error" && (
                              msg.parts.length === 0 ? (
                                <div className="mt-3 rounded-xl border border-[#ead6d6] bg-[#fff7f7] px-4 py-3 text-[#9b4a4a]">
                                  Response failed. Try regenerating this answer.
                                </div>
                              ) : null
                            )}
                          </div>
                          {msg.status !== "streaming" && renderAssistantActions(msg)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 bg-[#f5f5f3] px-6 py-4">
                <div className="mx-auto max-w-[760px]">
                  <div className="rounded-2xl border border-[#d7d7d4] bg-white shadow-sm focus-within:border-[#c4b0fd] focus-within:ring-1 focus-within:ring-[#c4b0fd]">
                    {attachmentChipsJsx}
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Write a message ..."
                      data-testid="input-message"
                      rows={1}
                      className="max-h-[160px] min-h-[48px] resize-none overflow-hidden rounded-t-2xl border-0 bg-transparent px-5 pt-3.5 pb-2 [font-family:'Inter',Helvetica] text-[15px] text-[#373734] placeholder:text-[#c0bfba] focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {creditStatusJsx}
                    {toolbarJsx}
                  </div>
                  <p className="mt-2 text-center [font-family:'Inter',Helvetica] text-[11px] text-[#b5b4ae]">
                    AI may make mistake. Please double-check responses.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* USAGE VIEW */}
          {view === "usage" && (
            <motion.div
              key="usage"
              className="flex flex-1 flex-col overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="mx-auto w-full max-w-[1220px] px-8 py-10 lg:px-12">
                <div className="mb-8">
                  <h1 className="[font-family:'EB_Garamond',Georgia,serif] text-[48px] font-normal leading-tight text-[#373734]">Usage</h1>
                  <p className="mt-1.5 [font-family:'Inter',Helvetica] text-[15px] text-[#8c8b86]">
                    Track your credits, token usage, and model-level spending in Sapienda.
                  </p>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {usageSummary.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-[#d7d7d4] bg-white px-6 py-5 shadow-sm"
                    >
                      <p className="[font-family:'Inter',Helvetica] text-[14px] text-[#8c8b86]">{item.label}</p>
                      <p className="mt-6 [font-family:'Inter',Helvetica] text-[42px] font-normal leading-none text-[#a682fe]">
                        {item.value}
                      </p>
                      <p className="mt-5 min-h-[42px] [font-family:'Inter',Helvetica] text-[14px] leading-relaxed text-[#8c8b86]">
                        {item.description}
                      </p>
                      {typeof item.progress === "number" && (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7e6e2]">
                          <div
                            className="h-full rounded-full bg-[#a682fe]"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="rounded-2xl border border-[#d7d7d4] bg-white px-6 py-5 shadow-sm">
                      <div className="mb-5">
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Credit usage over time</h2>
                        <p className="mt-1 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                          Daily spend trend for the selected period.
                        </p>
                      </div>
                      <div className="mb-2 flex items-center gap-4 [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86]">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#373734]" />Credits used</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#a682fe]" />Daily average</span>
                      </div>
                      <div className="h-[280px] min-w-0">
                        {creditUsageData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={creditUsageData} margin={{ top: 8, right: 18, left: -18, bottom: 4 }}>
                              <defs>
                                <linearGradient id="creditFill" x1="0" x2="0" y1="0" y2="1">
                                  <stop offset="5%" stopColor="#373734" stopOpacity={0.16} />
                                  <stop offset="95%" stopColor="#373734" stopOpacity={0.04} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="#e7e6e2" vertical={false} />
                              <XAxis dataKey="date" tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={(value) => `$${Number(value).toFixed(2)}`} tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, "dataMax + 0.2"]} />
                              <RechartsTooltip
                                cursor={{ stroke: "#d7d7d4" }}
                                contentStyle={{ border: "1px solid #d7d7d4", borderRadius: 12, boxShadow: "0 10px 30px rgba(55,55,52,0.08)", fontFamily: "Inter, Helvetica", fontSize: 12 }}
                                formatter={(value, name) => [formatCredits(Number(value)), name === "credits" ? "Credits used" : "Daily average"]}
                              />
                              <Area type="monotone" dataKey="credits" fill="url(#creditFill)" stroke="transparent" />
                              <Line type="monotone" dataKey="average" stroke="#a682fe" strokeWidth={2} strokeDasharray="5 7" dot={false} />
                              <Line type="monotone" dataKey="credits" stroke="#373734" strokeWidth={3} dot={{ r: 4, fill: "#f5f5f3", stroke: "#373734", strokeWidth: 3 }} activeDot={{ r: 5 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-xl bg-[#f5f5f3] [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                            Credit usage will appear after your first completed chat.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#d7d7d4] bg-white px-6 py-5 shadow-sm">
                      <div className="mb-5">
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Token usage</h2>
                        <p className="mt-1 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                          Compare input tokens and output tokens by day.
                        </p>
                      </div>
                      <div className="mb-2 flex items-center gap-4 [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86]">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#a682fe]" />Input tokens</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#373734]" />Output tokens</span>
                      </div>
                      <div className="h-[310px] min-w-0">
                        {tokenUsageData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tokenUsageData} margin={{ top: 8, right: 18, left: -12, bottom: 4 }}>
                              <CartesianGrid stroke="#e7e6e2" vertical={false} />
                              <XAxis dataKey="date" tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={(value) => formatTokenCount(Number(value))} tick={{ fill: "#8c8b86", fontSize: 12 }} axisLine={false} tickLine={false} />
                              <RechartsTooltip
                                cursor={{ fill: "#f5f5f3" }}
                                contentStyle={{ border: "1px solid #d7d7d4", borderRadius: 12, boxShadow: "0 10px 30px rgba(55,55,52,0.08)", fontFamily: "Inter, Helvetica", fontSize: 12 }}
                                formatter={(value, name) => [formatTokenCount(Number(value)), name === "input" ? "Input tokens" : "Output tokens"]}
                              />
                              <Bar dataKey="input" stackId="tokens" fill="#a682fe" radius={[0, 0, 6, 6]} />
                              <Bar dataKey="output" stackId="tokens" fill="#373734" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-xl bg-[#f5f5f3] [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                            Token usage will appear after your first completed chat.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full min-w-0 flex-col rounded-2xl border border-[#d7d7d4] bg-white px-5 py-5 shadow-sm">
                    <div className="mb-5">
                      <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Model spend</h2>
                      <p className="mt-1 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                        Credits consumed by each model.
                      </p>
                    </div>
                    <div className="flex flex-1 flex-col gap-3">
                      {modelSpendData.length ? modelSpendData.map((model) => (
                        <div
                          key={model.name}
                          className="flex items-center gap-3 rounded-2xl border border-[#e2e2df] bg-white px-4 py-4"
                        >
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${model.color} [font-family:'Inter',Helvetica] text-[11px] font-bold text-white`}>
                            {model.badge}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate [font-family:'Inter',Helvetica] text-[14px] font-semibold text-[#373734]">{model.name}</p>
                            <p className="mt-1 truncate [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86]">{model.meta}</p>
                          </div>
                          <p className="shrink-0 [font-family:'Inter',Helvetica] text-[18px] font-bold text-[#191918]">{model.spend}</p>
                        </div>
                      )) : (
                        <div className="flex flex-1 items-center justify-center rounded-xl bg-[#f5f5f3] px-4 py-10 text-center [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#8c8b86]">
                          Model-level spend will appear once a model completes a response.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODELS VIEW */}
          {view === "models" && (
            <motion.div
              key="models"
              className="flex flex-1 flex-col overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="mx-auto w-full max-w-[1220px] px-8 py-10 lg:px-12">
                <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="[font-family:'EB_Garamond',Georgia,serif] text-[48px] font-normal leading-tight text-[#373734]">Models</h1>
                    <p className="mt-1.5 [font-family:'Inter',Helvetica] text-[15px] text-[#8c8b86]">
                      Select a model as the capability provider
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-2.5 rounded-full border border-[#d7d7d4] bg-white px-5 py-3 shadow-sm md:w-[330px]">
                    <Search size={15} strokeWidth={1.8} className="shrink-0 text-[#9c9b97]" />
                    <input
                      type="text"
                      placeholder="Search models"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      data-testid="input-search-models"
                      className="min-w-0 flex-1 bg-transparent [font-family:'Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none"
                    />
                  </div>
                </div>

                <div className="mb-8 flex flex-wrap items-center gap-6">
                  {MODEL_PROVIDERS.map((provider) => {
                    const isActive = modelProviderTab === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        data-testid={`model-provider-${provider.toLowerCase().replace(/\s/g, "-")}`}
                        onClick={() => setModelProviderTab(provider)}
                        className={`rounded-full px-5 py-2.5 [font-family:'Inter',Helvetica] text-[14px] transition-colors ${
                          isActive
                            ? "bg-[#ebebea] font-medium text-[#191918]"
                            : "text-[#373734] hover:bg-[#ebebea]"
                        }`}
                      >
                        {provider}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${modelProviderTab}-${modelSearch}`}
                    className="grid grid-cols-1 gap-x-12 gap-y-4 lg:grid-cols-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {filteredModels.map((model) => {
                      const isSelected = selectedModel.id === model.id;
                      return (
                        <motion.div
                          key={model.id}
                          layout
                          className="group flex min-h-[82px] items-center gap-5 rounded-2xl px-0 py-3 transition-transform duration-200 ease-out hover:translate-x-1"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d9d9d9]">
                            <img
                              src={model.logoSrc}
                              alt={`${model.provider} logo`}
                              className="h-7 w-7 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="[font-family:'Inter',Helvetica] text-[15px] font-medium text-[#373734]">{model.name}</p>
                            <p className="mt-1 line-clamp-2 [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#8c8b86]">
                              {model.provider} · {model.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {typeof model.inputCacheHitPerMTokens === "number" && typeof model.inputCacheMissPerMTokens === "number" && typeof model.outputPerMTokens === "number" ? (
                                <>
                                  <span className="rounded-full bg-[#ede9fe] px-2.5 py-1 [font-family:'Inter',Helvetica] text-[11px] font-medium text-[#6f4fd8]">
                                    Cached ${formatPerMTokensPrice(model.inputCacheHitPerMTokens)}/M
                                  </span>
                                  {typeof model.cacheCreatePerMTokens === "number" && (
                                    <span className="rounded-full bg-[#f4efff] px-2.5 py-1 [font-family:'Inter',Helvetica] text-[11px] font-medium text-[#7A42D8]">
                                      Cache create ${formatPerMTokensPrice(model.cacheCreatePerMTokens)}/M
                                    </span>
                                  )}
                                  <span className="rounded-full bg-[#ebebea] px-2.5 py-1 [font-family:'Inter',Helvetica] text-[11px] text-[#6f6e69]">
                                    Input ${formatPerMTokensPrice(model.inputCacheMissPerMTokens)}/M
                                  </span>
                                  <span className="rounded-full bg-[#373734] px-2.5 py-1 [font-family:'Inter',Helvetica] text-[11px] text-white">
                                    Output ${formatPerMTokensPrice(model.outputPerMTokens)}/M
                                  </span>
                                </>
                              ) : (
                                <span className="rounded-full bg-[#ebebea] px-2.5 py-1 [font-family:'Inter',Helvetica] text-[11px] text-[#8c8b86]">
                                  Pricing pending
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#a682fe]" data-testid={`selected-model-${model.id}`}>
                              <Check size={18} strokeWidth={2.6} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              data-testid={`apply-model-${model.id}`}
                              onClick={() => applyModel(model)}
                              className="shrink-0 rounded-full bg-[#a682fe] px-4 py-2 [font-family:'Inter',Helvetica] text-[13px] font-medium text-white opacity-0 transition-all hover:bg-[#9370e8] group-hover:opacity-100"
                            >
                              Apply
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                    {filteredModels.length === 0 && (
                      <div className="col-span-full px-6 py-10 text-center [font-family:'Inter',Helvetica] text-[14px] text-[#8c8b86]">
                        No models found.
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* SETTINGS VIEW */}
          {view === "settings" && (
            <motion.div
              key="settings"
              className="flex flex-1 flex-col overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="mx-auto w-full max-w-[1220px] px-8 py-10 lg:px-12">
                <div className="mb-8">
                  <h1 className="[font-family:'EB_Garamond',Georgia,serif] text-[48px] font-normal leading-tight text-[#373734]">Settings</h1>
                  <p className="mt-1.5 [font-family:'Inter',Helvetica] text-[15px] text-[#8c8b86]">
                    Manage your account, credits, billing, and Sapienda preferences.
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
                  <div className="rounded-2xl border border-[#d7d7d4] bg-white px-6 py-5 shadow-sm">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="[font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">Current balance</p>
                        <p className="mt-3 [font-family:'Inter',Helvetica] text-[42px] font-normal leading-none text-[#a682fe]">
                          ${balanceCredits.toFixed(2)}
                        </p>
                        <p className="mt-3 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                          Estimated {Math.floor(balanceCredits / averageQuestionCost).toLocaleString()} {selectedModel.name} questions remaining.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addCredits(selectedTopUpAmount)}
                        className="rounded-full bg-[#a682fe] px-5 py-2.5 [font-family:'Inter',Helvetica] text-[14px] font-medium text-white hover:bg-[#9370e8]"
                      >
                        Add credits
                      </button>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {topUpAmounts.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setSelectedTopUpAmount(amount)}
                          className={`rounded-xl border px-4 py-3 [font-family:'Inter',Helvetica] text-[14px] transition-colors ${
                            selectedTopUpAmount === amount
                              ? "border-[#a682fe] bg-[#ede9fe] text-[#373734]"
                              : "border-[#e2e2df] text-[#4b4b48] hover:border-[#c4b0fd]"
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedTopUpAmount(100)}
                        className={`rounded-xl border px-4 py-3 [font-family:'Inter',Helvetica] text-[14px] transition-colors ${
                          selectedTopUpAmount === 100
                            ? "border-[#a682fe] bg-[#ede9fe] text-[#373734]"
                            : "border-[#e2e2df] text-[#4b4b48] hover:border-[#c4b0fd]"
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d7d7d4] bg-white px-5 py-5 shadow-sm">
                    <p className="[font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">This month</p>
                    <p className="mt-3 [font-family:'Inter',Helvetica] text-[28px] font-semibold text-[#373734]">{formatCredits(totalCreditsUsed)} spent</p>
                    <p className="mt-2 [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#8c8b86]">
                      {totalTokens ? `${formatTokenCount(totalTokens)} tokens used across completed chats.` : "Detailed model-level consumption lives in Usage."}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setView("usage"); setActiveNav("Usage"); }}
                      className="mt-5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 [font-family:'Inter',Helvetica] text-[13px] font-medium text-[#373734] hover:bg-[#f5f5f3]"
                    >
                      View usage <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="flex flex-col gap-1 rounded-2xl border border-[#d7d7d4] bg-white p-2 shadow-sm">
                    {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
                      const isActive = settingsSection === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSettingsSection(id)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isActive ? "bg-[#ebebea] text-[#373734]" : "text-[#8c8b86] hover:bg-[#f5f5f3] hover:text-[#373734]"
                          }`}
                        >
                          <Icon size={15} strokeWidth={1.8} />
                          <span className="[font-family:'Inter',Helvetica] text-[13px] font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl border border-[#d7d7d4] bg-white px-6 py-5 shadow-sm">
                    {settingsSection === "account" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Account</h2>
                        <div className="mt-5 flex items-center gap-4 border-b border-[#ecebe8] pb-5">
                          <Avatar className="h-12 w-12 shrink-0 bg-[#373734]">
                            <AvatarFallback className="bg-[#373734] text-[13px] font-bold text-white">{userInitials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="[font-family:'Inter',Helvetica] text-[15px] font-medium text-[#373734]">{userDisplayName}</p>
                            <p className="[font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">{userEmail} · Account ID {currentUserId}</p>
                          </div>
                        </div>
                        {renderSettingsRow("Plan", "Paid balance account with prepaid credits.", <span className="[font-family:'Inter',Helvetica] text-[13px] font-medium text-[#373734]">{userPlan}</span>)}
                        {renderSettingsRow("Sign out", "End this session.", <button type="button" onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[#8c8b86] hover:bg-[#f5f5f3] hover:text-[#373734]"><LogOut size={14} /> Sign out</button>)}
                        {renderSettingsRow("Delete account", "Permanently remove account data after confirmation.", <button type="button" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[#a14b4b] hover:bg-[#fff7f7]"><Trash2 size={14} /> Delete</button>)}
                      </div>
                    )}

                    {settingsSection === "credits" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Credits & Billing</h2>
                        {renderSettingsRow("Auto recharge", `Recharge $${selectedTopUpAmount} when balance drops below your threshold.`, renderSwitch(autoRechargeEnabled, setAutoRechargeEnabled))}
                        <div className="border-b border-[#ecebe8] py-4">
                          <p className="[font-family:'Inter',Helvetica] text-[14px] font-medium text-[#373734]">Low balance threshold</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[5, 10, 20].map((amount) => (
                              <button
                                key={amount}
                                type="button"
                                onClick={() => setLowBalanceThreshold(amount)}
                                className={`rounded-full border px-4 py-2 [font-family:'Inter',Helvetica] text-[13px] ${lowBalanceThreshold === amount ? "border-[#a682fe] bg-[#ede9fe] text-[#373734]" : "border-[#e2e2df] text-[#8c8b86] hover:text-[#373734]"}`}
                              >
                                ${amount}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="py-4">
                          <div className="mb-3 flex items-center gap-2">
                            <Receipt size={15} className="text-[#8c8b86]" />
                            <p className="[font-family:'Inter',Helvetica] text-[14px] font-medium text-[#373734]">Recent top-ups</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {topUpRecords.length ? topUpRecords.map((item) => (
                              <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#f5f5f3] px-4 py-3">
                                <div>
                                  <p className="[font-family:'Inter',Helvetica] text-[13px] font-medium text-[#373734]">{formatCredits(item.amount)}</p>
                                  <p className="[font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86]">{formatTopUpDate(item.createdAt)} · {item.invoice}</p>
                                </div>
                                <span className="[font-family:'Inter',Helvetica] text-[12px] text-[#6f806c]">{item.status}</span>
                              </div>
                            )) : (
                              <div className="rounded-xl bg-[#f5f5f3] px-4 py-4 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                                Top-ups will appear after credits are added.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === "models" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Model Preferences</h2>
                        {renderSettingsRow("Default model", "Used for new chats and the composer menu.", <button type="button" onClick={() => { setView("models"); setActiveNav("Model"); }} className="rounded-lg px-3 py-2 [font-family:'Inter',Helvetica] text-[13px] text-[#373734] hover:bg-[#f5f5f3]">{selectedModel.name}</button>)}
                        {renderSettingsRow("Prefer lower cost models", "Suggest cheaper models when a request does not require premium reasoning.", renderSwitch(preferLowCostModel, setPreferLowCostModel))}
                        {renderSettingsRow("Warn before expensive model use", "Show a reminder before high-credit requests.", renderSwitch(warnBeforeExpensiveModel, setWarnBeforeExpensiveModel))}
                        <div className="pt-4">
                          <p className="[font-family:'Inter',Helvetica] text-[14px] font-medium text-[#373734]">Recent models</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {modelMenuModels.map((model) => (
                              <span key={model.id} className="rounded-full bg-[#f5f5f3] px-3 py-1.5 [font-family:'Inter',Helvetica] text-[12px] text-[#4b4b48]">{model.name}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === "chat" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Chat Preferences</h2>
                        {renderSettingsRow("Web search by default", "Enable web search from the composer menu for new chats.", renderSwitch(webSearchEnabled, setWebSearchEnabled))}
                        {renderSettingsRow("Auto-generate artifacts", "Allow charts, tables, and files when the response benefits from them.", renderSwitch(autoArtifactsEnabled, setAutoArtifactsEnabled))}
                        {renderSettingsRow("Show credit estimate", "Display lightweight spend estimates before sending.", renderSwitch(showCreditEstimate, setShowCreditEstimate))}
                        <div className="py-4">
                          <div className="flex items-center gap-2">
                            <Languages size={15} className="text-[#8c8b86]" />
                            <p className="[font-family:'Inter',Helvetica] text-[14px] font-medium text-[#373734]">Reply language</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {["Auto", "English", "中文"].map((language) => (
                              <button key={language} type="button" onClick={() => setReplyLanguage(language)} className={`rounded-full border px-4 py-2 [font-family:'Inter',Helvetica] text-[13px] ${replyLanguage === language ? "border-[#a682fe] bg-[#ede9fe] text-[#373734]" : "border-[#e2e2df] text-[#8c8b86] hover:text-[#373734]"}`}>{language}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === "memory" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Memory</h2>
                        {renderSettingsRow("Use saved memories", "Let Sapienda include confirmed memories in future chats.", renderSwitch(memoryEnabled, setMemoryEnabled))}
                        <div className="pt-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="[font-family:'Inter',Helvetica] text-[14px] font-medium text-[#373734]">Saved and suggested memories</p>
                              <p className="mt-1 [font-family:'Inter',Helvetica] text-[12px] text-[#8c8b86]">Only active memories are included in model context.</p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button type="button" onClick={() => void fetchMemories()} className="rounded-lg px-3 py-2 [font-family:'Inter',Helvetica] text-[12px] text-[#373734] hover:bg-[#f5f5f3]">
                                Refresh
                              </button>
                              {memories.length > 0 && (
                                <button type="button" onClick={() => void clearAllMemories()} className="rounded-lg px-3 py-2 [font-family:'Inter',Helvetica] text-[12px] text-[#a14b4b] hover:bg-[#fff7f7]">
                                  Clear all
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {memories.length ? memories.map((memory) => (
                              <div key={memory.id} className="rounded-2xl border border-[#ecebe8] bg-[#fafaf8] px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className={`inline-flex rounded-full px-2 py-1 [font-family:'Inter',Helvetica] text-[11px] font-medium ${memory.status === "active" ? "bg-[#f0ecff] text-[#6f50d8]" : "bg-[#f0f0ee] text-[#8c8b86]"}`}>
                                        {memory.status === "active" ? "Active" : "Suggested"}
                                      </span>
                                      <span className="inline-flex rounded-full bg-white px-2 py-1 [font-family:'Inter',Helvetica] text-[11px] text-[#6f6e69]">
                                        {memory.layer === "long_term" ? "Long-term" : "Short-term"}
                                      </span>
                                      <span className="inline-flex rounded-full bg-white px-2 py-1 [font-family:'Inter',Helvetica] text-[11px] text-[#6f6e69]">
                                        {memory.category.replace("_", " ")}
                                      </span>
                                    </div>
                                    <p className="mt-2 [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#373734]">{memory.content}</p>
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    {memory.status !== "active" && (
                                      <button type="button" onClick={() => updateMemory(memory.id, "activate")} className="rounded-lg p-2 text-[#6f50d8] hover:bg-[#f0ecff]" title="Save memory">
                                        <Check size={14} />
                                      </button>
                                    )}
                                    {memory.status === "active" && (
                                      <button type="button" onClick={() => updateMemory(memory.id, "deactivate")} className="rounded-lg p-2 text-[#8c8b86] hover:bg-[#f0f0ee]" title="Deactivate memory">
                                        <X size={14} />
                                      </button>
                                    )}
                                    <button type="button" onClick={() => updateMemory(memory.id, "delete")} className="rounded-lg p-2 text-[#a14b4b] hover:bg-[#fff7f7]" title="Delete memory">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="rounded-xl bg-[#f5f5f3] px-4 py-4 [font-family:'Inter',Helvetica] text-[13px] text-[#8c8b86]">
                                Memories you save from conversations will appear here.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === "notifications" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Notifications</h2>
                        {renderSettingsRow("Low balance alerts", `Notify when balance is below $${lowBalanceThreshold}.`, renderSwitch(notifyLowBalance, setNotifyLowBalance))}
                        {renderSettingsRow("Top-up success", "Notify when credits are added to your account.", renderSwitch(notifyTopUpSuccess, setNotifyTopUpSuccess))}
                        {renderSettingsRow("High-spend requests", "Warn when a request may consume more than usual.", renderSwitch(notifyHighSpend, setNotifyHighSpend))}
                        {renderSettingsRow("Monthly summary", "Send a monthly usage and spend summary.", renderSwitch(notifyMonthlySummary, setNotifyMonthlySummary))}
                      </div>
                    )}

                    {settingsSection === "security" && (
                      <div>
                        <h2 className="[font-family:'Inter',Helvetica] text-[20px] font-medium text-[#373734]">Security & Privacy</h2>
                        {renderSettingsRow("Password", "Change your password and protect account access.", <button type="button" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[#373734] hover:bg-[#f5f5f3]"><Lock size={14} /> Change</button>)}
                        {renderSettingsRow("Chat history", "Save conversations for search and recents.", renderSwitch(chatHistoryEnabled, setChatHistoryEnabled))}
                        {renderSettingsRow("Export data", "Download account data and chat metadata.", <button type="button" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[#373734] hover:bg-[#f5f5f3]"><Download size={14} /> Export</button>)}
                        <div className="mt-5 rounded-2xl bg-[#fffaf0] px-4 py-3">
                          <div className="flex gap-3">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#b18257]" />
                            <p className="[font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#6f5a42]">
                              Provider API keys are managed on the server through environment variables and are never shown in the browser.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SKILLS VIEW */}
          {view === "skills" && (
            <motion.div
              key="skills"
              className="flex flex-1 flex-col overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="mx-auto w-full max-w-[1220px] px-6 py-10 lg:px-12">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h1 className="[font-family:'EB_Garamond',Georgia,serif] text-[48px] font-normal text-[#373734] leading-tight">Skills</h1>
                    <p className="[font-family:'Inter',Helvetica] text-[15px] text-[#9c9b97] mt-1.5">Chat with your favorite skills in Sapienda</p>
                  </div>
                  <div className="flex w-full items-center gap-2.5 rounded-full border border-[#e2e2df] bg-white px-5 py-3 shadow-sm md:w-auto">
                    <Search size={15} strokeWidth={1.8} className="text-[#9c9b97]" />
                    <input
                      type="text"
                      placeholder="Search skills"
                      value={skillsSearch}
                      onChange={(e) => setSkillsSearch(e.target.value)}
                      data-testid="input-search-skills"
                      className="w-full bg-transparent [font-family:'Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none md:w-[200px]"
                    />
                  </div>
                </div>

                {/* Hero carousel */}
                <motion.div
                  className="relative mb-8 w-full max-w-none overflow-hidden rounded-2xl border border-white/50 p-5 shadow-[0_14px_36px_rgba(55,55,52,0.10)] lg:min-h-[440px]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\"), linear-gradient(135deg, #7A42D8 0%, #C9B4F2 48%, #FFF2BC 100%)",
                    backgroundBlendMode: "soft-light, normal",
                  }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  onMouseDown={(event) => { skillHeroDragStartRef.current = event.clientX; }}
                  onMouseUp={(event) => finishSkillHeroDrag(event.clientX)}
                  onMouseLeave={(event) => finishSkillHeroDrag(event.clientX)}
                  onTouchStart={(event) => { skillHeroDragStartRef.current = event.touches[0]?.clientX ?? null; }}
                  onTouchEnd={(event) => finishSkillHeroDrag(event.changedTouches[0]?.clientX ?? 0)}
                >
                  <div className="pointer-events-none absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                  <div className="relative z-10 flex min-h-0 flex-col gap-5 lg:min-h-[360px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSkillHeroSlide.title}
                        className="grid min-w-0 flex-1 gap-5 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
                        initial={{ opacity: 0, x: 34 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -34 }}
                        transition={{ duration: 0.34, ease: "easeOut" }}
                      >
                        <div className="flex min-w-0 max-w-[420px] flex-col justify-between">
                          <button
                            type="button"
                            className="mb-3 rounded-full border border-white/40 bg-white/30 px-3 py-1 [font-family:'Inter',Helvetica] text-[11px] font-semibold text-[#373734] shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#c4b0fd] hover:bg-white/40"
                          >
                            {activeSkillHeroSlide.tag}
                          </button>
                          <p className="[font-family:'Inter',Helvetica] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#373734]/70">{activeSkillHeroSlide.eyebrow}</p>
                          <h2 className="mt-2 [font-family:'EB_Garamond',Georgia,serif] text-[30px] font-semibold leading-[1.04] text-[#262622]">
                            {activeSkillHeroSlide.title}
                          </h2>
                          <p className="mt-3 max-w-[340px] [font-family:'Inter',Helvetica] text-[13px] leading-relaxed text-[#373734]/75">
                            {activeSkillHeroSlide.description}
                          </p>
                          <button
                            type="button"
                            className="mt-4 rounded-full bg-[#191918] px-5 py-2.5 [font-family:'Inter',Helvetica] text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#191918] hover:to-[#5f2fc2] hover:shadow-[0_10px_20px_rgba(95,47,194,0.20)]"
                          >
                            {activeSkillHeroSlide.action}
                          </button>
                        </div>

                        <div className="min-w-0 rounded-2xl border border-white/35 bg-white/24 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md">
                          <div className="flex items-center gap-2.5 rounded-xl bg-white/72 px-3 py-2.5 shadow-sm">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#373734]">
                              <ActiveSkillHeroIcon size={13} strokeWidth={1.8} className="text-white" />
                            </div>
                            <span className="min-w-0 flex-1 truncate [font-family:'Inter',Helvetica] text-[12px] font-medium text-[#373734]">{activeSkillHeroSlide.prompt}</span>
                            <ArrowUp size={13} strokeWidth={2.2} className="text-[#a682fe]" />
                          </div>
                          <div className="mt-3 rounded-2xl border border-white/40 bg-white/42 p-3 shadow-sm backdrop-blur-sm">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="[font-family:'Inter',Helvetica] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f6e69]">Skill workflow</p>
                              <span className="rounded-full bg-[#ede9fe] px-2 py-0.5 [font-family:'Inter',Helvetica] text-[10px] font-semibold text-[#7A42D8]">3 steps</span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {activeSkillHeroSlide.steps.map((step, index) => (
                                <div key={step} className="flex items-start gap-2.5">
                                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#7A42D8] shadow-sm">
                                    <span className="[font-family:'Inter',Helvetica] text-[10px] font-semibold">{index + 1}</span>
                                    {index < activeSkillHeroSlide.steps.length - 1 && <span className="absolute left-1/2 top-6 h-4 w-px -translate-x-1/2 bg-white/70" />}
                                  </div>
                                  <div className="min-w-0 flex-1 rounded-xl border border-white/40 bg-white/45 px-3 py-2">
                                    <p className="[font-family:'Inter',Helvetica] text-[12px] font-semibold text-[#373734]">{step}</p>
                                    <p className="mt-0.5 line-clamp-1 [font-family:'Inter',Helvetica] text-[10px] leading-relaxed text-[#6f6e69]">
                                      Guided by Sapienda with reusable prompts and structured outputs.
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 rounded-xl border border-white/40 bg-white/50 px-3 py-2.5 backdrop-blur-sm">
                            <div className="mb-1.5 flex items-center gap-2 text-[#7A42D8]">
                              <Check size={12} strokeWidth={2.2} />
                              <span className="[font-family:'Inter',Helvetica] text-[11px] font-semibold">Result preview</span>
                            </div>
                            <p className="line-clamp-2 [font-family:'Inter',Helvetica] text-[11px] leading-relaxed text-[#4b4b48]">
                              {activeSkillHeroSlide.resultText}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="relative z-10 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {SKILL_HERO_SLIDES.map((slide, index) => (
                        <button
                          key={slide.title}
                          type="button"
                          aria-label={`Show ${slide.title}`}
                          onClick={() => setActiveSkillHeroIndex(index)}
                          className={`h-2 rounded-full transition-all ${activeSkillHeroIndex === index ? "w-6 bg-[#7A42D8]" : "w-2 bg-white/70 hover:bg-white"}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changeSkillHeroSlide(-1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/55 text-[#373734] shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white">
                        <ChevronDown size={15} className="rotate-90" />
                      </button>
                      <button type="button" onClick={() => changeSkillHeroSlide(1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/55 text-[#373734] shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white">
                        <ChevronDown size={15} className="-rotate-90" />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Category tabs */}
                <div className="flex items-center gap-8 mb-6">
                  {SKILL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      data-testid={`skills-tab-${cat.toLowerCase().replace(/\s/g, "-")}`}
                      onClick={() => setSkillsTab(cat)}
                      className={`relative [font-family:'Inter',Helvetica] text-[15px] transition-colors pb-1.5 ${
                        skillsTab === cat
                          ? "font-medium text-[#373734]"
                          : "font-normal text-[#9c9b97] hover:text-[#4b4b48]"
                      }`}
                    >
                      {cat}
                      {skillsTab === cat && (
                        <motion.span
                          layoutId="tab-underline"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#373734] rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                  <button type="button" className="[font-family:'Inter',Helvetica] text-[15px] font-normal text-[#373734] hover:text-[#a682fe] transition-colors ml-auto">
                    View more →
                  </button>
                </div>

                {/* Skills grid */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={skillsTab + skillsSearch}
                    className="grid grid-cols-2 gap-x-10 gap-y-0"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.045 } },
                    }}
                  >
                    {SKILLS_DATA[skillsTab]
                      .filter((s) => !skillsSearch || s.name.toLowerCase().includes(skillsSearch.toLowerCase()) || s.desc.toLowerCase().includes(skillsSearch.toLowerCase()))
                      .map((skill) => (
                        <motion.button
                          key={skill.name}
                          type="button"
                          data-testid={`skill-card-${skill.name.toLowerCase().replace(/\s/g, "-")}`}
                          className="flex items-center gap-5 px-0 py-5 text-left hover:bg-[#f5f5f3] hover:px-4 transition-all group rounded-xl"
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
                          }}
                        >
                          <div className="h-12 w-12 shrink-0 rounded-full bg-[#ebebea] flex items-center justify-center group-hover:bg-[#ede9fe] transition-colors">
                            <Zap size={18} strokeWidth={1.6} className="text-[#9c9b97] group-hover:text-[#a682fe] transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="[font-family:'Inter',Helvetica] text-[15px] font-medium text-[#373734] truncate">{skill.name}</p>
                            <p className="[font-family:'Inter',Helvetica] text-[13px] text-[#9c9b97] truncate mt-0.5">{skill.desc}</p>
                          </div>
                          <ChevronRight size={16} strokeWidth={1.8} className="shrink-0 text-[#c0bfba] group-hover:text-[#a682fe] transition-colors" />
                        </motion.button>
                      ))}
                  </motion.div>
                </AnimatePresence>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </section>
      {selectionToolbar && (
        <div
          ref={selectionToolbarRef}
          style={{ left: selectionToolbar.x, top: selectionToolbar.y }}
          className="fixed z-[90] flex items-center gap-1 rounded-xl border border-[#2f2f2c] bg-[#373734] p-1 shadow-xl"
        >
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(selectionToolbar.text);
              setSelectionToolbar(null);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 [font-family:'Inter',Helvetica] text-[12px] text-white hover:bg-white/10"
          >
            <Copy size={13} /> Copy
          </button>
          <button
            type="button"
            onClick={() => quoteTextIntoInput(selectionToolbar.text)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 [font-family:'Inter',Helvetica] text-[12px] text-white hover:bg-white/10"
          >
            <Quote size={13} /> Follow up
          </button>
        </div>
      )}
      {openRecentSession && recentMenuPosition && (
        <div
          ref={recentMenuRef}
          style={{ left: recentMenuPosition.x, top: recentMenuPosition.y }}
          onMouseDown={(event) => event.stopPropagation()}
          className="fixed z-[90] w-[150px] rounded-xl border border-[#e2e2df] bg-white p-1.5 shadow-lg"
        >
          <button type="button" onClick={() => startRenameSession(openRecentSession)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left [font-family:'Inter',Helvetica] text-[12px] text-[#373734] hover:bg-[#f5f5f3]">
            <FileText size={13} /> Rename
          </button>
          <button type="button" onClick={() => togglePinSession(openRecentSession.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left [font-family:'Inter',Helvetica] text-[12px] text-[#373734] hover:bg-[#f5f5f3]">
            <Star size={13} /> {openRecentSession.pinned ? "Unpin chat" : "Pin chat"}
          </button>
          <button type="button" onClick={() => deleteSession(openRecentSession.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left [font-family:'Inter',Helvetica] text-[12px] text-[#a14b4b] hover:bg-[#fff7f7]">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
      {/* ── Search / Recent Chats Modal ── */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            key="search-overlay"
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/20" />

            {/* card */}
            <motion.div
              ref={searchModalRef}
              className="relative z-10 w-[520px] max-h-[520px] flex flex-col rounded-2xl border border-[#e2e2df] bg-[#f5f5f3] shadow-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {/* search row */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e2e2df]">
                <Search size={15} strokeWidth={1.8} className="shrink-0 text-[#9c9b97]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-chats"
                  className="flex-1 bg-transparent [font-family:'Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none"
                />
                <button
                  type="button"
                  data-testid="button-close-search"
                  onClick={() => { setShowSearchModal(false); setSearchQuery(""); }}
                  className="shrink-0 rounded-md p-1 text-[#9c9b97] hover:bg-[#ebebea] hover:text-[#373734] transition-colors"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>

              {/* body */}
              <div className="overflow-y-auto flex-1 p-1.5 flex flex-col gap-0.5">
                {/* New chat */}
                <button
                  type="button"
                  data-testid="search-modal-new-chat"
                  onClick={() => { startNewChat(); setShowSearchModal(false); setSearchQuery(""); }}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ebebea] transition-colors"
                >
                  <Plus size={15} strokeWidth={2} className="shrink-0 text-[#4b4b48]" />
                  <span className="[font-family:'Inter',Helvetica] text-[14px] text-[#373734]">New chat</span>
                </button>

                {/* Recent sessions */}
                {sessions.length > 0 && (
                  <>
                    <p className="px-4 pt-2 pb-1 [font-family:'Inter',Helvetica] text-[11px] font-semibold uppercase tracking-wide text-[#9c9b97]">
                      Previous 30 Days
                    </p>
                    {sessions
                      .filter((s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          data-testid={`search-modal-session-${session.id}`}
                          onClick={() => { setActiveChatId(session.id); setView("chat"); setShowSearchModal(false); setSearchQuery(""); void loadConversationMessages(session.id); }}
                          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ebebea] transition-colors"
                        >
                          <MessageCircle size={15} strokeWidth={1.6} className="shrink-0 text-[#9c9b97]" />
                          <span className="[font-family:'Inter',Helvetica] text-[14px] text-[#373734] truncate">{session.title}</span>
                        </button>
                      ))}
                    {searchQuery && sessions.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <p className="px-4 py-4 [font-family:'Inter',Helvetica] text-[13px] text-[#b5b4ae]">No chats found.</p>
                    )}
                  </>
                )}

                {sessions.length === 0 && (
                  <p className="px-4 py-4 [font-family:'Inter',Helvetica] text-[13px] text-[#b5b4ae]">No recent chats yet.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
