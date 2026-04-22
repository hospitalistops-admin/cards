import React from "react";
import {
  FHBID_ITEMS, SYSTEMS, ACUITIES, STATUSES,
  INK, PAPER, ACCENT,
} from "../lib/schema.js";

// Presentation-only card, sized for Apple Freeform (540px wide).
// This is what gets handed to html2canvas. Do not use inputs here.
export default function CardView({ card }) {
  const sys = SYSTEMS[card.system] || SYSTEMS[""];
  const acu = ACUITIES[card.acuity] || ACUITIES[""];

  return (
    <div
      style={{
        width: 540,
        background: PAPER,
        color: INK,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        border: "3px solid #000",
        boxShadow: "6px 6px 0 #00000033",
        position: "relative",
      }}
    >
      {/* Ribbon */}
      <div style={{ display: "flex", borderBottom: "3px solid #000", background: sys.tint }}>
        <div style={{ flex: 1, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.22em", textTransform: "uppercase", color: sys.ink,
          }}>{sys.label}</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: sys.ink, opacity: 0.7, marginLeft: "auto",
          }}>{card.date}</span>
        </div>
        {card.acuity && (
          <div style={{
            padding: "8px 14px", borderLeft: "3px solid #000",
            background: acu.color, color: PAPER,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: "0.22em", fontWeight: 800,
          }}>{acu.label}</div>
        )}
      </div>

      {/* Room + identity */}
      <div style={{ display: "flex", borderBottom: "3px solid #000" }}>
        <div style={{
          background: INK, color: ACCENT,
          padding: "12px 16px", minWidth: 150,
          borderRight: "3px solid #000",
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.3em", opacity: 0.75 }}>ROOM</div>
          <div style={{
            fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 900,
            fontSize: 58, lineHeight: 0.88, letterSpacing: "-0.03em",
          }}>{card.room || "—"}</div>
        </div>
        <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <b style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 28, fontWeight: 800 }}>
              {card.initials || "—"}
            </b>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
              {card.age || "—"}{card.sex ? "/" + card.sex : ""}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, opacity: 0.7 }}>
              LOS {card.los || "—"}d
            </span>
          </div>
          {card.oneliner && (
            <div style={{ fontSize: 13, fontStyle: "italic", lineHeight: 1.4, color: "#222" }}>
              {card.oneliner}
            </div>
          )}
          {card.disposition && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.75 }}>
              <b>Dispo:</b> {card.disposition}
            </div>
          )}
        </div>
      </div>

      {/* Vitals / labs row, only if any */}
      {(hasAny(card.vitals) || hasAny(card.labs)) && (
        <div style={{ display: "grid", gridTemplateColumns: hasAny(card.vitals) && hasAny(card.labs) ? "1fr 1fr" : "1fr", borderBottom: "3px solid #000" }}>
          {hasAny(card.vitals) && (
            <KvBlock title="Vitals" kv={card.vitals} />
          )}
          {hasAny(card.labs) && (
            <KvBlock title="Labs" kv={card.labs} trends={card.trends || {}} borderLeft={hasAny(card.vitals)} />
          )}
        </div>
      )}

      {/* FHBID grid */}
      <div style={{ padding: "10px 14px", borderBottom: "3px solid #000" }}>
        <SectionHeader>FHBID Checklist</SectionHeader>
        <div style={{ border: "2px solid #000", background: "#fff" }}>
          {FHBID_ITEMS.map((item, i) => {
            const s = card.fhbid?.[item.key] || { status: "na", note: "" };
            const st = STATUSES[s.status] || STATUSES.na;
            return (
              <div
                key={item.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 28px 150px 1fr",
                  alignItems: "stretch",
                  borderTop: i === 0 ? "none" : "1px solid #00000020",
                  minHeight: 28,
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRight: "1px solid #00000020",
                  fontFamily: "'Fraunces', serif", fontStyle: "italic",
                  fontWeight: 800, fontSize: 16, background: "#00000008",
                }}>{item.letter}</div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: st.bg, color: st.ink,
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 14,
                  borderRight: "1px solid #00000020",
                }}>{st.mark}</div>
                <div style={{
                  display: "flex", alignItems: "center", padding: "0 8px",
                  fontSize: 11.5, fontWeight: 600, borderRight: "1px solid #00000020",
                }}>{item.name}</div>
                <div style={{
                  display: "flex", alignItems: "center", padding: "4px 8px",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#222",
                }}>{s.note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan + pending */}
      {(card.todos?.length > 0 || card.pending?.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, padding: 14, borderBottom: "3px solid #000" }}>
          <ListBlock title="Round plan" items={card.todos || []} marker="☐" />
          <ListBlock title="Pending" items={card.pending || []} marker="○" borderLeft />
        </div>
      )}

      {/* History + Problem list (smaller text, at the bottom) */}
      {(card.history || card.problems?.length > 0) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: card.history && card.problems?.length > 0 ? "1.4fr 1fr" : "1fr",
          padding: "10px 14px",
          borderBottom: "3px solid #000",
          background: "#FAF7EE",
        }}>
          {card.history && (
            <div style={{ paddingRight: card.problems?.length > 0 ? 12 : 0 }}>
              <SectionHeader>History</SectionHeader>
              <div style={{ fontSize: 10, lineHeight: 1.4, color: "#333", whiteSpace: "pre-wrap" }}>
                {card.history}
              </div>
            </div>
          )}
          {card.problems?.length > 0 && (
            <div style={{
              paddingLeft: card.history ? 12 : 0,
              borderLeft: card.history ? "2px solid #00000025" : "none",
            }}>
              <SectionHeader>Problems</SectionHeader>
              <ul style={{
                margin: 0, padding: 0, listStyle: "none",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, lineHeight: 1.45, color: "#333",
              }}>
                {card.problems.map((p, i) => (
                  <li key={i} style={{ display: "flex", gap: 6 }}>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 14px",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
        letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6,
      }}>
        <span>de-identified · scratchpad</span>
        <span>rounds</span>
      </div>
    </div>
  );
}

function hasAny(obj) {
  if (!obj || typeof obj !== "object") return false;
  for (const k of Object.keys(obj)) if (obj[k] != null && obj[k] !== "") return true;
  return false;
}

function KvBlock({ title, kv, trends = {}, borderLeft }) {
  const entries = Object.entries(kv).filter(([, v]) => v != null && v !== "");
  return (
    <div style={{ padding: "8px 14px", borderLeft: borderLeft ? "2px solid #000" : "none" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
        letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 700,
        marginBottom: 4, opacity: 0.7,
      }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
        {entries.map(([k, v]) => (
          <span key={k} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
            <span style={{ opacity: 0.65 }}>{k}</span>{" "}
            <b>{v}</b>
            {trends[k] && (
              <span style={{ marginLeft: 3, color: trends[k] === "up" ? "#B91C1C" : trends[k] === "down" ? "#166534" : "#525252" }}>
                {trends[k] === "up" ? "▲" : trends[k] === "down" ? "▼" : "→"}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ title, items, marker, borderLeft }) {
  return (
    <div style={{ padding: borderLeft ? "0 0 0 12px" : "0 12px 0 0", borderLeft: borderLeft ? "2px solid #00000025" : "none" }}>
      <SectionHeader>{title}</SectionHeader>
      <div>
        {items.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "3px 0", fontSize: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", width: 12 }}>{marker}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 700,
      }}>{children}</span>
      <div style={{ flex: 1, height: 2, background: "#00000040" }} />
    </div>
  );
}
