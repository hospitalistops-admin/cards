import React, { useState, useEffect } from "react";
import { X, Trash2, ClipboardCopy, Download, Plus, Check } from "lucide-react";
import {
  FHBID_ITEMS, SYSTEMS, ACUITIES, STATUSES, STATUS_KEYS,
  INK, PAPER, CREAM, ACCENT, DANGER, newCard,
} from "../lib/schema.js";
import VoiceCapture from "./VoiceCapture.jsx";

export default function CardEditor({
  card, settings, online,
  onSave, onClose, onDelete, onCopy, onDownload, onToast,
}) {
  const [draft, setDraft] = useState(card);
  useEffect(() => { setDraft(card); }, [card.id]); // eslint-disable-line

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setFhbid = (key, patch) =>
    setDraft((d) => ({ ...d, fhbid: { ...d.fhbid, [key]: { ...d.fhbid[key], ...patch } } }));
  const setList = (key, i, value) =>
    setDraft((d) => {
      const next = (d[key] || []).slice();
      next[i] = value;
      return { ...d, [key]: next };
    });
  const addToList = (key) => setDraft((d) => ({ ...d, [key]: [...(d[key] || []), ""] }));
  const removeFromList = (key, i) =>
    setDraft((d) => ({ ...d, [key]: (d[key] || []).filter((_, j) => j !== i) }));

  const applyVoiceParsed = (parsed) => {
    const merged = newCard({ ...parsed, id: draft.id, date: draft.date });
    setDraft(merged);
    onToast?.("Dictation applied — review and save");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(10,10,10,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "stretch", justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(820px, 100%)",
          background: CREAM,
          border: "3px solid #000",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, padding: "10px 14px", background: INK, color: PAPER,
          borderBottom: "3px solid #000",
        }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 800, fontSize: 22 }}>
            Edit card
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <VoiceCapture
              apiKey={settings.apiKey}
              chatModel={settings.chatModel}
              transcribeModel={settings.transcribeModel}
              online={online}
              onParsed={applyVoiceParsed}
              onToast={onToast}
            />
            <TopBtn onClick={onCopy} label="Copy PNG"><ClipboardCopy size={16} /></TopBtn>
            <TopBtn onClick={onDownload} label="Download"><Download size={16} /></TopBtn>
            <TopBtn onClick={onDelete} label="Delete" danger><Trash2 size={16} /></TopBtn>
            <TopBtn onClick={onClose} label="Close"><X size={16} /></TopBtn>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          <Row>
            <Field label="Room">
              <input value={draft.room} onChange={(e) => set({ room: e.target.value })} style={inp} placeholder="301" inputMode="numeric" />
            </Field>
            <Field label="Initials">
              <input value={draft.initials} onChange={(e) => set({ initials: e.target.value.toUpperCase() })} style={inp} placeholder="JM" />
            </Field>
            <Field label="Age">
              <input value={draft.age} onChange={(e) => set({ age: e.target.value })} style={inp} placeholder="68" inputMode="numeric" />
            </Field>
            <Field label="Sex">
              <input value={draft.sex} onChange={(e) => set({ sex: e.target.value.toUpperCase() })} style={inp} placeholder="M" />
            </Field>
            <Field label="LOS">
              <input value={draft.los} onChange={(e) => set({ los: e.target.value })} style={inp} placeholder="3" inputMode="numeric" />
            </Field>
          </Row>

          <Row>
            <Field label="System">
              <Pills
                value={draft.system}
                options={Object.entries(SYSTEMS).map(([k, v]) => ({ key: k, label: v.label || "—", color: v.ink, bg: v.tint }))}
                onChange={(v) => set({ system: v })}
              />
            </Field>
            <Field label="Acuity">
              <Pills
                value={draft.acuity}
                options={Object.entries(ACUITIES).map(([k, v]) => ({ key: k, label: v.label, color: v.color }))}
                onChange={(v) => set({ acuity: v })}
              />
            </Field>
          </Row>

          <Field label="One-liner">
            <textarea rows={2} value={draft.oneliner} onChange={(e) => set({ oneliner: e.target.value })} style={{ ...inp, resize: "vertical" }} placeholder="Summarize the patient in one line…" />
          </Field>

          <Field label="Disposition">
            <input value={draft.disposition} onChange={(e) => set({ disposition: e.target.value })} style={inp} placeholder="Likely d/c tomorrow if…" />
          </Field>

          <Field label="FHBID">
            <div style={{ border: "2px solid #000", background: PAPER }}>
              {FHBID_ITEMS.map((item, i) => {
                const s = draft.fhbid[item.key] || { status: "na", note: "" };
                return (
                  <div key={item.key} style={{
                    display: "grid", gridTemplateColumns: "30px 1fr", gap: 0,
                    alignItems: "stretch", borderTop: i === 0 ? "none" : "1px solid #00000020",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#00000008", fontFamily: "'Fraunces', serif",
                      fontStyle: "italic", fontWeight: 800, fontSize: 16, borderRight: "1px solid #00000020",
                    }}>{item.letter}</div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                        <StatusCycler
                          value={s.status}
                          onChange={(status) => setFhbid(item.key, { status })}
                        />
                      </div>
                      <input
                        value={s.note}
                        onChange={(e) => setFhbid(item.key, { note: e.target.value })}
                        style={{ ...inp, marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                        placeholder="note…"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>

          <Row>
            <KvEditor title="Vitals" kv={draft.vitals} onChange={(vitals) => set({ vitals })} placeholderK="HR" placeholderV="78" />
            <KvEditor title="Labs" kv={draft.labs} onChange={(labs) => set({ labs })} placeholderK="Cr" placeholderV="1.8" />
          </Row>

          <Row>
            <ListEditor title="Round plan" items={draft.todos || []} onChange={(todos) => set({ todos })} placeholder="todo…" />
            <ListEditor title="Pending" items={draft.pending || []} onChange={(pending) => set({ pending })} placeholder="awaiting…" />
          </Row>

          <Field label="History (free-form summary)">
            <textarea
              rows={4}
              value={draft.history || ""}
              onChange={(e) => set({ history: e.target.value })}
              style={{ ...inp, resize: "vertical", fontSize: 13, lineHeight: 1.4 }}
              placeholder="Narrative summary of the patient's story and what's going on…"
            />
          </Field>

          <ListEditor
            title="Problem list"
            items={draft.problems || []}
            onChange={(problems) => set({ problems })}
            placeholder="e.g. AKI, CHF exacerbation…"
          />
        </div>

        {/* Footer */}
        <div style={{ padding: 12, display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "3px solid #000", background: PAPER }}>
          <button
            onClick={onClose}
            className="touch-target"
            style={{
              padding: "12px 18px", border: "2px solid #000", background: CREAM,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(draft)}
            className="touch-target"
            style={{
              padding: "12px 22px", border: "2px solid #000", background: ACCENT,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: "3px 3px 0 #000",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          ><Check size={14} /> Save</button>
        </div>
      </div>
    </div>
  );
}

const inp = {
  width: "100%",
  padding: "10px 12px",
  border: "2px solid #000",
  background: "#fff",
  outline: "none",
  color: INK,
};

function Row({ children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 10,
    }}>{children}</div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700,
        opacity: 0.65,
      }}>{label}</span>
      {children}
    </label>
  );
}

function Pills({ value, options, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="touch-target"
            style={{
              padding: "6px 12px",
              border: "2px solid #000",
              background: active ? (o.bg || o.color) : "#fff",
              color: active && !o.bg ? "#fff" : INK,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              boxShadow: active ? "2px 2px 0 #000" : "none",
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

function StatusCycler({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {STATUS_KEYS.map((k) => {
        const st = STATUSES[k];
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className="touch-target"
            title={st.label}
            style={{
              width: 44, height: 36,
              border: "2px solid #000",
              background: active ? st.bg : "#fff",
              color: st.ink,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14, fontWeight: 800,
              boxShadow: active ? "2px 2px 0 #000" : "none",
            }}
          >{st.mark}</button>
        );
      })}
    </div>
  );
}

function KvEditor({ title, kv, onChange, placeholderK, placeholderV }) {
  const entries = Object.entries(kv || {});
  const setEntry = (i, nk, nv) => {
    const next = {};
    entries.forEach(([k, v], j) => {
      if (j === i) {
        if (nk !== "") next[nk] = nv;
      } else next[k] = v;
    });
    onChange(next);
  };
  const add = () => {
    const next = { ...(kv || {}) };
    let i = 1;
    while (next["new" + i] !== undefined) i++;
    next["new" + i] = "";
    onChange(next);
  };
  const remove = (i) => {
    const next = {};
    entries.forEach(([k, v], j) => { if (j !== i) next[k] = v; });
    onChange(next);
  };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, opacity: 0.65,
        }}>{title}</span>
        <button onClick={add} className="touch-target" style={{ padding: "4px 8px", border: "2px solid #000", background: ACCENT, fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
          <Plus size={12} /> add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map(([k, v], i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 44px", gap: 6 }}>
            <input value={k} onChange={(e) => setEntry(i, e.target.value, v)} style={{ ...inp, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }} placeholder={placeholderK} />
            <input value={v} onChange={(e) => setEntry(i, k, e.target.value)} style={{ ...inp, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }} placeholder={placeholderV} />
            <button onClick={() => remove(i)} className="touch-target" style={{ border: "2px solid #000", background: "#FFE6E6", color: DANGER }} aria-label="Remove">
              <X size={14} />
            </button>
          </div>
        ))}
        {entries.length === 0 && <div style={{ fontSize: 12, opacity: 0.5, fontStyle: "italic" }}>none</div>}
      </div>
    </div>
  );
}

function ListEditor({ title, items, onChange, placeholder }) {
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  const add = () => onChange([...items, ""]);
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, opacity: 0.65,
        }}>{title}</span>
        <button onClick={add} className="touch-target" style={{ padding: "4px 8px", border: "2px solid #000", background: ACCENT, fontSize: 11, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
          <Plus size={12} /> add
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 44px", gap: 6 }}>
            <input value={t} onChange={(e) => set(i, e.target.value)} style={inp} placeholder={placeholder} />
            <button onClick={() => remove(i)} className="touch-target" style={{ border: "2px solid #000", background: "#FFE6E6", color: DANGER }} aria-label="Remove">
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 12, opacity: 0.5, fontStyle: "italic" }}>none</div>}
      </div>
    </div>
  );
}

function TopBtn({ onClick, children, label, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="touch-target"
      style={{
        width: 44, height: 40,
        border: "2px solid #000",
        background: danger ? "#FFE6E6" : CREAM,
        color: danger ? DANGER : INK,
      }}
    >{children}</button>
  );
}
