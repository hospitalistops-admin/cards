import React, { useMemo, useState } from "react";
import { Edit3, ClipboardCopy, Download, Trash2 } from "lucide-react";
import {
  FHBID_ITEMS, SYSTEMS, ACUITIES, STATUSES, INK, PAPER, ACCENT, DANGER,
} from "../lib/schema.js";

const SORTS = ["attention", "acuity", "room"];
const ACUITY_ORDER = { critical: 0, high: 1, moderate: 2, low: 3, "": 9 };

function countStatus(card, status) {
  let n = 0;
  for (const k of Object.keys(card.fhbid || {})) {
    if (card.fhbid[k]?.status === status) n++;
  }
  return n;
}

export default function Dashboard({ cards, onEdit, onCopy, onDownload, onDelete }) {
  const [sortBy, setSortBy] = useState("attention");

  const sorted = useMemo(() => {
    const a = [...cards];
    if (sortBy === "room") a.sort((x, y) => (parseInt(x.room) || 0) - (parseInt(y.room) || 0));
    else if (sortBy === "acuity") a.sort((x, y) => (ACUITY_ORDER[x.acuity] ?? 9) - (ACUITY_ORDER[y.acuity] ?? 9));
    else a.sort((x, y) => countStatus(y, "attention") - countStatus(x, "attention"));
    return a;
  }, [cards, sortBy]);

  if (cards.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 4px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6 }}>Sort</span>
        {SORTS.map((k) => (
          <button
            key={k}
            onClick={() => setSortBy(k)}
            className="touch-target"
            style={{
              border: "2px solid #000",
              padding: "6px 12px",
              background: sortBy === k ? INK : "#F5F1E8",
              color: sortBy === k ? ACCENT : INK,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              boxShadow: sortBy === k ? "2px 2px 0 #000" : "none",
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {sorted.map((c, i) => (
          <DashCard
            key={c.id}
            card={c}
            index={i}
            onEdit={() => onEdit(c.id)}
            onCopy={() => onCopy(c)}
            onDownload={() => onDownload(c)}
            onDelete={() => {
              if (confirm(`Delete card for room ${c.room || "—"}?`)) onDelete(c.id);
            }}
          />
        ))}
      </div>
    </>
  );
}

function DashCard({ card, index, onEdit, onCopy, onDownload, onDelete }) {
  const sys = SYSTEMS[card.system] || SYSTEMS[""];
  const acu = ACUITIES[card.acuity] || ACUITIES[""];
  const att = countStatus(card, "attention");
  const pen = countStatus(card, "pending");

  return (
    <article
      className="fade-in"
      style={{
        border: "3px solid #000",
        background: PAPER,
        boxShadow: att > 0 ? "6px 6px 0 #000" : "4px 4px 0 #000",
        animationDelay: `${index * 40}ms`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Ribbon */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "3px solid #000", background: sys.tint }}>
        <div style={{ flex: 1, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase", color: sys.ink,
          }}>{sys.label}</span>
        </div>
        {card.acuity && (
          <div style={{
            padding: "8px 12px", borderLeft: "3px solid #000",
            background: acu.color, color: PAPER,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            letterSpacing: "0.2em", fontWeight: 800,
          }}>{acu.label}</div>
        )}
      </div>

      {/* Room + id */}
      <div style={{ display: "flex", borderBottom: "3px solid #000" }}>
        <div style={{
          background: INK, color: ACCENT,
          padding: "6px 12px", minWidth: 120,
          borderRight: "3px solid #000",
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", opacity: 0.7 }}>ROOM</div>
          <div style={{
            fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 900,
            fontSize: 40, lineHeight: 0.9, letterSpacing: "-0.02em",
          }}>{card.room || "—"}</div>
        </div>
        <div style={{ padding: "8px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            <b style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontStyle: "italic" }}>{card.initials || "—"}</b>
            <span>{card.age || "—"}{card.sex ? "/" + card.sex : ""}</span>
            <span style={{ opacity: 0.7 }}>LOS {card.los || "—"}d</span>
          </div>
        </div>
      </div>

      {/* One-liner */}
      <div style={{ padding: "10px 14px", fontSize: 13, lineHeight: 1.4, borderBottom: "2px solid #00000020", minHeight: 48 }}>
        {card.oneliner || <span style={{ opacity: 0.4, fontStyle: "italic" }}>No summary yet</span>}
      </div>

      {/* FHBID status strip */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${FHBID_ITEMS.length}, 1fr)`, borderBottom: "2px solid #00000020" }}>
        {FHBID_ITEMS.map((item) => {
          const s = card.fhbid?.[item.key];
          const st = STATUSES[s?.status || "na"];
          return (
            <div key={item.key} title={`${item.name}${s?.note ? ": " + s.note : ""}`}
              style={{
                background: st.bg, color: st.ink,
                textAlign: "center", padding: "6px 0",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                fontWeight: 800, borderRight: "1px solid #00000020",
              }}>
              {item.letter}
            </div>
          );
        })}
      </div>

      {/* Counts + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {att > 0 && <span style={{ color: DANGER, fontWeight: 800 }}>!{att} attn</span>}
          {pen > 0 && <span style={{ color: "#5A3B00", fontWeight: 800 }}>·{pen} pend</span>}
          {att === 0 && pen === 0 && <span style={{ opacity: 0.5 }}>all ok</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <IconBtn onClick={onEdit} label="Edit"><Edit3 size={14} /></IconBtn>
          <IconBtn onClick={onCopy} label="Copy PNG"><ClipboardCopy size={14} /></IconBtn>
          <IconBtn onClick={onDownload} label="Download"><Download size={14} /></IconBtn>
          <IconBtn onClick={onDelete} label="Delete" danger><Trash2 size={14} /></IconBtn>
        </div>
      </div>
    </article>
  );
}

function IconBtn({ onClick, children, label, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="touch-target"
      style={{
        width: 44, height: 40,
        border: "2px solid #000",
        background: danger ? "#FFE6E6" : "#F5F1E8",
        color: danger ? DANGER : INK,
      }}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", opacity: 0.75 }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 40, fontWeight: 800 }}>
        No cards yet.
      </div>
      <div style={{ marginTop: 10, fontSize: 14, maxWidth: 420, margin: "10px auto 0", lineHeight: 1.5 }}>
        Tap <b>New card</b> to add one manually, or tap the mic inside a card and dictate a note — GPT will structure it.
      </div>
    </div>
  );
}
