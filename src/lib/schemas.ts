import { z } from "zod";

// Schemas for everything Claude returns. Shared by the API routes (to constrain
// Claude's output) and the client (for types). Every finding carries the IDs of
// the documents or episodes it came from, so it can be shown with a source link.

const SourceIds = z
  .array(z.string())
  .describe("IDs of the documents/episodes this statement comes from, e.g. [\"doc_ab12\"]. Never empty.");

const Uncertainty = z.enum(["low", "medium", "high"]);

// ---------- Extraction (one uploaded document) ----------

export const ExtractionSchema = z.object({
  readable: z.boolean().describe("false if the document is not a medical record or is unreadable"),
  document_type: z.enum([
    "doctor_note",
    "lab_result",
    "imaging_report",
    "prescription",
    "referral",
    "discharge_summary",
    "other",
  ]),
  date: z.string().nullable().describe("Visit/report date as YYYY-MM-DD if certain, else as written, else null"),
  doctor_name: z.string().nullable(),
  specialty: z.string().nullable().describe("Doctor's specialty in the family language, e.g. 'Ear, nose & throat'"),
  facility: z.string().nullable(),
  original_language: z.string().describe("Language the document is written in"),
  summary: z.string().describe("2-3 plain sentences in the family language: what this document says"),
  suspected: z
    .array(
      z.object({
        possibility: z.string().describe("Cause the doctor raised or suspected, in the family language"),
        certainty_as_written: z
          .string()
          .describe("How the doctor phrased it, e.g. 'suspected', 'rule out', 'confirmed', 'possible'"),
        original_text: z.string().describe("Exact words from the document, in its original language"),
      }),
    )
    .describe("Possibilities the doctor raised. Only what is written; never add your own."),
  tests_ordered: z.array(
    z.object({ name: z.string(), original_text: z.string() }),
  ),
  results: z.array(
    z.object({
      test: z.string(),
      value: z.string(),
      unit: z.string().nullable(),
      reference_range: z.string().nullable(),
      flag: z.enum(["high", "low", "normal", "abnormal", "unknown"]),
      original_text: z.string(),
    }),
  ),
  medicines: z.array(
    z.object({
      name: z.string(),
      dose: z.string().nullable(),
      frequency: z.string().nullable(),
      change: z.enum(["started", "stopped", "changed", "continued", "unknown"]),
      original_text: z.string(),
    }),
  ),
  unclear: z
    .array(
      z.object({
        where: z.string().describe("Which part of the document, e.g. 'line 3, handwritten medicine name'"),
        best_reading: z.string().nullable().describe("Possible reading if any; null if no reasonable guess"),
        why: z.string(),
      }),
    )
    .describe("Only words or numbers that are physically unreadable on the page. Never guess them."),
  uncertainty: Uncertainty,
  needs_human_check: z.boolean(),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

// ---------- Disagreement map ----------

export const DisagreementMapSchema = z.object({
  overview: z
    .string()
    .describe("2-3 sentences: how many doctors, what they looked at, where they differ. No conclusion."),
  possibilities: z.array(
    z.object({
      name: z.string().describe("A possibility a real doctor in the records raised"),
      raised_by: z.array(
        z.object({
          doctor: z.string(),
          specialty: z.string().nullable(),
          date: z.string().nullable(),
          how_phrased: z.string(),
          source_ids: SourceIds,
        }),
      ),
      fits: z.array(z.object({ point: z.string(), source_ids: SourceIds })),
      does_not_fit: z.array(z.object({ point: z.string(), source_ids: SourceIds })),
      not_yet_checked: z.array(
        z.object({
          item: z.string().describe("A test or question in the records that was never done/answered"),
          why_it_matters: z.string(),
          source_ids: SourceIds,
        }),
      ),
    }),
  ),
  disagreements: z.array(
    z.object({
      summary: z.string().describe("Where two or more records point in different directions"),
      source_ids: SourceIds,
    }),
  ),
  loose_ends: z.array(
    z.object({
      item: z.string().describe("Ordered test with no result on file, referral never followed, abnormal result never mentioned again"),
      source_ids: SourceIds,
    }),
  ),
  uncertainty: Uncertainty,
  needs_human_check: z.boolean(),
});
export type DisagreementMap = z.infer<typeof DisagreementMapSchema>;

// ---------- Case conference lens ----------

export const LensReviewSchema = z.object({
  relevant: z.boolean().describe("false if nothing in the record touches this specialty"),
  relevant_findings: z.array(z.object({ point: z.string(), source_ids: SourceIds })),
  to_check_or_rule_out: z.array(
    z.object({ item: z.string(), why: z.string(), source_ids: SourceIds }),
  ),
  questions_to_ask: z.array(z.string()),
  uncertainty: Uncertainty,
  needs_human_check: z.boolean(),
});
export type LensReview = z.infer<typeof LensReviewSchema>;

// ---------- Brief ----------

export const BriefSchema = z.object({
  doctor: z.object({
    headline: z.string().describe("One sentence: who, how long, main symptoms, how many doctors seen"),
    main_symptoms: z.array(z.string()),
    timeline: z.array(
      z.object({ date: z.string(), event: z.string(), source_ids: SourceIds }),
    ),
    possibilities_raised: z.array(
      z.object({
        name: z.string(),
        raised_by: z.string(),
        status: z.string().describe("What happened since: tested/normal, never tested, treated without change, etc."),
        source_ids: SourceIds,
      }),
    ),
    key_results: z.array(z.object({ item: z.string(), source_ids: SourceIds })),
    current_medicines: z.array(z.object({ item: z.string(), source_ids: SourceIds })),
    not_yet_checked: z.array(z.object({ item: z.string(), source_ids: SourceIds })),
    questions_for_today: z.array(z.string()),
  }),
  family: z.object({
    summary: z.string().describe("A short, warm paragraph in plain words"),
    what_doctors_said: z.array(z.object({ item: z.string(), source_ids: SourceIds })),
    questions_to_ask: z.array(z.string()),
    what_to_bring: z.array(z.string()),
  }),
  translation_notes: z
    .array(z.string())
    .describe("Terms whose translation is uncertain, with the original wording"),
});
export type Brief = z.infer<typeof BriefSchema>;

// ---------- Episode ----------

export const EpisodeSchema = z.object({
  danger: z.boolean().describe("true if ANY emergency warning sign is described"),
  danger_signs: z.array(z.string()),
  type: z.string().describe("e.g. 'dizziness (spinning)', 'weakness', 'fatigue'; in the family language"),
  started: z.string().nullable(),
  duration: z.string().nullable(),
  trigger_or_timing: z.string().nullable(),
  other_symptoms: z.array(z.string()),
  severity: z.number().nullable().describe("1-10 if stated or clearly implied, else null"),
  summary: z.string().describe("One sentence in the family language"),
});
export type EpisodeStructured = z.infer<typeof EpisodeSchema>;

/** Result of the fact-checker agent on one analysis. null = the check could not run. */
export type CheckSummary = { checked: number; removed: number; corrected: number };
