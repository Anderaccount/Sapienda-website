import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadSkillModal from "@/components/UploadSkillModal";
import {
  Plus,
  Search,
  Star,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Check,
  Zap,
  X,
  MessageCircle,
  Download,
  BarChart3,
  Image as ImageIcon,
  FileText,
  Globe,
  Upload,
  TrendingUp,
  Clock,
  Code,
  Palette,
  Briefcase,
  Sparkles,
  ArrowLeft,
  User,
  ThumbsUp,
  ThumbsDown,
  Send,
  Loader2,
  Square,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */

const CATEGORIES = [
  { id: "Foundation", icon: Sparkles, color: "#7A42D8" },
  { id: "Design", icon: Palette, color: "#E87B35" },
  { id: "Work & study", icon: Briefcase, color: "#3B82F6" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

interface Skill {
  id: string;
  name: string;
  desc: string;
  category: CategoryId;
  author: string;
  authorAvatar?: string;
  rating: number;
  reviews: number;
  downloads: number;
  icon: typeof Sparkles;
  iconColor: string;
  systemPrompt: string;
  examples: string[];
  tags: string[];
  badge?: string;
}

const SKILLS: Skill[] = [
  /* Foundation */
  {
    id: "deep-researcher",
    name: "Deep Researcher",
    desc: "Research any topic with AI-powered depth, automatic source verification, and structured citation outputs.",
    category: "Foundation",
    author: "Sapienda",
    rating: 4.9,
    reviews: 124,
    downloads: 2340,
    icon: Sparkles,
    iconColor: "#7A42D8",
    systemPrompt: "You are Deep Researcher, an expert research assistant. When a user asks a question: 1) Break it into sub-questions, 2) Search for relevant information, 3) Synthesize findings with citations, 4) Highlight gaps and uncertainties. Always structure responses with Summary, Key Findings, Analysis, and Sources sections.",
    examples: ["Research the impact of AI on education", "Compare renewable energy sources", "Summarize recent advances in quantum computing"],
    tags: ["research", "analysis", "citations"],
    badge: "⭐ Featured",
  },
  {
    id: "text-summarizer",
    name: "Text Summarizer",
    desc: "Condense long documents, articles, and reports into concise key points with adjustable detail levels.",
    category: "Foundation",
    author: "Sapienda",
    rating: 4.7,
    reviews: 89,
    downloads: 1820,
    icon: FileText,
    iconColor: "#3B82F6",
    systemPrompt: "You are Text Summarizer. Given any text: 1) Identify the main topic and key arguments, 2) Extract essential facts and conclusions, 3) Present summaries at three levels (1-sentence, paragraph, and detailed). Always preserve the original meaning and tone.",
    examples: ["Summarize this research paper", "Give me the key points from this news article", "Condense this meeting transcript"],
    tags: ["summarization", "reading", "productivity"],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    desc: "Interpret datasets, generate insights, and create visualizations from raw data with statistical context.",
    category: "Foundation",
    author: "Sapienda",
    rating: 4.6,
    reviews: 67,
    downloads: 1430,
    icon: BarChart3,
    iconColor: "#10B981",
    systemPrompt: "You are Data Analyst. When given data: 1) Profile the data (shape, types, distributions), 2) Identify trends, outliers, and correlations, 3) Present findings with clear statistical context, 4) Suggest actionable next steps. Generate chart-ready data structures when helpful.",
    examples: ["Analyze this sales dataset", "Find trends in my monthly expenses", "Compare A/B test results"],
    tags: ["analytics", "data", "visualization"],
  },
  {
    id: "language-tutor",
    name: "Language Tutor",
    desc: "Practice conversations in any language with real-time corrections, grammar explanations, and cultural notes.",
    category: "Foundation",
    author: "Sapienda",
    rating: 4.8,
    reviews: 156,
    downloads: 3100,
    icon: Globe,
    iconColor: "#F59E0B",
    systemPrompt: "You are Language Tutor, a patient and encouraging language teacher. Adapt to the user's level. Correct mistakes gently with clear explanations. Provide cultural context when relevant. Practice through natural conversation, role-play scenarios, and targeted exercises.",
    examples: ["Help me practice Spanish conversation", "Explain French subjunctive mood", "Correct my English pronunciation patterns"],
    tags: ["language", "learning", "conversation"],
  },
  {
    id: "writing-coach",
    name: "Writing Coach",
    desc: "Polish prose, improve clarity and style, and get detailed feedback on structure, tone, and flow.",
    category: "Foundation",
    author: "Sapienda",
    rating: 4.5,
    reviews: 98,
    downloads: 1670,
    icon: FileText,
    iconColor: "#8B5CF6",
    systemPrompt: "You are Writing Coach. Review text for: 1) Clarity and concision, 2) Structure and flow, 3) Tone and voice, 4) Grammar and style. Provide specific, actionable suggestions. Preserve the writer's voice while improving impact.",
    examples: ["Polish this email draft", "Improve my essay introduction", "Make this technical doc more accessible"],
    tags: ["writing", "editing", "communication"],
  },
  {
    id: "brainstorm-pro",
    name: "Brainstorm Pro",
    desc: "Generate creative ideas, expand thinking with lateral techniques, and organize concepts into action plans.",
    category: "Foundation",
    author: "Sapienda",
    rating: 4.4,
    reviews: 55,
    downloads: 980,
    icon: TrendingUp,
    iconColor: "#EC4899",
    systemPrompt: "You are Brainstorm Pro. Use techniques like SCAMPER, mind mapping, first principles, and lateral thinking. Generate diverse ideas without judgment first, then organize and evaluate. Push beyond the obvious to find novel connections and solutions.",
    examples: ["Brainstorm product feature ideas", "Generate marketing campaign concepts", "Think of ways to improve team productivity"],
    tags: ["creativity", "ideation", "planning"],
  },
  /* Design */
  {
    id: "ui-critiquer",
    name: "UI Critiquer",
    desc: "Get expert UX feedback on interface designs with actionable improvement suggestions based on design principles.",
    category: "Design",
    author: "Sapienda",
    rating: 4.7,
    reviews: 83,
    downloads: 1720,
    icon: Palette,
    iconColor: "#E87B35",
    systemPrompt: "You are UI Critiquer. Evaluate interfaces on: 1) Visual hierarchy and layout, 2) Accessibility (WCAG guidelines), 3) Interaction patterns and consistency, 4) Typography and spacing. Provide specific, actionable feedback with visual rationale.",
    examples: ["Review this landing page design", "Critique my app's navigation flow", "Check accessibility of this dashboard"],
    tags: ["design", "UX", "accessibility"],
  },
  {
    id: "color-palette",
    name: "Color Palette",
    desc: "Create harmonious brand color systems with accessibility ratios, variants, and usage guidelines.",
    category: "Design",
    author: "Sapienda",
    rating: 4.5,
    reviews: 61,
    downloads: 1240,
    icon: Palette,
    iconColor: "#F59E0B",
    systemPrompt: "You are Color Palette expert. Generate color systems with: 1) Primary, secondary, accent, neutral scales, 2) WCAG contrast ratios, 3) Light/dark mode variants, 4) Emotional and brand psychology notes. Output ready-to-use CSS variables.",
    examples: ["Create a palette for a fintech brand", "Generate a warm, earthy color system", "Design dark mode variants for my current palette"],
    tags: ["color", "branding", "design-system"],
  },
  {
    id: "copy-writer",
    name: "Copy Writer",
    desc: "Write compelling marketing copy, headlines, and messaging that converts across channels and formats.",
    category: "Design",
    author: "Sapienda",
    rating: 4.6,
    reviews: 72,
    downloads: 1560,
    icon: FileText,
    iconColor: "#3B82F6",
    systemPrompt: "You are Copy Writer. Craft copy that: 1) Hooks attention immediately, 2) Communicates value clearly, 3) Drives specific actions, 4) Maintains brand voice. Adapt for channels (web, email, social, ads). A/B test variants when requested.",
    examples: ["Write homepage hero copy for a SaaS", "Draft an email launch sequence", "Create social media captions for a campaign"],
    tags: ["copywriting", "marketing", "branding"],
  },
  {
    id: "logo-concept",
    name: "Logo Concept",
    desc: "Describe, iterate on, and generate detailed logo briefs — from concept exploration to final direction.",
    category: "Design",
    author: "Sapienda",
    rating: 4.3,
    reviews: 48,
    downloads: 890,
    icon: ImageIcon,
    iconColor: "#EC4899",
    systemPrompt: "You are Logo Concept designer. Help users: 1) Define brand personality and values, 2) Explore visual metaphors and symbols, 3) Iterate on direction with detailed descriptions, 4) Generate briefs ready for a designer. Include style, geometry, typography, and color direction.",
    examples: ["Create a logo concept for an eco-friendly brand", "Iterate on my startup's logo direction", "Generate a logo brief for a law firm"],
    tags: ["logo", "branding", "design-brief"],
  },
  {
    id: "style-guide-gen",
    name: "Style Guide Gen",
    desc: "Build consistent design token libraries, typography scales, and spacing systems for your projects.",
    category: "Design",
    author: "Sapienda",
    rating: 4.4,
    reviews: 39,
    downloads: 720,
    icon: Code,
    iconColor: "#8B5CF6",
    systemPrompt: "You are Style Guide Generator. Produce: 1) Design tokens (colors, spacing, typography), 2) Component specifications, 3) Usage guidelines and dos/donts, 4) Export-ready formats (CSS variables, Tailwind config, JSON tokens).",
    examples: ["Generate a design token system", "Create typography scale with examples", "Build a component style guide for buttons and forms"],
    tags: ["design-system", "tokens", "documentation"],
  },
  {
    id: "accessibility-check",
    name: "Accessibility Check",
    desc: "Audit designs and code for WCAG compliance, inclusive design patterns, and usability improvements.",
    category: "Design",
    author: "Sapienda",
    rating: 4.8,
    reviews: 91,
    downloads: 2040,
    icon: Check,
    iconColor: "#10B981",
    systemPrompt: "You are Accessibility auditor. Check against WCAG 2.2 AA: 1) Color contrast and sensory characteristics, 2) Keyboard navigation and focus order, 3) Screen reader compatibility, 4) Forms and error handling. Prioritize issues by severity and provide code-level fixes.",
    examples: ["Audit my website for accessibility issues", "Check this component for screen reader support", "Review my form for WCAG compliance"],
    tags: ["accessibility", "WCAG", "inclusive-design"],
    "badge": "🔥 Trending",
  },
  /* Work & study */
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    desc: "Transform meeting transcripts and notes into structured summaries with action items and decisions.",
    category: "Work & study",
    author: "Sapienda",
    rating: 4.6,
    reviews: 105,
    downloads: 2800,
    icon: FileText,
    iconColor: "#3B82F6",
    systemPrompt: "You are Meeting Notes expert. From any transcript or notes: 1) Extract key decisions and rationale, 2) List action items with owners (if mentioned), 3) Highlight important discussions, 4) Structure output for easy sharing. Keep it concise but complete.",
    examples: ["Summarize this meeting transcript", "Extract action items from my notes", "Create meeting minutes from this recording"],
    tags: ["meetings", "productivity", "notes"],
  },
  {
    id: "email-composer",
    name: "Email Composer",
    desc: "Draft professional, clear emails in seconds — from quick replies to complex business communications.",
    category: "Work & study",
    author: "Sapienda",
    rating: 4.4,
    reviews: 76,
    downloads: 1950,
    icon: Send,
    iconColor: "#F59E0B",
    systemPrompt: "You are Email Composer. Draft emails that are: 1) Clear and concise, 2) Appropriate tone for context, 3) Well-structured with clear subject lines, 4) Action-oriented when needed. Adjust formality and style based on recipient and purpose.",
    examples: ["Draft a follow-up email after a meeting", "Write a polite decline to a proposal", "Compose a team announcement for a new policy"],
    tags: ["email", "communication", "productivity"],
  },
  {
    id: "study-flashcards",
    name: "Study Flashcards",
    desc: "Turn notes, lectures, and readings into effective spaced-repetition flashcards for faster learning.",
    category: "Work & study",
    author: "Sapienda",
    rating: 4.7,
    reviews: 112,
    downloads: 2600,
    icon: Zap,
    iconColor: "#7A42D8",
    systemPrompt: "You are Study Flashcards creator. From any learning material: 1) Identify key concepts and facts, 2) Create clear question-answer pairs, 3) Organize by difficulty and topic, 4) Apply spaced-repetition principles. Questions should test understanding, not just recall.",
    examples: ["Turn this biology chapter into flashcards", "Create flashcards from my lecture notes", "Make Anki cards for vocabulary practice"],
    tags: ["learning", "study", "flashcards"],
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    desc: "Get detailed, constructive code review feedback covering correctness, style, performance, and security.",
    category: "Work & study",
    author: "Sapienda",
    rating: 4.9,
    reviews: 188,
    downloads: 4200,
    icon: Code,
    iconColor: "#10B981",
    systemPrompt: "You are Code Reviewer. Review code for: 1) Correctness and edge cases, 2) Design patterns and architecture, 3) Performance and scalability, 4) Security vulnerabilities, 5) Style and readability. Provide specific, actionable suggestions with code examples.",
    examples: ["Review this React component", "Find bugs in my API endpoint", "Suggest improvements for this algorithm"],
    tags: ["coding", "review", "engineering"],
    badge: "⭐ Featured",
  },
  {
    id: "presentation-deck",
    name: "Presentation Deck",
    desc: "Build compelling slide outlines, speaker notes, and visual directions from any topic or document.",
    category: "Work & study",
    author: "Sapienda",
    rating: 4.5,
    reviews: 63,
    downloads: 1340,
    icon: BarChart3,
    iconColor: "#8B5CF6",
    systemPrompt: "You are Presentation expert. Build decks with: 1) Narrative arc and flow, 2) Slide-by-slide outlines with key points, 3) Speaker notes for each slide, 4) Visual and data recommendations. Adapt style for audience (executive, technical, general).",
    examples: ["Create a pitch deck outline", "Build slides from my quarterly report", "Design a workshop presentation flow"],
    tags: ["presentations", "storytelling", "communication"],
  },
  {
    id: "task-planner",
    name: "Task Planner",
    desc: "Break ambitious goals into actionable task hierarchies with timelines, dependencies, and milestones.",
    category: "Work & study",
    author: "Sapienda",
    rating: 4.3,
    reviews: 44,
    downloads: 870,
    icon: Clock,
    iconColor: "#E87B35",
    systemPrompt: "You are Task Planner. Help users: 1) Decompose goals into concrete tasks, 2) Identify dependencies and critical paths, 3) Estimate effort and set milestones, 4) Spot risks and mitigation. Output structured task lists ready for any project tool.",
    examples: ["Plan my product launch timeline", "Break down this feature into tasks", "Create a study plan for my exam next month"],
    tags: ["planning", "productivity", "goals"],
    badge: "🆕 New",
  },
];

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function starRating(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25;
  const stars: ("full" | "half" | "empty")[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("full");
    else if (i === full && hasHalf) stars.push("half");
    else stars.push("empty");
  }
  return stars;
}

const FALLBACK_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239c9b97' stroke-width='1.5'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8'/%3E%3C/svg%3E";

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

/** A tiny star row */
function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {starRating(rating).map((s, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.8}
          className={
            s === "full"
              ? "fill-[#F59E0B] text-[#F59E0B]"
              : s === "half"
                ? "fill-[#F59E0B]/50 text-[#F59E0B]"
                : "fill-none text-[#d7d7d4]"
          }
        />
      ))}
    </span>
  );
}

/** Featured / trending badge chip */
function BadgeChip({ children, color }: { children: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: `${color}14`, color, border: `1px solid ${color}30` }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Main export
   ───────────────────────────────────────────── */

interface SkillsPlazaProps {
  onNavigateToChat?: (skill: Skill) => void;
  authUser?: { id: string } | null;
}

export default function SkillsPlaza({ onNavigateToChat, authUser }: SkillsPlazaProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryId>("Foundation");
  const [detailSkill, setDetailSkill] = useState<Skill | null>(null);
  const [detailTab, setDetailTab] = useState<"about" | "try" | "reviews">("about");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPending, setUploadPending] = useState(false);

  /* Playground state */
  const [playgroundInput, setPlaygroundInput] = useState("");
  const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const playgroundAbortRef = useRef<AbortController | null>(null);
  const playgroundScrollRef = useRef<HTMLDivElement>(null);

  /* Star toggle state per skill */
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const toggleStar = useCallback((id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ── Upload ── */
  const handleUploadClick = useCallback(() => {
    if (!authUser?.id) {
      setUploadPending(true);
      // Trigger login — the parent (Box) handles it
      return;
    }
    setUploadOpen(true);
  }, [authUser]);

  /* When authUser becomes available after login, open modal if pending */
  const prevAuthRef = useRef<string | undefined>(authUser?.id);
  if (authUser?.id && !prevAuthRef.current && uploadPending) {
    prevAuthRef.current = authUser.id;
    setUploadPending(false);
    setUploadOpen(true);
  } else {
    prevAuthRef.current = authUser?.id ?? undefined;
  }

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return SKILLS.filter((s) => {
      if (s.category !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [activeTab, search]);

  /* ── Featured cards (top 3 by rating across all categories) ── */
  const featured = useMemo(() => {
    return [...SKILLS]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, []);

  const featuredLabels = ["⭐ Featured", "🔥 Trending", "🆕 New"];

  /* ── Playground logic ── */
  const runPlayground = useCallback(async () => {
    if (!detailSkill || !playgroundInput.trim() || playgroundLoading) return;
    const userMsg = playgroundInput.trim();
    setPlaygroundInput("");
    setPlaygroundMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setPlaygroundLoading(true);

    const abort = new AbortController();
    playgroundAbortRef.current = abort;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: detailSkill.systemPrompt },
            ...playgroundMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
        }),
        signal: abort.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      let full = "";
      const decoder = new TextDecoder();
      setPlaygroundMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setPlaygroundMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setPlaygroundMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
        ]);
      }
    } finally {
      setPlaygroundLoading(false);
      playgroundAbortRef.current = null;
    }
  }, [detailSkill, playgroundInput, playgroundMessages, playgroundLoading]);

  const stopPlayground = useCallback(() => {
    playgroundAbortRef.current?.abort();
    setPlaygroundLoading(false);
  }, []);

  /* Scroll playground to bottom */
  const playgroundEndRef = useRef<HTMLDivElement>(null);
  const scrollPlaygroundToBottom = useCallback(() => {
    playgroundEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── Render ── */
  return (
    <motion.div
      key="skills"
      className="flex flex-1 flex-col overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="mx-auto w-full max-w-[1220px] px-6 py-10 lg:px-12">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[480px]">
            <h1 className="font-['EB_Garamond',Georgia,serif] text-[48px] font-normal leading-tight text-[#373734]">
              Skills
            </h1>
            <p className="mt-2 font-['Inter',Helvetica] text-[15px] leading-relaxed text-[#9c9b97]">
              Discover AI skills built by the community. Browse, try in-browser, download what you love.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-5 font-['Inter',Helvetica] text-[13px] text-[#6f6e69]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={14} strokeWidth={1.8} className="text-[#a682fe]" />
                {SKILLS.length} skills
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User size={14} strokeWidth={1.8} className="text-[#a682fe]" />
                {(() => { const ids = new Set<string>(); SKILLS.forEach((s) => ids.add(s.author)); return ids.size; })()} creators
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} strokeWidth={1.8} className="fill-[#F59E0B] text-[#F59E0B]" />
                {(SKILLS.reduce((a, s) => a + s.rating, 0) / SKILLS.length).toFixed(1)} avg
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-[#e2e2df] bg-white px-5 py-3 shadow-sm">
              <Search size={15} strokeWidth={1.8} className="text-[#9c9b97]" />
              <input
                type="text"
                placeholder="Search skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[220px] bg-transparent font-['Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleUploadClick}
              className="inline-flex items-center gap-2 rounded-full bg-[#191918] px-5 py-3 font-['Inter',Helvetica] text-[14px] font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#191918] hover:to-[#5f2fc2] hover:shadow-[0_10px_20px_rgba(95,47,194,0.15)]"
            >
              <Upload size={15} strokeWidth={1.8} />
              Upload Skill
            </button>
          </div>
        </div>

        {/* ── Upload modal ── */}
        <UploadSkillModal
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onSuccess={(skill) => {
            // Could refresh the skill list from API here
            console.log("Skill published:", skill);
          }}
          categories={CATEGORIES.map((c) => c.id)}
          userId={authUser?.id ?? null}
        />

        {/* ── Featured cards ── */}
        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {featured.map((skill, idx) => {
            const Icon = skill.icon;
            return (
              <motion.button
                key={skill.id}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.1, ease: "easeOut" }}
                onClick={() => setDetailSkill(skill)}
                className="group relative flex flex-col gap-4 rounded-2xl border border-[#eae9e4] bg-white p-5 text-left shadow-[0_4px_20px_rgba(55,55,52,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(55,55,52,0.10)]"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors"
                    style={{ backgroundColor: `${skill.iconColor}12` }}
                  >
                    <Icon size={20} strokeWidth={1.6} style={{ color: skill.iconColor }} />
                  </div>
                  <BadgeChip color={idx === 0 ? "#7A42D8" : idx === 1 ? "#E87B35" : "#3B82F6"}>
                    {featuredLabels[idx]}
                  </BadgeChip>
                </div>
                <div>
                  <p className="font-['Inter',Helvetica] text-[15px] font-semibold text-[#373734]">
                    {skill.name}
                  </p>
                  <p className="mt-1 line-clamp-2 font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#8c8b86]">
                    {skill.desc}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={skill.rating} size={11} />
                    <span className="font-['Inter',Helvetica] text-[12px] font-medium text-[#6f6e69]">
                      {skill.rating}
                    </span>
                    <span className="font-['Inter',Helvetica] text-[11px] text-[#b5b4ae]">
                      ({skill.reviews})
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-['Inter',Helvetica] text-[11px] text-[#b5b4ae]">
                    <Download size={12} strokeWidth={1.6} />
                    {skill.downloads.toLocaleString()}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ── Category tabs ── */}
        <div className="mb-8 flex items-center gap-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`relative pb-1.5 font-['Inter',Helvetica] text-[15px] transition-colors ${
                activeTab === cat.id
                  ? "font-medium text-[#373734]"
                  : "font-normal text-[#9c9b97] hover:text-[#4b4b48]"
              }`}
            >
              {cat.id}
              {activeTab === cat.id && (
                <motion.span
                  layoutId="skills-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#373734]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Card grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + search}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {filtered.map((skill) => {
              const Icon = skill.icon;
              return (
                <motion.button
                  key={skill.id}
                  type="button"
                  onClick={() => setDetailSkill(skill)}
                  className="group flex flex-col gap-3.5 rounded-xl border border-[#eae9e4] bg-white p-4 text-left shadow-[0_2px_12px_rgba(55,55,52,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#d7d4cf] hover:shadow-[0_8px_24px_rgba(55,55,52,0.08)]"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:scale-105"
                      style={{ backgroundColor: `${skill.iconColor}10` }}
                    >
                      <Icon size={18} strokeWidth={1.6} style={{ color: skill.iconColor }} />
                    </div>
                    {skill.badge && (
                      <BadgeChip
                        color={
                          skill.badge.includes("Featured")
                            ? "#7A42D8"
                            : skill.badge.includes("Trending")
                              ? "#E87B35"
                              : "#3B82F6"
                        }
                      >
                        {skill.badge}
                      </BadgeChip>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-['Inter',Helvetica] text-[14px] font-semibold text-[#373734]">
                      {skill.name}
                    </p>
                    <p className="mt-1 line-clamp-2 font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#8c8b86]">
                      {skill.desc}
                    </p>
                  </div>
                  {/* Tag chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-[#f5f5f3] px-2 py-0.5 font-['Inter',Helvetica] text-[10px] text-[#6f6e69]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StarRow rating={skill.rating} size={11} />
                      <span className="font-['Inter',Helvetica] text-[11px] font-medium text-[#6f6e69]">
                        {skill.rating}
                      </span>
                      <span className="font-['Inter',Helvetica] text-[10px] text-[#b5b4ae]">
                        ({skill.reviews})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-['Inter',Helvetica] text-[11px] text-[#b5b4ae]">
                        <Download size={11} strokeWidth={1.6} />
                        {skill.downloads.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(skill.id);
                        }}
                        className="rounded-md p-1 transition-colors hover:bg-[#f5f5f3]"
                      >
                        <Star
                          size={14}
                          strokeWidth={1.8}
                          className={
                            starred.has(skill.id)
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "text-[#c0bfba]"
                          }
                        />
                      </button>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════
         Detail slide-in panel
         ══════════════════════════════════════════ */}
      <AnimatePresence>
        {detailSkill && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[70] bg-[#191918]/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailSkill(null)}
            />

            {/* Panel */}
            <motion.div
              className="fixed bottom-0 right-0 top-0 z-[80] flex w-full max-w-[580px] flex-col border-l border-[#e2e2df] bg-white shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* ── Panel header ── */}
              <div className="flex shrink-0 items-center gap-4 border-b border-[#ecebe8] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setDetailSkill(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e2df] text-[#6f6e69] transition-colors hover:bg-[#f5f5f3]"
                >
                  <ArrowLeft size={16} strokeWidth={1.8} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-['Inter',Helvetica] text-[16px] font-semibold text-[#373734]">
                    {detailSkill.name}
                  </p>
                  <p className="truncate font-['Inter',Helvetica] text-[12px] text-[#9c9b97]">
                    by {detailSkill.author} · {detailSkill.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStar(detailSkill.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      starred.has(detailSkill.id)
                        ? "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
                        : "border-[#e2e2df] text-[#9c9b97] hover:bg-[#f5f5f3]"
                    }`}
                  >
                    <Star
                      size={16}
                      strokeWidth={1.8}
                      className={starred.has(detailSkill.id) ? "fill-[#F59E0B]" : ""}
                    />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e2df] text-[#9c9b97] transition-colors hover:bg-[#f5f5f3]"
                  >
                    <Download size={16} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              {/* ── Detail tabs ── */}
              <div className="flex shrink-0 items-center gap-6 border-b border-[#ecebe8] px-6">
                {(["about", "try", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDetailTab(tab)}
                    className={`relative pb-3 pt-2 font-['Inter',Helvetica] text-[14px] transition-colors ${
                      detailTab === tab
                        ? "font-medium text-[#373734]"
                        : "font-normal text-[#9c9b97] hover:text-[#4b4b48]"
                    }`}
                  >
                    {tab === "about" ? "About" : tab === "try" ? "Try it" : "Reviews"}
                    {detailTab === tab && (
                      <motion.span
                        layoutId="detail-tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#373734]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* ── Panel body ── */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {detailTab === "about" && (
                    <motion.div
                      key="about"
                      className="space-y-6 px-6 py-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Stats strip */}
                      <div className="flex items-center gap-5 rounded-xl border border-[#ecebe8] bg-[#fafaf8] px-5 py-4">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <StarRow rating={detailSkill.rating} size={12} />
                          </div>
                          <p className="mt-1 font-['Inter',Helvetica] text-[11px] text-[#9c9b97]">
                            {detailSkill.rating} ({detailSkill.reviews} reviews)
                          </p>
                        </div>
                        <div className="mx-auto h-8 w-px bg-[#e2e2df]" />
                        <div className="text-center">
                          <p className="font-['Inter',Helvetica] text-[16px] font-semibold text-[#373734]">
                            {detailSkill.downloads.toLocaleString()}
                          </p>
                          <p className="font-['Inter',Helvetica] text-[11px] text-[#9c9b97]">Downloads</p>
                        </div>
                        <div className="mx-auto h-8 w-px bg-[#e2e2df]" />
                        <div className="text-center">
                          <p className="font-['Inter',Helvetica] text-[16px] font-semibold text-[#373734]">
                            {detailSkill.category}
                          </p>
                          <p className="font-['Inter',Helvetica] text-[11px] text-[#9c9b97]">Category</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="font-['Inter',Helvetica] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b5b4ae]">
                          Description
                        </h3>
                        <p className="mt-2 font-['Inter',Helvetica] text-[14px] leading-relaxed text-[#4b4b48]">
                          {detailSkill.desc}
                        </p>
                      </div>

                      {/* Tags */}
                      <div>
                        <h3 className="font-['Inter',Helvetica] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b5b4ae]">
                          Tags
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {detailSkill.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[#eae9e4] bg-[#fafaf8] px-3 py-1 font-['Inter',Helvetica] text-[12px] text-[#6f6e69]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* System prompt preview */}
                      <div>
                        <h3 className="font-['Inter',Helvetica] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b5b4ae]">
                          System Prompt
                        </h3>
                        <div className="mt-2 rounded-xl border border-[#ecebe8] bg-[#fafaf8] p-4">
                          <pre className="whitespace-pre-wrap font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#4b4b48]">
                            {detailSkill.systemPrompt}
                          </pre>
                        </div>
                      </div>

                      {/* Examples */}
                      <div>
                        <h3 className="font-['Inter',Helvetica] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b5b4ae]">
                          Try asking
                        </h3>
                        <div className="mt-2 space-y-2">
                          {detailSkill.examples.map((ex, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setDetailTab("try");
                                setPlaygroundInput(ex);
                              }}
                              className="block w-full rounded-lg border border-[#ecebe8] bg-white px-4 py-3 text-left font-['Inter',Helvetica] text-[13px] text-[#373734] transition-colors hover:border-[#c4b0fd] hover:bg-[#f9f7ff]"
                            >
                              "{ex}"
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Author */}
                      <div>
                        <h3 className="font-['Inter',Helvetica] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#b5b4ae]">
                          Creator
                        </h3>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#ecebe8] bg-[#fafaf8] p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2e2df]">
                            <User size={18} strokeWidth={1.6} className="text-[#6f6e69]" />
                          </div>
                          <div>
                            <p className="font-['Inter',Helvetica] text-[14px] font-medium text-[#373734]">
                              {detailSkill.author}
                            </p>
                            <p className="font-['Inter',Helvetica] text-[12px] text-[#9c9b97]">
                              Official Sapienda skill
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {detailTab === "try" && (
                    <motion.div
                      key="try"
                      className="flex h-full flex-col"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Playground header info */}
                      <div className="shrink-0 border-b border-[#ecebe8] px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${detailSkill.iconColor}14` }}
                          >
                            {(() => {
                              const Icon = detailSkill.icon;
                              return <Icon size={13} strokeWidth={1.6} style={{ color: detailSkill.iconColor }} />;
                            })()}
                          </div>
                          <div>
                            <p className="font-['Inter',Helvetica] text-[13px] font-medium text-[#373734]">
                              {detailSkill.name}
                            </p>
                            <p className="font-['Inter',Helvetica] text-[11px] text-[#9c9b97]">
                              In-browser trial — no download needed
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto px-6 py-4" ref={playgroundScrollRef}>
                        {playgroundMessages.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                            <Sparkles size={28} strokeWidth={1.4} className="text-[#d7d7d4]" />
                            <p className="max-w-[260px] font-['Inter',Helvetica] text-[13px] leading-relaxed text-[#9c9b97]">
                              Try {detailSkill.name} right here. Send a message to see how it works.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {playgroundMessages.map((msg, i) => (
                              <div
                                key={i}
                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                              >
                                {msg.role === "assistant" && (
                                  <div
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${detailSkill.iconColor}14` }}
                                  >
                                    {(() => {
                                      const Icon = detailSkill.icon;
                                      return <Icon size={12} strokeWidth={1.6} style={{ color: detailSkill.iconColor }} />;
                                    })()}
                                  </div>
                                )}
                                <div
                                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                    msg.role === "user"
                                      ? "bg-[#191918] text-white"
                                      : "bg-[#f5f5f3] text-[#373734]"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap font-['Inter',Helvetica] text-[13px] leading-relaxed">
                                    {msg.content}
                                  </p>
                                </div>
                                {msg.role === "user" && (
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e2e2df]">
                                    <User size={12} strokeWidth={1.6} className="text-[#6f6e69]" />
                                  </div>
                                )}
                              </div>
                            ))}
                            <div ref={playgroundEndRef} />
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="shrink-0 border-t border-[#ecebe8] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e2e2df] bg-white px-4 py-3 shadow-sm transition-colors focus-within:border-[#c4b0fd] focus-within:shadow-[0_0_0_3px_rgba(122,66,216,0.08)]">
                            <input
                              type="text"
                              placeholder="Type a message to try this skill…"
                              value={playgroundInput}
                              onChange={(e) => setPlaygroundInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  runPlayground();
                                }
                              }}
                              className="flex-1 bg-transparent font-['Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none"
                            />
                          </div>
                          {playgroundLoading ? (
                            <button
                              type="button"
                              onClick={stopPlayground}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EF4444] text-white transition-colors hover:bg-[#DC2626]"
                            >
                              <Square size={14} strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={runPlayground}
                              disabled={!playgroundInput.trim()}
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#191918] text-white transition-all hover:bg-gradient-to-r hover:from-[#191918] hover:to-[#5f2fc2] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Send size={15} strokeWidth={1.8} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {detailTab === "reviews" && (
                    <motion.div
                      key="reviews"
                      className="px-6 py-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-6">
                        <div className="flex items-center gap-2">
                          <span className="font-['EB_Garamond',Georgia,serif] text-[36px] font-semibold text-[#373734]">
                            {detailSkill.rating}
                          </span>
                          <div>
                            <StarRow rating={detailSkill.rating} size={14} />
                            <p className="font-['Inter',Helvetica] text-[12px] text-[#9c9b97]">
                              {detailSkill.reviews} reviews
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sample review */}
                      <div className="rounded-xl border border-[#ecebe8] bg-[#fafaf8] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2e2df]">
                            <User size={14} strokeWidth={1.6} className="text-[#6f6e69]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-['Inter',Helvetica] text-[13px] font-medium text-[#373734]">
                                Alex Chen
                              </p>
                              <span className="font-['Inter',Helvetica] text-[11px] text-[#b5b4ae]">2 weeks ago</span>
                            </div>
                            <div className="mt-1">
                              <StarRow rating={5} size={10} />
                            </div>
                            <p className="mt-2 font-['Inter',Helvetica] text-[13px] leading-relaxed text-[#4b4b48]">
                              This skill has completely changed how I do research. The structured output with
                              citations and source verification is incredible. I use it daily for my PhD work.
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <button className="inline-flex items-center gap-1 font-['Inter',Helvetica] text-[11px] text-[#9c9b97] hover:text-[#373734]">
                                <ThumbsUp size={12} /> Helpful (32)
                              </button>
                              <button className="inline-flex items-center gap-1 font-['Inter',Helvetica] text-[11px] text-[#9c9b97] hover:text-[#373734]">
                                <ThumbsDown size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Write review CTA */}
                      <div className="mt-6 rounded-xl border border-dashed border-[#d7d4cf] bg-[#fafaf8] px-5 py-4 text-center">
                        <p className="font-['Inter',Helvetica] text-[13px] font-medium text-[#373734]">
                          Have you used this skill?
                        </p>
                        <p className="mt-1 font-['Inter',Helvetica] text-[12px] text-[#9c9b97]">
                          Try it in the playground, then come back to leave a review.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
