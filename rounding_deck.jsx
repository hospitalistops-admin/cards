import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Heart,
  Wind,
  Droplet,
  Bug,
  Brain,
  Soup,
  Users,
  AlertTriangle,
  X,
  Upload,
  RotateCcw,
  ClipboardList,
  Clock,
  Activity,
  Thermometer,
  Mic,
} from "lucide-react";

// ---------- Schema ----------
const FHBID = [
  { key: "feeding", letter: "F", name: "Feeding / nutrition" },
  { key: "analgesia", letter: "A", name: "Analgesia" },
  { key: "sedation", letter: "S", name: "Sedation" },
  { key: "thromboprophylaxis", letter: "T", name: "Thromboprophylaxis (VTE)" },
  { key: "headOfBed", letter: "H", name: "Head-of-bed ≥ 30°" },
  { key: "ulcer", letter: "U", name: "Ulcer (stress) prophylaxis" },
  { key: "glycemic", letter: "G", name: "Glycemic control" },
  { key: "skinSBT", letter: "S", name: "Skin / SBT" },
  { key: "bowel", letter: "B", name: "Bowel regimen" },
  { key: "indwelling", letter: "I", name: "Indwelling lines & tubes" },
  { key: "deescalation", letter: "D", name: "Antibiotic de-escalation" },
];

const SYSTEM = {
  cardiac: { label: "Cardiac", tint: "#FFE1E4", ink: "#9B1B30", Icon: Heart },
  pulm:    { label: "Pulm",    tint: "#DCEBFF", ink: "#1D4ED8", Icon: Wind },
  renal:   { label: "Renal",   tint: "#FFF0C2", ink: "#92540C", Icon: Droplet },
  id:      { label: "ID",      tint: "#EADCFF", ink: "#6B21A8", Icon: Bug },
  neuro:   { label: "Neuro",   tint: "#FFDDC2", ink: "#B23B00", Icon: Brain },
  gi:      { label: "GI",      tint: "#D5F1DC", ink: "#1B6E3A", Icon: Soup },
  general: { label: "Gen Med", tint: "#E6E6E6", ink: "#2A2A2A", Icon: Users },
};

const STATUS = {
  ok:        { bg: "#86EFAC", ink: "#0F3D1F", label: "OK", mark: "✓" },
  pending:   { bg: "#FFE266", ink: "#5A3B00", label: "Pending", mark: "·" },
  attention: { bg: "#FF6B6B", ink: "#450A0A", label: "Attention", mark: "!" },
  na:        { bg: "#E5E5E5", ink: "#525252", label: "N/A", mark: "—" },
};

const ACUITY = {
  critical: { label: "CRITICAL", color: "#B91C1C" },
  high:     { label: "HIGH",     color: "#E85D04" },
  moderate: { label: "MOD",      color: "#1D4ED8" },
  low:      { label: "LOW",      color: "#166534" },
};

// ---------- Mock census (stand-in for your agent output) ----------
const SAMPLE = [
  {
    id: "p1",
    room: "301",
    initials: "JM", age: 68, sex: "M", los: 3, system: "cardiac",
    oneliner: "HFrEF exacerbation, day 3, Cr uptrending on diuresis.",
    acuity: "moderate",
    disposition: "Likely d/c tomorrow if adequate diuresis and Cr plateaus.",
    vitals: { temp: 37.1, hr: 78, bp: "128/74", rr: 16, spo2: 94, weight: "−2.1 kg from admit" },
    labs:   { Cr: 1.8, Na: 137, K: 3.6, BNP: 1240, Hgb: 11.2 },
    trends: { Cr: "up", K: "down", BNP: "down" },
    fhbid: {
      feeding:           { status: "ok", note: "2 g Na cardiac diet; tolerating" },
      analgesia:         { status: "ok", note: "No pain" },
      sedation:          { status: "na", note: "" },
      thromboprophylaxis:{ status: "ok", note: "Enoxaparin 40 SQ daily" },
      headOfBed:         { status: "ok", note: "HOB > 30°" },
      ulcer:             { status: "na", note: "Not critically ill" },
      glycemic:          { status: "ok", note: "BG 110–150; non-DM" },
      skinSBT:           { status: "ok", note: "Skin intact, Braden 18" },
      bowel:             { status: "pending", note: "No BM × 2 d; add senna + MiraLAX" },
      indwelling:        { status: "attention", note: "Foley DOS 4 — remove, off lasix gtt" },
      deescalation:      { status: "na", note: "No abx" },
    },
    todos: ["Pull Foley", "Hold diuretic if Cr ≥ 2.0", "Senna + MiraLAX", "Finalize d/c meds"],
    pending: ["AM BMP", "Cards echo read"],
  },
  {
    id: "p2",
    room: "304",
    initials: "SK", age: 45, sex: "F", los: 7, system: "id",
    oneliner: "MSSA bacteremia 2/2 cellulitis, on cefazolin; OPAT planned.",
    acuity: "moderate",
    disposition: "OPAT → home; ~2 more weeks of therapy.",
    vitals: { temp: 37.8, hr: 92, bp: "115/68", rr: 18, spo2: 98 },
    labs:   { WBC: 8.4, CRP: 42, Cr: 0.8 },
    trends: { WBC: "down", CRP: "down" },
    fhbid: {
      feeding:           { status: "ok", note: "Regular diet" },
      analgesia:         { status: "ok", note: "PRN APAP" },
      sedation:          { status: "na", note: "" },
      thromboprophylaxis:{ status: "ok", note: "Heparin 5000 SQ TID" },
      headOfBed:         { status: "ok", note: "" },
      ulcer:             { status: "na", note: "" },
      glycemic:          { status: "na", note: "No DM" },
      skinSBT:           { status: "pending", note: "LLE cellulitis margin marked; re-eval AM" },
      bowel:             { status: "ok", note: "Daily BM" },
      indwelling:        { status: "attention", note: "PICC pending w/ OPAT — IR consult today" },
      deescalation:      { status: "ok", note: "Narrowed vanc → cefazolin, day 5" },
    },
    todos: ["Re-mark cellulitis border", "Confirm OPAT w/ case mgmt", "IR for PICC"],
    pending: ["ID f/u", "TTE (r/o endocarditis)"],
  },
  {
    id: "p3",
    room: "312",
    initials: "RP", age: 71, sex: "M", los: 2, system: "pulm",
    oneliner: "CAP with hypoxia; O₂ requirement ↓ 4L → 2L.",
    acuity: "moderate",
    disposition: "PO step-down if tolerating; likely d/c in 24–48 h.",
    vitals: { temp: 37.3, hr: 88, bp: "122/70", rr: 20, spo2: 93 },
    labs:   { WBC: 12.1, Lactate: 1.8, PCT: 0.6 },
    trends: { WBC: "down" },
    fhbid: {
      feeding:           { status: "ok", note: "Regular diet" },
      analgesia:         { status: "ok", note: "" },
      sedation:          { status: "na", note: "" },
      thromboprophylaxis:{ status: "ok", note: "Lovenox 40" },
      headOfBed:         { status: "ok", note: "" },
      ulcer:             { status: "na", note: "" },
      glycemic:          { status: "pending", note: "BG 210 on steroids; SSI in place, consider basal" },
      skinSBT:           { status: "ok", note: "" },
      bowel:             { status: "ok", note: "" },
      indwelling:        { status: "ok", note: "PIV only" },
      deescalation:      { status: "attention", note: "Day 3 CTX/azithro — step to PO levofloxacin" },
    },
    todos: ["PO levofloxacin", "Wean O₂ → RA if tol", "Steroid taper plan"],
    pending: ["AM CXR", "Resp culture"],
  },
  {
    id: "p4",
    room: "317",
    initials: "DA", age: 83, sex: "F", los: 5, system: "neuro",
    oneliner: "Acute encephalopathy 2/2 UTI, resolving; deconditioned.",
    acuity: "low",
    disposition: "SNF placement pending PT clearance.",
    vitals: { temp: 36.9, hr: 76, bp: "138/82", rr: 14, spo2: 97 },
    labs:   { Na: 134, Cr: 1.1, WBC: 7.8 },
    fhbid: {
      feeding:           { status: "attention", note: "Poor PO; SLP → nectar-thick" },
      analgesia:         { status: "ok", note: "" },
      sedation:          { status: "ok", note: "Avoid benzos; PRN haldol only" },
      thromboprophylaxis:{ status: "ok", note: "" },
      headOfBed:         { status: "ok", note: "" },
      ulcer:             { status: "na", note: "" },
      glycemic:          { status: "na", note: "" },
      skinSBT:           { status: "pending", note: "Stage 1 sacral; turn q2h" },
      bowel:             { status: "ok", note: "" },
      indwelling:        { status: "attention", note: "Foley — d/c today, trial void" },
      deescalation:      { status: "ok", note: "Cipro PO d4/7 for UTI" },
    },
    todos: ["Pull Foley", "PT/OT eval", "SLP diet f/u", "SNF placement"],
    pending: ["PT note", "SNF bed confirm"],
  },
  {
    id: "p5",
    room: "321",
    initials: "MC", age: 54, sex: "M", los: 1, system: "gi",
    oneliner: "Gallstone pancreatitis, awaiting lap chole.",
    acuity: "high",
    disposition: "GS consulted; lap chole when clinically ready.",
    vitals: { temp: 37.6, hr: 104, bp: "108/64", rr: 22, spo2: 96 },
    labs:   { Lipase: 2400, WBC: 14.5, AST: 180, ALT: 210, Tbili: 2.4 },
    trends: { Lipase: "down", LFTs: "down" },
    fhbid: {
      feeding:           { status: "attention", note: "NPO → try clears today if pain controlled" },
      analgesia:         { status: "pending", note: "PCA hydromorphone; trial PO today" },
      sedation:          { status: "na", note: "" },
      thromboprophylaxis:{ status: "ok", note: "SCDs + heparin 5000 TID" },
      headOfBed:         { status: "ok", note: "" },
      ulcer:             { status: "ok", note: "PPI — critically ill" },
      glycemic:          { status: "ok", note: "" },
      skinSBT:           { status: "ok", note: "" },
      bowel:             { status: "ok", note: "" },
      indwelling:        { status: "pending", note: "PIV; no central line needed" },
      deescalation:      { status: "na", note: "No abx unless cholangitis" },
    },
    todos: ["Advance diet as tol", "Trial PO analgesia", "GS daily f/u"],
    pending: ["Lipase/LFTs q AM", "GS note", "MRCP?"],
  },
  {
    id: "p6",
    room: "326",
    initials: "EV", age: 62, sex: "F", los: 4, system: "renal",
    oneliner: "Contrast-induced AKI on CKD3; Cr improving.",
    acuity: "moderate",
    disposition: "D/C home when Cr < 2.",
    vitals: { temp: 36.8, hr: 72, bp: "142/84", rr: 16, spo2: 98 },
    labs:   { Cr: 2.1, BUN: 42, K: 4.8, Phos: 5.2 },
    trends: { Cr: "down" },
    fhbid: {
      feeding:           { status: "ok", note: "Renal diet" },
      analgesia:         { status: "ok", note: "No NSAIDs" },
      sedation:          { status: "na", note: "" },
      thromboprophylaxis:{ status: "ok", note: "" },
      headOfBed:         { status: "ok", note: "" },
      ulcer:             { status: "na", note: "" },
      glycemic:          { status: "pending", note: "DM2; hold metformin, SSI only" },
      skinSBT:           { status: "ok", note: "" },
      bowel:             { status: "ok", note: "" },
      indwelling:        { status: "ok", note: "No lines" },
      deescalation:      { status: "na", note: "" },
    },
    todos: ["AM BMP", "Nephro f/u", "Resume home meds at d/c"],
    pending: ["AM BMP", "Renal US read"],
  },
];

// ---------- Utilities ----------
const attentionCount = (p) =>
  Object.values(p.fhbid).filter((x) => x.status === "attention").length;
const pendingCount = (p) =>
  Object.values(p.fhbid).filter((x) => x.status === "pending").length;
const trendArrow = (t) => (t === "up" ? "▲" : t === "down" ? "▼" : "→");

// ---------- Fonts ----------
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800;9..144,900&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap');
`;

// ---------- Root ----------
export default function RoundingDeck() {
  const [patients, setPatients] = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(null);
  const [sortBy, setSortBy] = useState("attention"); // room | acuity | attention
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const attentionItems = useMemo(() => {
    const out = [];
    patients.forEach((p) => {
      Object.entries(p.fhbid).forEach(([k, v]) => {
        if (v.status === "attention") out.push({ p, k, ...v });
      });
    });
    return out;
  }, [patients]);

  const totalAttention = attentionItems.length;
  const totalPending = patients.reduce((s, p) => s + pendingCount(p), 0);

  const sorted = useMemo(() => {
    const a = [...patients];
    if (sortBy === "room") a.sort((x, y) => parseInt(x.room) - parseInt(y.room));
    else if (sortBy === "acuity") {
      const o = { critical: 0, high: 1, moderate: 2, low: 3 };
      a.sort((x, y) => (o[x.acuity] ?? 9) - (o[y.acuity] ?? 9));
    } else a.sort((x, y) => attentionCount(y) - attentionCount(x));
    return a;
  }, [patients, sortBy]);

  const selected = patients.find((p) => p.id === selectedId);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Expected an array");
      setPatients(parsed);
      setShowImport(false);
      setImportText("");
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(1200px 600px at 20% -10%, #FFF4E0 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #E3F1FF 0%, transparent 55%), #F5F1E8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: "#0A0A0A",
      }}
    >
      <style>{FONTS}</style>
      <style>{`
        @keyframes pulseBad {
          0%, 100% { box-shadow: 4px 4px 0 #000, 0 0 0 0 rgba(255,107,107,0.7); }
          50%      { box-shadow: 4px 4px 0 #000, 0 0 0 8px rgba(255,107,107,0); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-in { animation: fadeUp .5s ease both; }
        .ticker-track { animation: marquee 60s linear infinite; }
        .pulse-bad { animation: pulseBad 2.2s ease-in-out infinite; }
      `}</style>

      {/* ---------- Masthead ---------- */}
      <header
        className="border-b-[3px] border-black"
        style={{ background: "#0A0A0A", color: "#F5F1E8" }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-baseline gap-4">
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 900,
                fontSize: "44px",
                letterSpacing: "-0.03em",
                lineHeight: 0.9,
                fontStyle: "italic",
              }}
            >
              Rounding Deck<span style={{ color: "#FFE266" }}>.</span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              FAST · HUGS · BID  ▸  v0.1
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Stat label="Census" value={patients.length} />
            <Stat label="Attention" value={totalAttention} color="#FF6B6B" />
            <Stat label="Pending" value={totalPending} color="#FFE266" />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                opacity: 0.75,
                paddingLeft: 12,
                borderLeft: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {"  ·  "}
              {time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
        </div>

        {/* Scrolling attention ticker */}
        {attentionItems.length > 0 && (
          <div
            className="border-t-[2px] border-black overflow-hidden"
            style={{ background: "#FF6B6B", color: "#0A0A0A" }}
          >
            <div className="flex items-center">
              <div
                className="px-4 py-2 border-r-[2px] border-black shrink-0"
                style={{ background: "#0A0A0A", color: "#FF6B6B", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}
              >
                ◉ Eyes here
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="ticker-track flex gap-10 py-2 whitespace-nowrap" style={{ width: "max-content" }}>
                  {[...attentionItems, ...attentionItems].map((a, i) => (
                    <span key={i} style={{ fontSize: 13, fontWeight: 600 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        RM {a.p.room}
                      </span>
                      {"  "}·{"  "}
                      {FHBID.find((f) => f.key === a.k)?.letter} — {a.note}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ---------- Controls ---------- */}
      <div className="max-w-[1400px] mx-auto px-6 pt-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Sort
          </span>
          {["attention", "acuity", "room"].map((k) => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className="border-[2px] border-black px-3 py-1 text-xs uppercase tracking-wider font-bold transition-transform"
              style={{
                background: sortBy === k ? "#0A0A0A" : "#F5F1E8",
                color: sortBy === k ? "#FFE266" : "#0A0A0A",
                boxShadow: sortBy === k ? "2px 2px 0 #000" : "none",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="border-[2px] border-black px-3 py-1.5 text-xs uppercase tracking-wider font-bold flex items-center gap-2"
            style={{
              background: "#FFE266",
              boxShadow: "3px 3px 0 #000",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Mic size={14} /> Agent → Dashboard
          </button>
          <button
            onClick={() => setPatients(SAMPLE)}
            className="border-[2px] border-black px-3 py-1.5 text-xs uppercase tracking-wider font-bold flex items-center gap-2"
            style={{
              background: "#F5F1E8",
              boxShadow: "3px 3px 0 #000",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* ---------- Grid of patient cards ---------- */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((p, i) => (
            <PatientCard
              key={p.id}
              p={p}
              index={i}
              onSelect={() => setSelectedId(p.id)}
            />
          ))}
        </div>
      </main>

      {/* ---------- Detail modal ---------- */}
      {selected && (
        <DetailModal
          p={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(next) =>
            setPatients((ps) => ps.map((x) => (x.id === next.id ? next : x)))
          }
        />
      )}

      {/* ---------- Import drawer ---------- */}
      {showImport && (
        <ImportDrawer
          value={importText}
          onChange={setImportText}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* footer */}
      <footer className="max-w-[1400px] mx-auto px-6 py-8 flex items-center justify-between text-xs" style={{ opacity: 0.55, fontFamily: "'JetBrains Mono', monospace" }}>
        <div>De-identified scratchpad. Not the chart. Not PHI.</div>
        <div>Tap a card for full detail. ↩ esc to close.</div>
      </footer>
    </div>
  );
}

// ---------- Stat chip ----------
function Stat({ label, value, color = "#F5F1E8" }) {
  return (
    <div className="flex flex-col items-start">
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 800,
          fontSize: 28,
          lineHeight: 1,
          color,
          fontStyle: "italic",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------- Patient card ----------
function PatientCard({ p, index, onSelect }) {
  const sys = SYSTEM[p.system] || SYSTEM.general;
  const Icon = sys.Icon;
  const acu = ACUITY[p.acuity] || ACUITY.moderate;
  const att = attentionCount(p);
  const pen = pendingCount(p);

  return (
    <article
      onClick={onSelect}
      className="card-in cursor-pointer border-[3px] border-black relative"
      style={{
        background: "#FFFDF7",
        boxShadow: att > 0 ? "6px 6px 0 #000" : "5px 5px 0 #000",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Ribbon */}
      <div
        className="flex items-center justify-between border-b-[3px] border-black"
        style={{ background: sys.tint }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Icon size={14} style={{ color: sys.ink }} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: sys.ink,
              fontWeight: 700,
            }}
          >
            {sys.label}
          </span>
        </div>
        <div
          className="px-3 py-1.5 border-l-[3px] border-black"
          style={{
            background: acu.color,
            color: "#FFFDF7",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            fontWeight: 800,
          }}
        >
          {acu.label}
        </div>
      </div>

      {/* Room + ID strip */}
      <div className="flex items-stretch border-b-[3px] border-black">
        <div
          className="px-4 py-2 flex flex-col justify-center border-r-[3px] border-black"
          style={{ background: "#0A0A0A", color: "#FFE266", minWidth: 130 }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.3em",
              opacity: 0.7,
            }}
          >
            ROOM
          </div>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: 52,
              lineHeight: 0.85,
              letterSpacing: "-0.03em",
            }}
          >
            {p.room}
          </div>
        </div>
        <div className="flex-1 px-4 py-2 flex flex-col justify-center">
          <div className="flex items-baseline gap-3">
            <span
              style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 800,
                fontSize: 22,
                lineHeight: 1,
              }}
            >
              {p.initials}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              {p.age}{p.sex}  ·  LOS {p.los}d
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.35,
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            {p.oneliner}
          </p>
        </div>
      </div>

      {/* FHBID piano keys */}
      <div className="grid grid-cols-11 border-b-[3px] border-black">
        {FHBID.map((f, idx) => {
          const v = p.fhbid[f.key] || { status: "na", note: "" };
          const s = STATUS[v.status];
          const isBad = v.status === "attention";
          return (
            <div
              key={f.key}
              className={isBad ? "pulse-bad" : ""}
              style={{
                background: s.bg,
                color: s.ink,
                borderRight: idx < FHBID.length - 1 ? "2px solid #000" : "none",
                padding: "8px 0 6px",
                textAlign: "center",
                position: "relative",
              }}
              title={`${f.name}: ${v.note || s.label}`}
            >
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 900,
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                {f.letter}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  opacity: 0.85,
                  marginTop: 2,
                }}
              >
                {s.mark}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vitals strip */}
      <div
        className="grid grid-cols-5 border-b-[3px] border-black"
        style={{ background: "#F5F1E8" }}
      >
        <Vital label="T" value={p.vitals.temp} />
        <Vital label="HR" value={p.vitals.hr} alert={p.vitals.hr > 100 || p.vitals.hr < 50} />
        <Vital label="BP" value={p.vitals.bp} />
        <Vital label="RR" value={p.vitals.rr} alert={p.vitals.rr > 20} />
        <Vital label="SpO₂" value={`${p.vitals.spo2}%`} alert={p.vitals.spo2 < 92} last />
      </div>

      {/* Labs mini row */}
      <div className="px-4 py-3 border-b-[3px] border-black">
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: 4,
          }}
        >
          Labs
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(p.labs).map(([k, v]) => (
            <div
              key={k}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span style={{ opacity: 0.6 }}>{k}</span>{" "}
              <span style={{ fontWeight: 700 }}>{v}</span>
              {p.trends?.[k] && (
                <span
                  style={{
                    marginLeft: 2,
                    color: p.trends[k] === "up" ? "#B91C1C" : p.trends[k] === "down" ? "#166534" : "#525252",
                    fontSize: 10,
                  }}
                >
                  {trendArrow(p.trends[k])}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Todos */}
      <div className="px-4 py-3 flex items-start gap-3">
        <ClipboardList size={16} style={{ marginTop: 2 }} />
        <div className="flex-1">
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.55,
              marginBottom: 4,
            }}
          >
            Round plan
          </div>
          <ul className="space-y-0.5">
            {p.todos.slice(0, 4).map((t, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.35 }}>
                · {t}
              </li>
            ))}
          </ul>
          {p.todos.length > 4 && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                opacity: 0.55,
                marginTop: 2,
              }}
            >
              +{p.todos.length - 4} more →
            </div>
          )}
        </div>
      </div>

      {/* Attention badge */}
      {(att > 0 || pen > 0) && (
        <div
          className="absolute border-[3px] border-black"
          style={{
            top: -14,
            right: -14,
            background: att > 0 ? "#FF6B6B" : "#FFE266",
            padding: "4px 10px",
            boxShadow: "3px 3px 0 #000",
            transform: "rotate(6deg)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          {att > 0 ? `${att} RED` : `${pen} PEND`}
        </div>
      )}
    </article>
  );
}

function Vital({ label, value, alert, last }) {
  return (
    <div
      className="px-3 py-2"
      style={{
        borderRight: last ? "none" : "2px solid #000",
        background: alert ? "#FF6B6B" : "transparent",
        color: alert ? "#450A0A" : "#0A0A0A",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity: 0.65,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---------- Detail modal ----------
function DetailModal({ p, onClose, onUpdate }) {
  const sys = SYSTEM[p.system] || SYSTEM.general;
  const Icon = sys.Icon;

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleStatus = (key) => {
    const cycle = ["ok", "pending", "attention", "na"];
    const cur = p.fhbid[key].status;
    const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
    onUpdate({
      ...p,
      fhbid: { ...p.fhbid, [key]: { ...p.fhbid[key], status: next } },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(10,10,10,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-[3px] border-black max-w-3xl w-full my-8"
        style={{ background: "#FFFDF7", boxShadow: "10px 10px 0 #000" }}
      >
        {/* Header */}
        <div
          className="flex items-stretch border-b-[3px] border-black"
          style={{ background: sys.tint }}
        >
          <div
            className="px-5 py-3 flex flex-col justify-center border-r-[3px] border-black"
            style={{ background: "#0A0A0A", color: "#FFE266", minWidth: 170 }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.3em",
                opacity: 0.7,
              }}
            >
              ROOM
            </div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 900,
                fontSize: 64,
                lineHeight: 0.85,
              }}
            >
              {p.room}
            </div>
          </div>
          <div className="flex-1 px-5 py-3 flex flex-col justify-center">
            <div className="flex items-center gap-2" style={{ color: sys.ink }}>
              <Icon size={14} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {sys.label}  ·  {p.initials}  ·  {p.age}{p.sex}  ·  LOS {p.los}d
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.2,
                marginTop: 6,
              }}
            >
              {p.oneliner}
            </p>
            <p style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
              <b>Dispo:</b> {p.disposition}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 border-l-[3px] border-black hover:bg-black hover:text-white"
            style={{ background: "#FFFDF7" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* FHBID grid */}
          <section>
            <SectionLabel>FAST HUGS BID · tap a row to cycle status</SectionLabel>
            <div className="border-[2px] border-black">
              {FHBID.map((f, i) => {
                const v = p.fhbid[f.key] || { status: "na", note: "" };
                const s = STATUS[v.status];
                return (
                  <button
                    key={f.key}
                    onClick={() => toggleStatus(f.key)}
                    className="w-full flex items-stretch text-left hover:bg-yellow-50 transition-colors"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid #0A0A0A",
                    }}
                  >
                    <div
                      className="flex flex-col items-center justify-center border-r-[2px] border-black"
                      style={{ background: s.bg, color: s.ink, minWidth: 56 }}
                    >
                      <div
                        style={{
                          fontFamily: "'Fraunces', serif",
                          fontWeight: 900,
                          fontSize: 22,
                          lineHeight: 1,
                        }}
                      >
                        {f.letter}
                      </div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {s.mark}
                      </div>
                    </div>
                    <div className="flex-1 px-3 py-2">
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          opacity: 0.6,
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        {v.note || <span style={{ opacity: 0.4 }}>—</span>}
                      </div>
                    </div>
                    <div
                      className="px-3 flex items-center border-l-[1px] border-black"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: s.ink,
                        background: s.bg,
                        opacity: 0.9,
                      }}
                    >
                      {s.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section>
              <SectionLabel>Round plan</SectionLabel>
              <ul className="border-[2px] border-black divide-y-[1px] divide-black">
                {p.todos.map((t, i) => (
                  <li key={i} className="px-3 py-2" style={{ fontSize: 13 }}>
                    · {t}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <SectionLabel>Pending</SectionLabel>
              <ul className="border-[2px] border-black divide-y-[1px] divide-black">
                {p.pending.map((t, i) => (
                  <li key={i} className="px-3 py-2" style={{ fontSize: 13 }}>
                    ◷ {t}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section>
            <SectionLabel>Vitals · Labs</SectionLabel>
            <div className="grid grid-cols-2 gap-5">
              <div className="border-[2px] border-black">
                {Object.entries(p.vitals).map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex justify-between px-3 py-1.5"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid #0A0A0A",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ opacity: 0.6, textTransform: "uppercase" }}>{k}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="border-[2px] border-black">
                {Object.entries(p.labs).map(([k, v], i) => (
                  <div
                    key={k}
                    className="flex justify-between px-3 py-1.5"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid #0A0A0A",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>{k}</span>
                    <span style={{ fontWeight: 700 }}>
                      {v}
                      {p.trends?.[k] && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            color: p.trends[k] === "up" ? "#B91C1C" : "#166534",
                          }}
                        >
                          {trendArrow(p.trends[k])}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      className="mb-2"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        opacity: 0.6,
      }}
    >
      {children}
    </div>
  );
}

// ---------- Import drawer ----------
function ImportDrawer({ value, onChange, onImport, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const schemaHint = `[
  {
    "id": "p1",
    "room": "301",
    "initials": "JM",
    "age": 68, "sex": "M", "los": 3,
    "system": "cardiac | pulm | renal | id | neuro | gi | general",
    "oneliner": "...",
    "acuity": "critical | high | moderate | low",
    "disposition": "...",
    "vitals": { "temp": 37.1, "hr": 78, "bp": "128/74", "rr": 16, "spo2": 94 },
    "labs":   { "Cr": 1.8, "Na": 137 },
    "trends": { "Cr": "up" },
    "fhbid": {
      "feeding":           { "status": "ok | pending | attention | na", "note": "..." },
      "analgesia":         { ... },
      "sedation":          { ... },
      "thromboprophylaxis":{ ... },
      "headOfBed":         { ... },
      "ulcer":             { ... },
      "glycemic":          { ... },
      "skinSBT":           { ... },
      "bowel":             { ... },
      "indwelling":        { ... },
      "deescalation":      { ... }
    },
    "todos":   ["..."],
    "pending": ["..."]
  }
]`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-[3px] border-black max-w-3xl w-full"
        style={{ background: "#FFFDF7", boxShadow: "10px 10px 0 #000" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 border-b-[3px] border-black"
          style={{ background: "#0A0A0A", color: "#FFE266" }}
        >
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 900,
              fontSize: 22,
              fontStyle: "italic",
            }}
          >
            Agent → Dashboard
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>
            Paste the JSON your voice-transcript agent produces. It replaces
            the full census. The expected schema is on the right — keep it a
            flat array of patients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Paste JSON here…"
              className="w-full border-[2px] border-black p-3 font-mono text-xs"
              style={{ minHeight: 280, background: "#F5F1E8" }}
            />
            <pre
              className="border-[2px] border-black p-3 text-[10px] overflow-auto"
              style={{
                background: "#0A0A0A",
                color: "#86EFAC",
                minHeight: 280,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.45,
              }}
            >
              {schemaHint}
            </pre>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="border-[2px] border-black px-4 py-2 text-xs uppercase tracking-wider font-bold"
              style={{
                background: "#F5F1E8",
                boxShadow: "3px 3px 0 #000",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onImport}
              className="border-[2px] border-black px-4 py-2 text-xs uppercase tracking-wider font-bold flex items-center gap-2"
              style={{
                background: "#FFE266",
                boxShadow: "3px 3px 0 #000",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Upload size={14} /> Load census
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
