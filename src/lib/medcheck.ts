import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, SAFETY_RULES, getClient, structured, textBlock } from "./claude";
import type { CasePayload } from "./case";
import { MedCheckSchema, type MedCheck } from "./schemas";

// Medicine-check agent. Claude looks up each medicine in the patient's records
// in the official FDA drug label database (openFDA) through a tool, retrying
// with other names when a local brand isn't found. A second step compares the
// label text with the patient's symptoms. Every quoted side effect is then
// verified word-for-word against the label text actually returned by openFDA.

const LABEL_SECTIONS = ["boxed_warning", "adverse_reactions", "warnings_and_cautions", "warnings", "precautions", "drug_interactions"] as const;

type Label = { label_id: string; generic_name: string[]; brand_name: string[]; sections: Record<string, string> };

async function fetchLabel(name: string): Promise<Label | null> {
  const q = name.trim().replace(/["\\]/g, "").slice(0, 60);
  if (!q) return null;
  const search = `openfda.generic_name:"${q}"+openfda.brand_name:"${q}"+openfda.substance_name:"${q}"`;
  const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(search)}&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`openFDA ${res.status}`);
  const json = (await res.json()) as { results?: Record<string, unknown>[] };
  const r = json.results?.[0];
  if (!r) return null;
  const openfda = (r.openfda ?? {}) as { generic_name?: string[]; brand_name?: string[] };
  const sections: Record<string, string> = {};
  for (const key of LABEL_SECTIONS) {
    const v = r[key];
    if (Array.isArray(v) && v.length) sections[key] = v.join(" ").replace(/\s+/g, " ").slice(0, 6000);
  }
  return {
    label_id: String(r.set_id ?? r.id ?? ""),
    generic_name: openfda.generic_name ?? [],
    brand_name: openfda.brand_name ?? [],
    sections,
  };
}

const LOOKUP_TOOL: Anthropic.Beta.BetaTool = {
  name: "lookup_drug_label",
  description:
    "Look up a medicine in the official US FDA drug label database (openFDA). Pass a generic name in English (e.g. 'amlodipine', 'gabapentin'). Returns the label's side effects, warnings and interactions, or 'not found'. Medicines sold mainly outside the US may not be listed; try the generic name, then a known alternative name, at most 3 tries per medicine.",
  strict: true,
  input_schema: {
    type: "object",
    properties: { name: { type: "string", description: "Generic medicine name in English" } },
    required: ["name"],
    additionalProperties: false,
  },
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();

export async function medicineCheck(caseFile: CasePayload): Promise<{ medcheck: MedCheck; lookups: number }> {
  const medicines = caseFile.documents.flatMap((d) =>
    ((d.medicines as { name: string; dose: string | null }[] | undefined) ?? []).map((m) => ({ name: m.name, dose: m.dose, source: d.id })),
  );
  if (!medicines.length) {
    return { medcheck: { medicines: [], note: "No medicines were found in the checked records." }, lookups: 0 };
  }

  const labels = new Map<string, Label>();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `<medicines>\n${JSON.stringify(medicines, null, 1)}\n</medicines>\n\nLook up each medicine's FDA label with the tool. Use the generic English name (translate local or brand names, e.g. "Betahistin" -> "betahistine"). Combination products: look up the main ingredients. When you have tried every medicine, reply "done".`,
    },
  ];

  // Agent loop: Claude decides what to look up and retries alternative names.
  let lookups = 0;
  for (let turn = 0; turn < 8; turn++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `${SAFETY_RULES}\n\nTask: you are the pharmacist's research assistant. Your only job in this step is to find the FDA label for each medicine using the lookup tool.`,
      output_config: { effort: "low" },
      tools: [LOOKUP_TOOL],
      tool_choice: { type: "auto" },
      messages,
    });
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || !calls.length) break;
    messages.push({ role: "assistant", content: response.content });

    const results = await Promise.all(
      calls.map(async (call): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
        const name = typeof (call.input as { name?: unknown }).name === "string" ? (call.input as { name: string }).name : "";
        lookups++;
        try {
          const label = await fetchLabel(name);
          if (!label) return { type: "tool_result", tool_use_id: call.id, content: `not found: "${name}"` };
          labels.set(label.label_id, label);
          return {
            type: "tool_result",
            tool_use_id: call.id,
            content: JSON.stringify({ label_id: label.label_id, generic_name: label.generic_name, brand_name: label.brand_name, sections: Object.keys(label.sections) }),
          };
        } catch {
          return { type: "tool_result", tool_use_id: call.id, content: "lookup failed (network); skip this one", is_error: true };
        }
      }),
    );
    messages.push({ role: "user", content: results });
  }

  // Compare the labels that were found with the patient's symptoms.
  const symptoms = {
    main_complaints: caseFile.patient.main_complaints,
    episodes: caseFile.episodes.map((e) => ({ type: e.type, other_symptoms: e.other_symptoms })),
  };
  const medcheck = await structured({
    schema: MedCheckSchema,
    effort: "medium",
    system: `Task: compare each medicine's FDA label with the patient's symptoms.

- For each medicine in <medicines>, say whether an FDA label was found (use the label_id from <labels>).
- overlaps: side effects or warnings in the label that match the patient's symptoms (e.g. dizziness, fatigue, weakness, numbness). label_quote must be copied EXACTLY from the label text in <labels>, short (under 25 words). If nothing matches, leave overlaps empty.
- question_for_doctor: a neutral question, e.g. "Could the dizziness be related to flunarizine, which lists dizziness as a possible side effect?" Never suggest stopping, starting or changing a medicine.
- A listed side effect is a possibility, not a cause. Do not say the medicine is causing anything.
- Write symptoms, questions and the note in ${caseFile.patient.family_language}.`,
    content: [
      textBlock(`<medicines>\n${JSON.stringify(medicines, null, 1)}\n</medicines>`),
      textBlock(`<symptoms>\n${JSON.stringify(symptoms, null, 1)}\n</symptoms>`),
      textBlock(`<labels>\n${JSON.stringify([...labels.values()], null, 1)}\n</labels>`),
    ],
  });

  // Keep only quotes that really appear in the label text openFDA returned.
  for (const m of medcheck.medicines) {
    const label = m.label_id ? labels.get(m.label_id) : undefined;
    if (!label) {
      m.fda_label_found = false;
      m.label_id = null;
      m.overlaps = [];
      continue;
    }
    const text = normalize(Object.values(label.sections).join(" "));
    m.overlaps = m.overlaps.filter((o) => o.label_quote.length > 3 && text.includes(normalize(o.label_quote)));
  }
  return { medcheck, lookups };
}
