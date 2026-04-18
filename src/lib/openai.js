import { CARD_JSON_SCHEMA } from "./schema.js";

const OPENAI_BASE = "https://api.openai.com/v1";

function assertKey(key) {
  if (!key || typeof key !== "string" || !key.startsWith("sk-")) {
    throw new Error("Missing OpenAI API key. Add it in Settings.");
  }
}

export async function transcribeAudio({ blob, apiKey, model }) {
  assertKey(apiKey);
  if (!blob || blob.size < 1000) {
    throw new Error(`Recording too short or empty (${blob?.size || 0} bytes). Hold the mic button longer.`);
  }
  const form = new FormData();
  // Safari: audio/mp4. Chrome/Firefox: audio/webm. Whisper accepts both, but
  // the filename extension is used as a format hint, so get it right.
  const type = blob.type || "";
  const ext =
    type.includes("mp4") || type.includes("mpeg") ? "m4a" :
    type.includes("webm") ? "webm" :
    type.includes("ogg") ? "ogg" : "webm";
  form.append("file", blob, `dictation.${ext}`);
  form.append("model", model || "whisper-1");
  form.append("response_format", "text");

  console.info("[transcribe] sending", { size: blob.size, type, ext, model: model || "whisper-1" });

  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const bodyText = await res.text().catch(() => "");
  if (!res.ok) {
    console.error("[transcribe] failed", res.status, bodyText);
    throw new Error(`Transcription failed (${res.status}): ${bodyText.slice(0, 400) || res.statusText}`);
  }
  return bodyText.trim();
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
- vitals and labs are arrays of {name, value} — e.g. vitals: [{"name":"HR","value":"78"},{"name":"BP","value":"128/74"}]. Empty arrays if nothing is mentioned.
- trends is an array of {name, direction} where direction is "up" | "down" | "flat" — e.g. trends: [{"name":"Cr","direction":"up"}].
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

  console.info("[parse] sending", { model: body.model, transcriptChars: transcript.length });

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const bodyText = await res.text().catch(() => "");
  if (!res.ok) {
    console.error("[parse] failed", res.status, bodyText);
    throw new Error(`Parse failed (${res.status}): ${bodyText.slice(0, 400) || res.statusText}`);
  }
  let data;
  try { data = JSON.parse(bodyText); } catch {
    console.error("[parse] non-JSON response body", bodyText);
    throw new Error("Parse failed: non-JSON response from OpenAI");
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[parse] empty content", data);
    throw new Error("Parse failed: empty response");
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error("[parse] content was not JSON", content);
    throw new Error("Parse failed: model returned non-JSON");
  }
  return normalizeParsedCard(parsed);
}

// The schema represents vitals/labs as arrays of {name,value} and trends as
// arrays of {name,direction} because strict mode doesn't allow arbitrary-keyed
// maps. Our internal card model uses objects — convert here so the rest of
// the app doesn't need to know the schema detail.
function normalizeParsedCard(p) {
  const kvToObj = (arr) => {
    if (!Array.isArray(arr)) return {};
    const out = {};
    for (const item of arr) {
      if (item && typeof item.name === "string" && item.name && typeof item.value === "string") {
        out[item.name] = item.value;
      }
    }
    return out;
  };
  const trendToObj = (arr) => {
    if (!Array.isArray(arr)) return {};
    const out = {};
    for (const item of arr) {
      if (item && typeof item.name === "string" && item.name && typeof item.direction === "string") {
        out[item.name] = item.direction;
      }
    }
    return out;
  };
  return {
    ...p,
    vitals: kvToObj(p.vitals),
    labs: kvToObj(p.labs),
    trends: trendToObj(p.trends),
  };
}
