import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { INK, PAPER, CREAM, ACCENT } from "../lib/schema.js";

export default function ImportModal({ onClose, onImport }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,10,10,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)", background: CREAM,
          border: "3px solid #000", boxShadow: "8px 8px 0 #00000055",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 24, fontWeight: 800 }}>
            Import from JSON
          </div>
          <button onClick={onClose} aria-label="Close" className="touch-target" style={{ border: "2px solid #000", background: PAPER, width: 44, height: 40 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
          Paste a card object or an array of card objects. Missing fields are filled with blanks. Cards are added to your current dashboard (not replaced).
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='[{"room":"301","initials":"JM","system":"cardiac", "fhbid": {"feeding": {"status":"ok","note":"…"}}}]'
          style={{
            width: "100%", minHeight: 240, padding: 12,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            background: PAPER, border: "2px solid #000",
            outline: "none", color: INK, resize: "vertical",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button onClick={onClose} className="touch-target" style={btnSecondary}>Cancel</button>
          <button onClick={() => onImport(text)} className="touch-target" style={btnPrimary}>Load</button>
        </div>
      </div>
    </div>
  );
}

const btnSecondary = {
  padding: "10px 16px", border: "2px solid #000", background: CREAM,
  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase",
};
const btnPrimary = {
  padding: "10px 18px", border: "2px solid #000", background: ACCENT,
  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800,
  letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "3px 3px 0 #000",
};
