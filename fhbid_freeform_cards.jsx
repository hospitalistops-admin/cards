import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Download,
  ClipboardCopy,
  CopyPlus,
  FileJson,
  RotateCcw,
  Check,
  X,
  Feather,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap');
`;

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────
const FHBID_ITEMS = [
  { key: "feeding",            letter: "F", name: "Feeding" },
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

const SYSTEMS = [
  { key: "",        label: "—",       color: "#8A8578" },
  { key: "cardiac", label: "Cardiac", color: "#B62A4B" },
  { key: "pulm",    label: "Pulm",    color: "#2A5DA8" },
  { key: "renal",   label: "Renal",   color: "#A06913" },
  { key: "id",      label: "ID",      color: "#6B2FA0" },
  { key: "neuro",   label: "Neuro",   color: "#B6541C" },
  { key: "gi",      label: "GI",      color: "#2B7148" },
  { key: "general", label: "Gen Med", color: "#4A4A4A" },
];

const ACUITIES = ["—", "low", "moderate", "high", "critical"];

const INK = "#1B2543";        // primary navy ink
const STAMP = "#A8361D";      // rust stamp
const PAPER = "#FBF5E4";      // cream paper
const MUSTARD = "#C89B2A";    // highlight

// ─────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `c${Date.now()}${Math.random().toString(16).slice(2)}`;

const today = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function newCard(seed = {}) {
  return {
    id: uid(),
    room: seed.room ?? "",
    initials: seed.initials ?? "",
    age: seed.age ?? "",
    sex: seed.sex ?? "",
    los: seed.los ?? "",
    system: seed.system ?? "",
    acuity: seed.acuity ?? "—",
    oneliner: seed.oneliner ?? "",
    date: seed.date ?? today(),
    fhbid: FHBID_ITEMS.map((f) => ({
      key: f.key,
      checked: seed.fhbid?.[f.key]?.checked ?? false,
      note: seed.fhbid?.[f.key]?.note ?? "",
    })),
    todos: seed.todos?.length
      ? seed.todos
      : [
          { text: "", done: false },
          { text: "", done: false },
          { text: "", done: false },
          { text: "", done: false },
        ],
    pending: seed.pending?.length
      ? seed.pending
      : [{ text: "" }, { text: "" }],
  };
}

const SEED_SAMPLES = [
  newCard({
    room: "301",
    initials: "JM",
    age: "68",
    sex: "M",
    los: "3",
    system: "cardiac",
    acuity: "moderate",
    oneliner: "HFrEF exacerbation, day 3, Cr ↑ on diuresis",
    fhbid: {
      thromboprophylaxis: { checked: true, note: "Enoxap 40 QD" },
      headOfBed: { checked: true, note: "" },
      indwelling: { checked: false, note: "Foley DOS 4 — pull" },
      bowel: { checked: false, note: "+Senna, MiraLAX" },
    },
    todos: [
      { text: "Pull Foley", done: false },
      { text: "Hold diuretic if Cr ≥ 2.0", done: false },
      { text: "Senna + MiraLAX", done: false },
      { text: "Finalize d/c meds", done: false },
    ],
    pending: [{ text: "AM BMP" }, { text: "Cards echo read" }],
  }),
  newCard({
    room: "317",
    initials: "DA",
    age: "83",
    sex: "F",
    los: "5",
    system: "neuro",
    acuity: "low",
    oneliner: "Encephalopathy 2/2 UTI, resolving; SNF pending",
    fhbid: {
      deescalation: { checked: true, note: "Cipro d4/7" },
      indwelling: { checked: false, note: "Foley — d/c & trial void" },
      feeding: { checked: false, note: "Nectar-thick, poor PO" },
      skinSBT: { checked: false, note: "Stage 1 sacral, turn q2h" },
    },
    todos: [
      { text: "Pull Foley, trial void", done: false },
      { text: "PT/OT eval", done: false },
      { text: "SLP f/u", done: false },
      { text: "SNF placement", done: false },
    ],
    pending: [{ text: "PT note" }, { text: "SNF bed" }],
  }),
];

// ─────────────────────────────────────────────────────────────
// html2canvas dynamic loader
// ─────────────────────────────────────────────────────────────
function useHtml2Canvas() {
  const [state, setState] = useState(
    typeof window !== "undefined" && window.html2canvas ? "ready" : "loading"
  );
  useEffect(() => {
    if (state === "ready") return;
    if (typeof window === "undefined") return;
    if (window.html2canvas) {
      setState("ready");
      return;
    }
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.async = true;
    s.onload = () => setState("ready");
    s.onerror = () => setState("error");
    document.head.appendChild(s);
    return () => {
      // leave the script, it's cached
    };
  }, [state]);
  return state;
}

async function renderCardToBlob(el) {
  if (!window.html2canvas) throw new Error("html2canvas not ready");
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = await window.html2canvas(el, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
    logging: false,
  });
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2000);
  }, []);
  return { msg, show };
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [cards, setCards] = useState(SEED_SAMPLES);
  const [showImport, setShowImport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const canvasState = useHtml2Canvas();
  const cardRefs = useRef({});
  const toast = useToast();

  const update = (id, patch) =>
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const setFHBID = (id, key, patch) =>
    setCards((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              fhbid: c.fhbid.map((f) =>
                f.key === key ? { ...f, ...patch } : f
              ),
            }
          : c
      )
    );

  const setTodo = (id, i, patch) =>
    setCards((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              todos: c.todos.map((t, j) =>
                j === i ? { ...t, ...patch } : t
              ),
            }
          : c
      )
    );

  const setPending = (id, i, patch) =>
    setCards((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              pending: c.pending.map((t, j) =>
                j === i ? { ...t, ...patch } : t
              ),
            }
          : c
      )
    );

  const duplicate = (id) =>
    setCards((cs) => {
      const i = cs.findIndex((c) => c.id === id);
      if (i < 0) return cs;
      const clone = { ...cs[i], id: uid() };
      return [...cs.slice(0, i + 1), clone, ...cs.slice(i + 1)];
    });

  const remove = (id) => setCards((cs) => cs.filter((c) => c.id !== id));

  const addCard = () => setCards((cs) => [...cs, newCard()]);

  const clearAll = () => setCards([newCard()]);

  const reset = () => setCards(SEED_SAMPLES);

  const downloadCard = async (id) => {
    try {
      const el = cardRefs.current[id];
      if (!el) return;
      const blob = await renderCardToBlob(el);
      if (!blob) throw new Error("Render failed");
      const card = cards.find((c) => c.id === id);
      const name = `fhbid-${card?.room || "blank"}-${card?.initials || "card"}.png`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.show("Downloaded");
    } catch (e) {
      toast.show("Export failed — try again in a moment");
    }
  };

  const copyCard = async (id) => {
    try {
      const el = cardRefs.current[id];
      if (!el) return;
      const blob = await renderCardToBlob(el);
      if (!blob) throw new Error("Render failed");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.show("Copied — paste in Freeform");
    } catch (e) {
      toast.show("Copy failed — use Download instead");
    }
  };

  const importJSON = (text) => {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      setCards(arr.map((p) => newCard(p)));
      setShowImport(false);
      toast.show(`Loaded ${arr.length} card${arr.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.show("Invalid JSON");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 50% -20%, #F7EED5 0%, transparent 60%), #EEE6CF",
        fontFamily: "'Work Sans', system-ui, sans-serif",
        color: INK,
      }}
    >
      <style>{FONTS}</style>
      <style>{`
        .field {
          border: none;
          background: transparent;
          outline: none;
          color: inherit;
          font: inherit;
          width: 100%;
          padding: 0;
          margin: 0;
        }
        .line {
          border-bottom: 1px dashed ${INK}55;
          transition: border-color .2s;
        }
        .line:focus-within {
          border-bottom: 1px solid ${INK};
        }
        .field::placeholder {
          color: ${INK}55;
          font-style: italic;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-in { animation: fadeUp .4s ease both; }
      `}</style>

      <Toolbar
        canvasState={canvasState}
        onAdd={addCard}
        onReset={reset}
        onClear={clearAll}
        onImport={() => setShowImport(true)}
        onHelp={() => setShowHelp(true)}
      />

      <main style={{ maxWidth: 1740, margin: "0 auto", padding: "24px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(520px, 560px))",
            gap: 40,
            justifyContent: "center",
          }}
        >
          {cards.map((c, idx) => (
            <CardWrapper
              key={c.id}
              card={c}
              index={idx}
              onDownload={() => downloadCard(c.id)}
              onCopy={() => copyCard(c.id)}
              onDuplicate={() => duplicate(c.id)}
              onDelete={() => remove(c.id)}
              canExport={canvasState === "ready"}
              setRef={(el) => (cardRefs.current[c.id] = el)}
              update={update}
              setFHBID={setFHBID}
              setTodo={setTodo}
              setPending={setPending}
            />
          ))}
        </div>
      </main>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={importJSON}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {toast.msg && <Toast>{toast.msg}</Toast>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────
function Toolbar({ canvasState, onAdd, onReset, onClear, onImport, onHelp }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: `${PAPER}F2`,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${INK}30`,
      }}
    >
      <div
        style={{
          maxWidth: 1740,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 34,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            FHBID<span style={{ color: STAMP }}>·</span>Freeform
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              opacity: 0.55,
            }}
          >
            clipboard cards for Apple Freeform
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusPill state={canvasState} />
          <TB onClick={onImport} icon={<FileJson size={14} />}>From JSON</TB>
          <TB onClick={onAdd} icon={<Plus size={14} />}>Add card</TB>
          <TB onClick={onReset} icon={<RotateCcw size={14} />}>Samples</TB>
          <TB onClick={onClear} icon={<X size={14} />}>Clear</TB>
          <TB onClick={onHelp} icon={<Info size={14} />}>How to</TB>
        </div>
      </div>
    </header>
  );
}

function TB({ onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        border: `1px solid ${INK}`,
        background: "transparent",
        color: INK,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${INK}0F`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {children}
    </button>
  );
}

function StatusPill({ state }) {
  const m = {
    loading: { label: "Preparing export…", color: MUSTARD },
    ready: { label: "Export ready", color: "#2B7148" },
    error: { label: "Export offline", color: STAMP },
  }[state];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: m.color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: m.color,
          boxShadow: `0 0 8px ${m.color}`,
        }}
      />
      {m.label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card wrapper (actions + card)
// ─────────────────────────────────────────────────────────────
function CardWrapper({
  card,
  index,
  onDownload,
  onCopy,
  onDuplicate,
  onDelete,
  canExport,
  setRef,
  update,
  setFHBID,
  setTodo,
  setPending,
}) {
  return (
    <div
      className="card-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "0 2px",
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          card · {String(index + 1).padStart(2, "0")}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <SmallAction disabled={!canExport} onClick={onCopy} icon={<ClipboardCopy size={13} />}>
            Copy PNG
          </SmallAction>
          <SmallAction disabled={!canExport} onClick={onDownload} icon={<Download size={13} />}>
            Download
          </SmallAction>
          <SmallAction onClick={onDuplicate} icon={<CopyPlus size={13} />} />
          <SmallAction onClick={onDelete} icon={<Trash2 size={13} />} danger />
        </div>
      </div>

      {/* The card itself — only this gets exported */}
      <ChecklistCard
        setRef={setRef}
        card={card}
        update={update}
        setFHBID={setFHBID}
        setTodo={setTodo}
        setPending={setPending}
      />
    </div>
  );
}

function SmallAction({ onClick, icon, children, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={children || ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: children ? "5px 9px" : "5px 7px",
        border: `1px solid ${danger ? STAMP : INK}`,
        background: danger ? `${STAMP}10` : "transparent",
        color: danger ? STAMP : INK,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// The checklist card
// ─────────────────────────────────────────────────────────────
function ChecklistCard({ setRef, card, update, setFHBID, setTodo, setPending }) {
  const sys = SYSTEMS.find((s) => s.key === card.system) || SYSTEMS[0];

  return (
    <div
      ref={setRef}
      style={{
        width: 540,
        position: "relative",
        background: PAPER,
        color: INK,
        // double-rule border via box-shadow stacking
        boxShadow: `0 0 0 1px ${INK}, 0 0 0 5px ${PAPER}, 0 0 0 6px ${INK}, 8px 8px 0 ${INK}22`,
        // subtle dot grid
        backgroundImage: `radial-gradient(${INK}1A 0.7px, transparent 0.7px)`,
        backgroundSize: "14px 14px",
        backgroundPosition: "0 0",
      }}
    >
      {/* top system band */}
      <div
        style={{
          height: 8,
          background: sys.color,
          borderBottom: `1px solid ${INK}`,
        }}
      />

      <div style={{ padding: "22px 26px 26px" }}>
        {/* Masthead */}
        <Masthead card={card} update={update} />

        {/* Identity block */}
        <IdentityBlock card={card} update={update} />

        {/* One-liner */}
        <OneLiner card={card} update={update} />

        {/* FHBID rows */}
        <ChecklistBlock card={card} setFHBID={setFHBID} />

        {/* Round plan + pending */}
        <PlanBlock card={card} setTodo={setTodo} setPending={setPending} />

        {/* Footer */}
        <Footer />
      </div>

      {/* Corner stamp */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: -12,
          transform: "rotate(6deg)",
          padding: "4px 10px",
          border: `1.5px solid ${STAMP}`,
          color: STAMP,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          background: PAPER,
        }}
      >
        F · H · B · I · D
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────
function Masthead({ card, update }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottom: `1.5px solid ${INK}`,
        paddingBottom: 8,
        marginBottom: 14,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontWeight: 600,
            opacity: 0.65,
          }}
        >
          rounding · checklist
        </div>
        <div
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 28,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            marginTop: 2,
          }}
        >
          Fast Hugs Bid
        </div>
      </div>
      <div
        className="line"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          minWidth: 120,
          textAlign: "right",
          paddingBottom: 2,
        }}
      >
        <input
          className="field"
          style={{ textAlign: "right" }}
          value={card.date}
          onChange={(e) => update(card.id, { date: e.target.value })}
        />
      </div>
    </div>
  );
}

function IdentityBlock({ card, update }) {
  const sys = SYSTEMS.find((s) => s.key === card.system) || SYSTEMS[0];
  const cycleSystem = () => {
    const i = SYSTEMS.findIndex((s) => s.key === card.system);
    update(card.id, { system: SYSTEMS[(i + 1) % SYSTEMS.length].key });
  };
  const cycleAcuity = () => {
    const i = ACUITIES.indexOf(card.acuity);
    update(card.id, { acuity: ACUITIES[(i + 1) % ACUITIES.length] });
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 18, marginBottom: 14 }}>
      {/* Room cell */}
      <div
        style={{
          background: INK,
          color: PAPER,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: 98,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.35em",
            opacity: 0.7,
          }}
        >
          ROOM
        </div>
        <input
          className="field"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 62,
            lineHeight: 0.9,
            color: MUSTARD,
            letterSpacing: "-0.03em",
          }}
          value={card.room}
          placeholder="___"
          onChange={(e) => update(card.id, { room: e.target.value })}
        />
      </div>

      {/* Right identity grid */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.8fr 0.8fr", gap: 10 }}>
          <FieldLabeled label="Initials">
            <input
              className="field"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 26,
                lineHeight: 1,
                fontWeight: 600,
              }}
              value={card.initials}
              placeholder="—"
              onChange={(e) => update(card.id, { initials: e.target.value })}
            />
          </FieldLabeled>
          <FieldLabeled label="Age / Sex">
            <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
              <input
                className="field"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 700, width: "45%" }}
                value={card.age}
                placeholder="--"
                onChange={(e) => update(card.id, { age: e.target.value })}
              />
              <span style={{ opacity: 0.4 }}>/</span>
              <input
                className="field"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 700, width: "45%" }}
                value={card.sex}
                placeholder="-"
                onChange={(e) => update(card.id, { sex: e.target.value })}
              />
            </div>
          </FieldLabeled>
          <FieldLabeled label="LOS">
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <input
                className="field"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 700, width: "60%" }}
                value={card.los}
                placeholder="-"
                onChange={(e) => update(card.id, { los: e.target.value })}
              />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, opacity: 0.55 }}>d</span>
            </div>
          </FieldLabeled>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Chip onClick={cycleSystem} color={sys.color}>
            {sys.label}
          </Chip>
          <Chip onClick={cycleAcuity} outline>
            Acuity: <b style={{ marginLeft: 4 }}>{card.acuity.toUpperCase()}</b>
          </Chip>
        </div>
      </div>
    </div>
  );
}

function FieldLabeled({ label, children }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div className="line" style={{ paddingBottom: 2 }}>
        {children}
      </div>
    </div>
  );
}

function Chip({ children, color, outline, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        border: `1.5px solid ${color || INK}`,
        background: outline ? "transparent" : `${color}18`,
        color: color || INK,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function OneLiner({ card, update }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: 2,
        }}
      >
        One-liner
      </div>
      <div className="line" style={{ paddingBottom: 3 }}>
        <input
          className="field"
          style={{ fontSize: 14, fontStyle: "italic" }}
          value={card.oneliner}
          placeholder="Summarize the patient in one line…"
          onChange={(e) => update(card.id, { oneliner: e.target.value })}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FHBID rows
// ─────────────────────────────────────────────────────────────
function ChecklistBlock({ card, setFHBID }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <SectionHeader>Checklist</SectionHeader>
      <div style={{ border: `1px solid ${INK}`, background: `${PAPER}`, }}>
        {FHBID_ITEMS.map((item, i) => {
          const cur = card.fhbid.find((f) => f.key === item.key);
          return (
            <FhbidRow
              key={item.key}
              item={item}
              value={cur}
              first={i === 0}
              onToggle={() => setFHBID(card.id, item.key, { checked: !cur.checked })}
              onNote={(v) => setFHBID(card.id, item.key, { note: v })}
            />
          );
        })}
      </div>
    </div>
  );
}

function FhbidRow({ item, value, first, onToggle, onNote }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "36px 34px 120px 1fr",
        alignItems: "stretch",
        borderTop: first ? "none" : `1px solid ${INK}25`,
        minHeight: 30,
      }}
    >
      {/* Letter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${INK}25`,
          background: `${INK}06`,
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {item.letter}
      </div>
      {/* Check */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${INK}25`,
        }}
      >
        <Checkbox checked={value.checked} onClick={onToggle} />
      </div>
      {/* Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          fontSize: 12,
          fontWeight: 500,
          borderRight: `1px solid ${INK}25`,
        }}
      >
        {item.name}
      </div>
      {/* Note */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
        }}
      >
        <input
          className="field"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
          }}
          placeholder="…"
          value={value.note}
          onChange={(e) => onNote(e.target.value)}
        />
      </div>
    </div>
  );
}

function Checkbox({ checked, onClick, size = 18 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        border: `1.5px solid ${INK}`,
        background: checked ? INK : "transparent",
        color: PAPER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor: "pointer",
        flexShrink: 0,
      }}
      aria-checked={checked}
    >
      {checked && <Check size={size - 6} strokeWidth={3} />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Plan + pending
// ─────────────────────────────────────────────────────────────
function PlanBlock({ card, setTodo, setPending }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr", gap: 16, marginBottom: 14 }}>
      <div>
        <SectionHeader>Round plan</SectionHeader>
        <div style={{ border: `1px solid ${INK}`, padding: "6px 10px" }}>
          {card.todos.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                borderBottom: i < card.todos.length - 1 ? `1px dashed ${INK}25` : "none",
              }}
            >
              <Checkbox
                checked={t.done}
                onClick={() => setTodo(card.id, i, { done: !t.done })}
                size={16}
              />
              <input
                className="field"
                style={{
                  fontSize: 12,
                  textDecoration: t.done ? "line-through" : "none",
                  opacity: t.done ? 0.55 : 1,
                }}
                value={t.text}
                placeholder="…"
                onChange={(e) => setTodo(card.id, i, { text: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionHeader>Pending</SectionHeader>
        <div style={{ border: `1px solid ${INK}`, padding: "6px 10px" }}>
          {card.pending.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                borderBottom: i < card.pending.length - 1 ? `1px dashed ${INK}25` : "none",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  border: `1.5px solid ${INK}`,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <input
                className="field"
                style={{ fontSize: 12 }}
                value={t.text}
                placeholder="awaiting…"
                onChange={(e) => setPending(card.id, i, { text: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: `${INK}40` }} />
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 10,
        borderTop: `1px solid ${INK}30`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          opacity: 0.55,
        }}
      >
        <Feather size={11} /> de-identified · scratchpad
      </div>
      <div
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: 14,
          opacity: 0.6,
        }}
      >
        rounding deck
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <Overlay onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 92vw)",
          background: PAPER,
          border: `1.5px solid ${INK}`,
          boxShadow: `10px 10px 0 ${INK}40`,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 24,
            }}
          >
            Import from agent JSON
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: INK, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>
          Paste an array of patients (or a single patient). Missing fields are blank.
          Each patient's <code style={{ fontFamily: "'IBM Plex Mono', monospace" }}>fhbid</code> is an
          object keyed by the slug (<i>feeding, analgesia, sedation, thromboprophylaxis, headOfBed,
          ulcer, glycemic, skinSBT, bowel, indwelling, deescalation</i>) and each value is
          <code style={{ fontFamily: "'IBM Plex Mono', monospace" }}> {"{checked, note}"}</code>.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{"room":"301","initials":"JM","system":"cardiac",...}]'
          style={{
            width: "100%",
            minHeight: 240,
            padding: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            background: `${INK}08`,
            border: `1px solid ${INK}40`,
            outline: "none",
            color: INK,
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              border: `1px solid ${INK}`,
              background: "transparent",
              color: INK,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(text)}
            style={{
              padding: "8px 14px",
              border: `1px solid ${INK}`,
              background: INK,
              color: PAPER,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Load
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function HelpModal({ onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <Overlay onClose={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(600px, 92vw)",
          background: PAPER,
          border: `1.5px solid ${INK}`,
          boxShadow: `10px 10px 0 ${INK}40`,
          padding: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              fontSize: 24,
            }}
          >
            Moving cards to Freeform
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: INK, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <ol style={{ fontSize: 13.5, lineHeight: 1.6, paddingLeft: 18 }}>
          <li>
            Fill out cards by hand, or tap <b>From JSON</b> and paste your agent's output.
          </li>
          <li>
            <b>On iPad:</b> tap <b>Copy PNG</b> on a card. Switch to Freeform, long-press an empty spot on the board, tap <b>Paste</b>. The card lands as an image.
          </li>
          <li>
            <b>On Mac:</b> same, or use <b>Download</b>, then drag the PNG from Finder into the Freeform board.
          </li>
          <li>
            Arrange cards spatially — by ward, by acuity, by whatever makes sense. Use Apple Pencil to check boxes, cross out items, scribble a new plan.
          </li>
          <li>
            Mid-rounds, come back here, edit the digital card, re-copy, and replace. Or keep the Freeform board as the source of truth during rounds and sync back after.
          </li>
        </ol>
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            background: `${MUSTARD}20`,
            border: `1px dashed ${MUSTARD}`,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <b>Pro tip —</b> keep cards the same width (540 px). On a Freeform board they'll tile into clean rows, and your eye learns to find Room / Initials in the same spot every time.
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27, 37, 67, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 50,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
function Toast({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "10px 18px",
        background: INK,
        color: PAPER,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.1em",
        zIndex: 100,
        boxShadow: `5px 5px 0 ${INK}40`,
      }}
    >
      {children}
    </div>
  );
}
