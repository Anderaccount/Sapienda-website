import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Check, AlertCircle, Loader2 } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface UploadSkillModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (skill: { id: string; name: string }) => void;
  categories: string[];
  userId?: string | null;
}

interface FormData {
  repoUrl: string;
  name: string;
  description: string;
  category: string;
}

const emptyForm: FormData = {
  repoUrl: "",
  name: "",
  description: "",
  category: "",
};

/* ─────────────────────────────────────────────
   GitHub URL helpers
   ───────────────────────────────────────────── */

/** Check whether a string looks like a GitHub repository URL. */
function isGitHubUrl(url: string): boolean {
  return /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(url.trim());
}

/**
 * Convert "https://github.com/user/repo"
 *     → "https://raw.githubusercontent.com/user/repo/main/SKILL.md"
 */
function makeRawUrl(repoUrl: string, filePath = "SKILL.md"): string {
  const trimmed = repoUrl.trim().replace(/\/+$/, "");
  const match = trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return "";
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/main/${filePath}`;
}

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
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  /* GitHub SKILL.md auto-fetch */
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ── Field helper ── */
  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  /* ── Auto-fetch SKILL.md on blur ── */
  const handleRepoBlur = useCallback(async () => {
    const url = form.repoUrl.trim();
    if (!url || !isGitHubUrl(url)) return;

    setFetchingMeta(true);
    setFetchError(null);
    try {
      const rawUrl = makeRawUrl(url);
      const res = await fetch(rawUrl);
      if (!res.ok) {
        setFetchError("Could not fetch SKILL.md from this repo. You can still fill in the details manually.");
        setFetchingMeta(false);
        return;
      }
      const md = await res.text();

      /* Parse YAML-style frontmatter-ish key:value pairs */
      const parsed: Record<string, string> = {};
      for (const line of md.split("\n")) {
        const m = line.match(/^([a-zA-Z ]+):\s*(.+)/);
        if (m) parsed[m[1].trim().toLowerCase()] = m[2].trim();
      }

      setForm((prev) => ({
        ...prev,
        name: parsed.name || parsed.title || prev.name,
        description: parsed.description || prev.description,
      }));
    } catch {
      setFetchError("Network error fetching SKILL.md. You can fill in the details manually.");
    } finally {
      setFetchingMeta(false);
    }
  }, [form.repoUrl]);

  /* ── Validation ── */
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};

    if (!form.repoUrl.trim()) {
      errs.repoUrl = "GitHub repository URL is required";
    } else if (!isGitHubUrl(form.repoUrl)) {
      errs.repoUrl = "Please enter a valid GitHub URL (e.g. https://github.com/user/repo)";
    }

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
          repoUrl: form.repoUrl.trim(),
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
        setForm(emptyForm);
        setFetchError(null);
        setSubmitSuccess(false);
        setSubmitError(null);
        onClose();
      }, 1200);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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

          {/* ── Body (fixed min-height to prevent jump) ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-5">

              {/* Auth gate hint */}
              {!userId && (
                <div className="flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
                  <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#D97706]" />
                  <p className="font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#92400E]">
                    You need to log in before publishing.
                  </p>
                </div>
              )}

              {/* How it works */}
              <div className="rounded-xl border border-[#ecebe8] bg-[#fafaf8] px-4 py-3">
                <p className="font-['Inter',Helvetica] text-[12px] leading-relaxed text-[#6f6e69]">
                  Share a GitHub repository containing <code className="rounded bg-[#e2e2df]/60 px-1 text-[11px]">SKILL.md</code>,{" "}
                  <code className="rounded bg-[#e2e2df]/60 px-1 text-[11px]">scripts/</code>,{" "}
                  <code className="rounded bg-[#e2e2df]/60 px-1 text-[11px]">assets/</code> and{" "}
                  <code className="rounded bg-[#e2e2df]/60 px-1 text-[11px]">references/</code> folders.
                  We'll parse the metadata automatically.
                </p>
              </div>

              {/* GitHub repo URL */}
              <div>
                <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                  GitHub Repository URL <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative mt-1.5">
                  <ExternalLink
                    size={14}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9c9b97]"
                  />
                  <input
                    type="url"
                    placeholder="https://github.com/user/my-skill"
                    value={form.repoUrl}
                    onChange={(e) => { update("repoUrl", e.target.value); setFetchError(null); }}
                    onBlur={handleRepoBlur}
                    className={`w-full rounded-xl border py-3 pl-10 pr-4 font-['Inter',Helvetica] text-[14px] text-[#373734] placeholder:text-[#b5b4ae] outline-none transition-colors focus:border-[#a682fe] focus:shadow-[0_0_0_3px_rgba(122,66,216,0.08)] ${
                      formErrors.repoUrl ? "border-[#FCA5A5]" : "border-[#e2e2df]"
                    }`}
                  />
                  {fetchingMeta && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} strokeWidth={2} className="animate-spin text-[#a682fe]" />
                    </span>
                  )}
                </div>
                {formErrors.repoUrl && <p className="mt-1 font-['Inter',Helvetica] text-[11px] text-[#EF4444]">{formErrors.repoUrl}</p>}
                {fetchError && !formErrors.repoUrl && (
                  <p className="mt-1 font-['Inter',Helvetica] text-[11px] text-[#D97706]">{fetchError}</p>
                )}
              </div>

              {/* divider */}
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[#e2e2df]" />
                <span className="font-['Inter',Helvetica] text-[11px] text-[#b5b4ae]">or fill manually</span>
                <span className="h-px flex-1 bg-[#e2e2df]" />
              </div>

              {/* Name */}
              <div>
                <label className="font-['Inter',Helvetica] text-[12px] font-semibold text-[#373734]">
                  Skill Name <span className="text-[#EF4444]">*</span>
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

            </div>
          </div>

          {/* ── Footer ── */}
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
                {submitting ? "Publishing…" : "Submit Skill"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
