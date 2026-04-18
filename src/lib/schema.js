export const FHBID_ITEMS = [
  { key: "feeding",            letter: "F", name: "Feeding / nutrition" },
  { key: "analgesia",          letter: "A", name: "Analgesia" },
  { key: "sedation",           letter: "S", name: "Sedation" },
  { key: "thromboprophylaxis", letter: "T", name: "Thrombo-ppx (VTE)" },
  { key: "headOfBed",          letter: "H", name: "HOB ≥ 30°" },
  { key: "ulcer",              letter: "U", name: "Ulcer (stress) ppx" },
  { key: "glycemic",           letter: "G", name: "Glycemic control" },
  { key: "skinSBT",            letter: "S", name: "Skin / SBT" },
  { key: "bowel",              letter: "B", name: "Bowel regimen" },
  { key: "indwelling",         letter: "I", name: "Indwelling lines" },
  { key: "deescalation",       letter: "D", name: "Abx de-escalation" },
];

export const FHBID_KEYS = FHBID_ITEMS.map((i) => i.key);

export const SYSTEMS = {
  "":        { label: "—",       tint: "#EDEDED", ink: "#525252" },
  cardiac:   { label: "Cardiac", tint: "#FFE1E4", ink: "#9B1B30" },
  pulm:      { label: "Pulm",    tint: "#DCEBFF", ink: "#1D4ED8" },
  renal:     { label: "Renal",   tint: "#FFF0C2", ink: "#92540C" },
  id:        { label: "ID",      tint: "#EADCFF", ink: "#6B21A8" },
  neuro:     { label: "Neuro",   tint: "#FFDDC2", ink: "#B23B00" },
  gi:        { label: "GI",      tint: "#D5F1DC", ink: "#1B6E3A" },
  general:   { label: "Gen Med", tint: "#E6E6E6", ink: "#2A2A2A" },
};

export const SYSTEM_KEYS = Object.keys(SYSTEMS);

export const ACUITIES = {
  "":         { label: "—",        color: "#525252" },
  critical:   { label: "CRITICAL", color: "#B91C1C" },
  high:       { label: "HIGH",     color: "#E85D04" },
  moderate:   { label: "MOD",      color: "#1D4ED8" },
  low:        { label: "LOW",      color: "#166534" },
};

export const ACUITY_KEYS = Object.keys(ACUITIES);

export const STATUSES = {
  ok:        { bg: "#86EFAC", ink: "#0F3D1F", label: "OK",        mark: "✓" },
  pending:   { bg: "#FFE266", ink: "#5A3B00", label: "Pending",   mark: "·" },
  attention: { bg: "#FF6B6B", ink: "#450A0A", label: "Attention", mark: "!" },
  na:        { bg: "#E5E5E5", ink: "#525252", label: "N/A",       mark: "—" },
};

export const STATUS_KEYS = ["ok", "pending", "attention", "na"];

export const INK = "#0A0A0A";
export const PAPER = "#FFFDF7";
export const CREAM = "#F5F1E8";
export const ACCENT = "#FFE266";
export const DANGER = "#FF6B6B";

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `c${Date.now()}${Math.random().toString(16).slice(2)}`;

export const today = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const emptyFhbid = () =>
  Object.fromEntries(FHBID_KEYS.map((k) => [k, { status: "na", note: "" }]));

export function newCard(seed = {}) {
  const fhbid = emptyFhbid();
  if (seed.fhbid) {
    for (const k of FHBID_KEYS) {
      const s = seed.fhbid[k];
      if (s && typeof s === "object") {
        fhbid[k] = {
          status: STATUS_KEYS.includes(s.status) ? s.status : "na",
          note: typeof s.note === "string" ? s.note : "",
        };
      }
    }
  }
  return {
    id: seed.id || uid(),
    room: seed.room ?? "",
    initials: seed.initials ?? "",
    age: seed.age ?? "",
    sex: seed.sex ?? "",
    los: seed.los ?? "",
    system: SYSTEM_KEYS.includes(seed.system) ? seed.system : "",
    acuity: ACUITY_KEYS.includes(seed.acuity) ? seed.acuity : "",
    date: seed.date ?? today(),
    oneliner: seed.oneliner ?? "",
    disposition: seed.disposition ?? "",
    vitals: seed.vitals && typeof seed.vitals === "object" ? seed.vitals : {},
    labs: seed.labs && typeof seed.labs === "object" ? seed.labs : {},
    trends: seed.trends && typeof seed.trends === "object" ? seed.trends : {},
    fhbid,
    todos: Array.isArray(seed.todos) ? seed.todos.filter((t) => typeof t === "string") : [],
    pending: Array.isArray(seed.pending) ? seed.pending.filter((t) => typeof t === "string") : [],
  };
}

// JSON schema used with OpenAI structured output. Mirrors newCard().
// `additionalProperties: false` + required keys are needed for strict mode.
export const CARD_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    room: { type: "string", description: "Room number, e.g. '301'." },
    initials: { type: "string", description: "Patient initials, 2-3 letters." },
    age: { type: "string", description: "Age in years as a string." },
    sex: { type: "string", description: "M or F." },
    los: { type: "string", description: "Length of stay in days, as a string." },
    system: {
      type: "string",
      enum: SYSTEM_KEYS,
      description: "Primary problem system. Empty string if unknown.",
    },
    acuity: {
      type: "string",
      enum: ACUITY_KEYS,
      description: "Clinical acuity. Empty string if unknown.",
    },
    oneliner: { type: "string", description: "One-line patient summary." },
    disposition: { type: "string", description: "Planned disposition." },
    vitals: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Key vitals as a flat map of string values (e.g. {\"HR\": \"78\", \"BP\": \"128/74\"}).",
    },
    labs: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Key labs as a flat map of string values.",
    },
    trends: {
      type: "object",
      additionalProperties: { type: "string", enum: ["up", "down", "flat"] },
      description: "Lab trend direction keyed by lab name.",
    },
    fhbid: {
      type: "object",
      additionalProperties: false,
      description: "FHBID checklist keyed by slug. status: 'ok' done/fine, 'pending' upcoming/under-review, 'attention' problem flagged, 'na' not applicable.",
      properties: Object.fromEntries(
        FHBID_KEYS.map((k) => [
          k,
          {
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: STATUS_KEYS },
              note: { type: "string" },
            },
            required: ["status", "note"],
          },
        ])
      ),
      required: FHBID_KEYS,
    },
    todos: {
      type: "array",
      items: { type: "string" },
      description: "Action items for this rounding cycle.",
    },
    pending: {
      type: "array",
      items: { type: "string" },
      description: "Results, consults, or items being awaited.",
    },
  },
  required: [
    "room", "initials", "age", "sex", "los", "system", "acuity",
    "oneliner", "disposition", "vitals", "labs", "trends",
    "fhbid", "todos", "pending",
  ],
};
