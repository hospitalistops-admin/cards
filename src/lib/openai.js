import { CARD_JSON_SCHEMA } from "./schema.js";

const OPENAI_BASE = "https://api.openai.com/v1";

function assertKey(key) {
  if (!key || typeof key !== "string" || !key.startsWith("sk-")) {
    throw new Error("Missing OpenAI API key. Add it in Settings.");
  }
}

export async function transcribeAudio({ blob, apiKey, model }) {
  assertKey(apiKey);
  const form = new FormData();
  // Safari records audio/mp4, others audio/webm; Whisper accepts both.
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("webm") ? "webm" : "ogg";
  form.append("file", blob, `dictation.${ext}`);
  form.append("model", model || "whisper-1");
  form.append("response_format", "text");

  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Transcription failed (${res.status}): ${msg.slice(0, 300)}`);
  }
  return (await res.text()).trim();
}

const SYSTEM_PROMPT = `You are a clinical scribe. You convert a physician's short dictated rounding note into the RoundingCard JSON schema.

Rules:
- Output must exactly match the schema — no extra keys, no missing keys.
- Use empty strings / empty objects / empty arrays for anything the dictation doesn't mention.
- fhbid.status meanings:
  - "ok"        — item addressed / on target / non-issue
  - "pending"   — planned for today or awaiting a result/decision
  - "attention" — actively problematic or explicitly flagged
  - "na"        — not applicable (or not mentioned at all — default)
- Translate casual references: "HOB up" -> headOfBed.status "ok"; "Foley still in" -> indwelling.status "attention" or "pending" depending on plan; "bowel reg pending" -> bowel.status "pending" with note; etc.
- Put short clinical detail in .note (e.g. "Enoxaparin 40 SQ daily"), not in oneliner.
- vitals/labs are flat string->string maps. trends is string->one of "up"|"down"|"flat".
- Room, age, los are strings even if numeric in the dictation.`;

export async function parseToCard({ transcript, apiKey, model }) {
  assertKey(apiKey);
  const body = {
    model: model || "gpt-5.4",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Dictation:\n\n${transcript}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "RoundingCard",
        strict: true,
        schema: CARD_JSON_SCHEMA,
      },
    },
  };

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Parse failed (${res.status}): ${msg.slice(0, 400)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Parse failed: empty response");
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error("Parse failed: model returned non-JSON");
  }
}
