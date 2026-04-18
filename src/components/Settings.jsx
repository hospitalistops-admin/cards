import React, { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { INK, PAPER, CREAM, ACCENT, DANGER } from "../lib/schema.js";

export default function Settings({ settings, onChange, onClose, onClearAll }) {
  const [draft, setDraft] = useState(settings);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const save = () => {
    onChange(draft);
    onClose();
  };

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
          width: "min(560px, 100%)", background: CREAM,
          border: "3px solid #000", boxShadow: "8px 8px 0 #00000055",
          padding: 18,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 24, fontWeight: 800 }}>
            Settings
          </div>
          <button onClick={onClose} aria-label="Close" className="touch-target" style={{ border: "2px solid #000", background: PAPER, width: 44, height: 40 }}>
            <X size={16} />
          </button>
        </div>

        <Field label="OpenAI API key">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 44px", gap: 6 }}>
            <input
              type={show ? "text" : "password"}
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value.trim() })}
              placeholder="sk-…"
              autoComplete="off"
              spellCheck={false}
              style={inp}
            />
            <button onClick={() => setShow(!show)} className="touch-target" style={{ border: "2px solid #000", background: PAPER }} aria-label="Toggle visibility">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Hint>Stored in this browser's localStorage only. Sent directly to api.openai.com — no proxy.</Hint>
        </Field>

        <Field label="Chat model">
          <input value={draft.chatModel} onChange={(e) => setDraft({ ...draft, chatModel: e.target.value.trim() })} style={inp} placeholder="gpt-5.4" />
        </Field>

        <Field label="Transcription model">
          <input value={draft.transcribeModel} onChange={(e) => setDraft({ ...draft, transcribeModel: e.target.value.trim() })} style={inp} placeholder="whisper-1" />
        </Field>

        <div style={{ marginTop: 16, padding: 12, border: "2px dashed " + DANGER, background: "#FFF0F0" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: DANGER, marginBottom: 6 }}>
            Danger zone
          </div>
          <button onClick={onClearAll} className="touch-target" style={{
            padding: "10px 14px", border: "2px solid " + DANGER, background: PAPER, color: DANGER,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Clear all data</button>
          <Hint>Removes every card and the API key from this device.</Hint>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} className="touch-target" style={btnSecondary}>Cancel</button>
          <button onClick={save} className="touch-target" style={btnPrimary}>Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, opacity: 0.65 }}>{label}</span>
      {children}
    </label>
  );
}

function Hint({ children }) {
  return <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 4, lineHeight: 1.4 }}>{children}</div>;
}

const inp = {
  width: "100%", padding: "10px 12px",
  border: "2px solid #000", background: PAPER,
  outline: "none", color: INK,
};

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
