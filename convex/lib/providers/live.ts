import type { ExtractedRequest, Llm } from "./types";

// OpenAI Responses API with a JSON schema (structured outputs). The model
// proposes line items; application code prices them and decides what is sent.
const MODEL = () => process.env.OPENAI_MODEL ?? "gpt-5.6-terra";

async function responses(input: string, schema: Record<string, unknown>, name: string): Promise<unknown> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: MODEL(),
      input,
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output_text ?? data.output?.flatMap((o) => o.content ?? []).map((c) => c.text ?? "").join("") ?? "";
  return JSON.parse(text);
}

const requestSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    scheduleImpactDays: { type: "number" },
    questions: { type: "array", items: { type: "string" } },
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["material", "labour", "other"] },
          description: { type: "string" },
          qty: { type: "number" },
          unit: { type: "string" },
          labourHours: { type: "number" },
          ambiguous: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["kind", "description", "qty", "unit", "labourHours", "ambiguous", "note"],
      },
    },
  },
  required: ["title", "summary", "scheduleImpactDays", "questions", "lines"],
};

export const liveLlm: Llm = {
  async extractChangeRequest({ text, projectContext }) {
    const prompt = `You turn a homeowner's or contractor's email about a residential renovation into change-order line items.\nRules: never invent quantities you cannot infer — mark the line ambiguous instead; labour is a separate line in hours; do not price anything; list the questions a contractor must confirm before pricing.\nProject context: ${projectContext}\n\nEmail:\n${text}`;
    return (await responses(prompt, requestSchema, "change_request")) as ExtractedRequest;
  },
  async draftChangeOrderEmail({ summary, totalsText, approveInstructions }) {
    const schema = { type: "object", additionalProperties: false, properties: { body: { type: "string" } }, required: ["body"] };
    const out = (await responses(
      `Write a short, plain-language change-order email (no marketing tone, no legal claims). Include exactly these facts, then the approval instructions verbatim.\nSummary: ${summary}\nTotals: ${totalsText}\nApproval instructions: ${approveInstructions}`,
      schema,
      "co_email",
    )) as { body: string };
    return out.body;
  },
  async classifyInbound({ subject, text }) {
    const schema = { type: "object", additionalProperties: false, properties: { kind: { type: "string", enum: ["request", "quote", "other"] } }, required: ["kind"] };
    const out = (await responses(`Classify this email for a renovation project inbox as request (a scope change), quote (a supplier price quote) or other.\nSubject: ${subject}\n\n${text}`, schema, "inbound_kind")) as { kind: "request" | "quote" | "other" };
    return out.kind;
  },
};
