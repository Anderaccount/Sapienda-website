import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileJson, Check, AlertCircle } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface UploadSkillModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (skill: { id: string; name: string }) => void;
  categories: string[];
  /** Whether user is logged in — if not, we show login prompt */
  userId?: string | null;
}

const ICON_COLORS = [
  "#7A42D8", // purple
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#E87B35", // orange
  "#EC4899", // pink
];

interface FormData {
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  examples: string[];
  tags: string[];
  iconColor: string;
}

const emptyForm: FormData = {
  name: "",
  description: "",
  category: "",
  systemPrompt: "",
  examples: [""],
  tags: [],
  iconColor: "#7A42D8",
};

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */

export default function UploadSkillModal({
  open,
  onClose,
  onSuccess,
  categories,
  userId,
}: UploadSkillModalProps) {
  const [activeTab, setActiveTab] = useState<"form" | "import">("form");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ── Reset on open ── */
  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setActiveTab("form");
    setTagInput("");
    setSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setImportError(null);
    setFormErrors({});
    setDragOver(false);
  }, []);

  /* ── Field helpers ── */
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /* ── Example rows ── */
  const setExample = (i: number, val: string) => {
    const next = [...form.examples];
    next[i] = val;
    update("examples", next);
  };
  const addExample = () => {
    if (form.examples.length >= 5) return;
    update("examples", [...form.examples, ""]);
  };
  const removeExample = (i: number) => {
    if (form.examples.length <= 1) return;
    update("examples", form.examples.filter((_, idx) => idx !== i));
  };

  /* ── Tags ── */
  const commitTagInput = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) return;
    if (form.tags.includes(trimmed)) {
      setTagInput("");
      return;
    }
    if (form.tags.length >= 8) return;
    update("tags", [...form.tags, trimmed]);
    setTagInput("");
  };
  const removeTag = (t: string) => update("tags", form.tags.filter((x) => x !== t));

  /* ── Validation ── */
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.category) errs.category = "Please select a category";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          systemPrompt: form.systemPrompt.trim(),
          examples: form.examples.filter((e) => e.trim()),
          tags: form.tags,
          iconColor: form.iconColor,
        }),
      });

      if (res.status === 401) {
        setSubmitError("Please log in to publish a skill.");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as any).error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setSubmitSuccess(true);
      onSuccess?.(data.skill);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1200);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── JSON import ── */
  const handleImportFile = (file: File) => {
    setImportError(null);
    if (!file.name.endsWith(".json")) {
      setImportError("Only .json files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const errors: string[] = [];
        if (!parsed.name || typeof parsed.name !== "string") errors.push("Missing 'name'");
        if (!parsed.description || typeof parsed.description !== "string") errors.push("Missing 'description'");
        if (!parsed.category || typeof parsed.category !== "string") errors.push("Missing 'category'");
        if (parsed.examples && !Array.isArray(parsed.examples)) errors.push("'examples' must be an array");
        if (parsed.tags && !Array.isArray(parsed.tags)) errors.push("'tags' must be an array");

        if (errors.length > 0) {
          setImportError(errors.join(". "));
          return;
        }

        setForm({
          name: parsed.name?.trim() || "",
          description: parsed.description?.trim() || "",
          category: parsed.category || "",
          systemPrompt: parsed.systemPrompt?.trim() || "",
          examples: Array.isArray(parsed.examples) && parsed.examples.length ? parsed.examples : [""],
          tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
          iconColor: parsed.iconColor && ICON_COLORS.includes(parsed.iconColor) ? parsed.iconColor : "#7A42D8",
        });
        setActiveTab("form");
        setFormErrors({});
      } catch {
        setImportError("Invalid JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
  };

  /* ── Render ── */
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-[#191918]/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-[#e2e2df] bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#ecebe8] px-6 py-4">
            <h2 className="font-['EB_Garamond',Georgia,serif] text-[26px] font-normal text-[#373734]">
              Upload a Skill
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e2df] text-[#9c9b97] transition-colors hover:bg-[#f5f5f3]"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex shrink-0 items-center gap-6 border-b border-[#ecebe8] px-6">
            {(["form", "import"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setFormErrors({}); setImportError(null); }}
                className={`relative pb-3 pt-2 font-['Inter',Helvetica] text-[14px] transition-colors ${
                  activeTab === tab
                    ? "font-medium text-[#373734]"
                    : "font-normal text-[#9c9b97] hover:text-[#4b4b48]"
                }`}
              >
                {tab === "form" ? "Fill form" : "Import JSON"}
                {activeTab === tab && (
                  <motion.span
                    layoutId="upload-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#373734]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {activeTab === "import" ? (
              /* ── Import tab ── */
              <div className="flex flex-col gap-4">
                <p className="font-['Inter',Helvetica] text-[13px] leading-relaxed text-[#6f6e69]">
                  Upload a <code className="rounded-md bg-[#f5f5f3] px-1.5 py-0.5 text-[12px]">.json</code> file with
                  your skill definition. The form will auto-fill for you to review.
                </p>
                <div
                  ref={dropRef}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
                    dragOver
                      ? "border-[#a682fe] bg-[#f9f7ff]"
                      : "border-[#d7d4cf] bg-[#fafaf8]"
                  }`}
                >
                  <FileJson size={28} strokeWidth={1.6} className={dragOver ? "text-[#a682fe]" : "text-[#c0bfba]"} />
                  <p className="font-['Inter',Helvetica] text-[13px] text-[#6f6e69]">
                    Drop your <code className="rounded bg-[#e2e2df]/60 px-1 text-[12px]">skill.json</code> here
                  </p>
                  <span className="font-['Inter',Helvetica] text-[12px] text-[#b5b4ae]">or</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-[#191918] px-4 py-2 font-['Inter',Helvetica] text-[13px] font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#191918] hover:to-[#5f2fc2]"
                  >
                    Browse files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                {importError && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                    <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#EF4444]" />
                    <p className="font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#991B1B]">{importError}</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Form tab ── */
              <div className="flex flex-col gap-5">
                {/* Auth gate hint */}
                {!userId && (
                  <div className="flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
                    <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#D97706]" />
                    <p className="font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#92400E]">
                      You need to log in before publishing. Click the button below to sign in.
                    </p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deep Researcher"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className={`mt-1.5 w-full rounded-xl border px-4 py-3 font-['Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none transition-colors focus:border-[#a682fe] focus:shadow-[0_0_0_3px_rgba(122,66,216,0.08)] ${
                      formErrors.name ? "border-[#FCA5A5]" : "border-[#e2e2df]"
                    }`}
                  />
                  {formErrors.name && <p className="mt-1 font-['Inter',Helvetica] text-[11px] text-[#EF4444]">{formErrors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    Description <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe what your skill does and when to use it…"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    className={`mt-1.5 w-full resize-none rounded-xl border px-4 py-3 font-['Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none transition-colors focus:border-[#a682fe] focus:shadow-[0_0_0_3px_rgba(122,66,216,0.08)] ${
                      formErrors.description ? "border-[#FCA5A5]" : "border-[#e2e2df]"
                    }`}
                  />
                  {formErrors.description && <p className="mt-1 font-['Inter',Helvetica] text-[11px] text-[#EF4444]">{formErrors.description}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    Category <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => update("category", cat)}
                        className={`rounded-full border px-4 py-2 font-['Inter',Helvetica] text-[13px] transition-all ${
                          form.category === cat
                            ? "border-[#373734] bg-[#373734] text-white"
                            : "border-[#e2e2df] bg-white text-[#6f6e69] hover:border-[#c0bfba]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {formErrors.category && <p className="mt-1 font-['Inter',Helvetica] text-[11px] text-[#EF4444]">{formErrors.category}</p>}
                </div>

                {/* System prompt */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    System Prompt
                  </label>
                  <textarea
                    rows={4}
                    placeholder="You are an expert…"
                    value={form.systemPrompt}
                    onChange={(e) => update("systemPrompt", e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-xl border border-[#e2e2df] px-4 py-3 font-['Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none transition-colors focus:border-[#a682fe] focus:shadow-[0_0_0_3px_rgba(122,66,216,0.08)]"
                  />
                </div>

                {/* Example questions */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    Example Questions
                  </label>
                  <div className="mt-1.5 space-y-2">
                    {form.examples.map((ex, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Example ${i + 1}`}
                          value={ex}
                          onChange={(e) => setExample(i, e.target.value)}
                          className="flex-1 rounded-xl border border-[#e2e2df] px-4 py-2.5 font-['Inter',Helvetica] text-[13px] text-[#373734] placeholder:text-[#b5b4ae] outline-none transition-colors focus:border-[#a682fe]"
                        />
                        {form.examples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExample(i)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#b5b4ae] transition-colors hover:bg-[#f5f5f3] hover:text-[#6f6e69]"
                          >
                            <X size={14} strokeWidth={1.8} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {form.examples.length < 5 && (
                    <button
                      type="button"
                      onClick={addExample}
                      className="mt-2 font-['Inter',Helvetica] text-[12px] font-medium text-[#a682fe] transition-colors hover:text-[#7A42D8]"
                    >
                      + Add example
                    </button>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    Tags
                  </label>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-xl border border-[#e2e2df] bg-white px-3 py-2.5 transition-colors focus-within:border-[#a682fe] focus-within:shadow-[0_0_0_3px_rgba(122,66,216,0.08)]">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-[#ede9fe] px-2.5 py-1 font-['Inter',Helvetica] text-[11px] font-medium text-[#7A42D8]"
                      >
                        {t}
                        <button type="button" onClick={() => removeTag(t)} className="hover:text-[#373734]">
                          <X size={10} strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder={form.tags.length < 8 ? "Add a tag…" : ""}
                      value={tagInput}
                      disabled={form.tags.length >= 8}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); commitTagInput(); }
                        if (e.key === "Backspace" && !tagInput && form.tags.length) removeTag(form.tags[form.tags.length - 1]);
                      }}
                      onBlur={commitTagInput}
                      className="min-w-[80px] flex-1 bg-transparent font-['Inter',Helvetica] text-[13px] text-[#373734] placeholder:text-[#b5b4ae] outline-none"
                    />
                  </div>
                </div>

                {/* Icon color */}
                <div>
                  <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                    Icon Color
                  </label>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {ICON_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update("iconColor", c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          form.iconColor === c ? "border-[#373734] scale-110 shadow-md" : "border-white shadow-sm hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <span className="ml-1 font-['Inter',Helvetica] text-[12px] text-[#9c9b97]">{form.iconColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          {activeTab === "form" && (
            <div className="shrink-0 border-t border-[#ecebe8] px-6 py-4">
              {submitError && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3">
                  <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#EF4444]" />
                  <p className="font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#991B1B]">{submitError}</p>
                </div>
              )}
              {submitSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3">
                  <Check size={16} strokeWidth={2} className="text-[#10B981]" />
                  <span className="font-['Inter',Helvetica] text-[14px] font-medium text-[#065F46]">
                    Skill published!
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#191918] py-3 font-['Inter',Helvetica] text-[14px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#191918] hover:to-[#5f2fc2] hover:shadow-[0_10px_20px_rgba(95,47,194,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Publishing…" : "Publish Skill"}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
