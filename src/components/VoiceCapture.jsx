import React, { useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { transcribeAudio, parseToCard } from "../lib/openai.js";
import { INK, DANGER, ACCENT } from "../lib/schema.js";

// Safari prefers audio/mp4; others use audio/webm.
function pickMimeType() {
  const tries = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  for (const t of tries) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
}

export default function VoiceCapture({ apiKey, chatModel, transcribeModel, online, onParsed, onToast }) {
  const [state, setState] = useState("idle"); // idle | recording | transcribing | parsing
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const disabled = !online || state === "transcribing" || state === "parsing";
  const canStart = online && state === "idle";

  const start = async () => {
    if (!apiKey) {
      onToast?.("Add your OpenAI API key in Settings first");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        await process(blob);
      };
      rec.start();
      recRef.current = rec;
      setState("recording");
    } catch (e) {
      onToast?.(`Mic blocked: ${e.message || e}`);
      setState("idle");
    }
  };

  const stop = () => {
    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.stop();
    }
  };

  const process = async (blob) => {
    setState("transcribing");
    try {
      const transcript = await transcribeAudio({ blob, apiKey, model: transcribeModel });
      if (!transcript) throw new Error("Empty transcript");
      setState("parsing");
      const parsed = await parseToCard({ transcript, apiKey, model: chatModel });
      onParsed?.(parsed);
    } catch (e) {
      onToast?.(String(e.message || e));
    } finally {
      setState("idle");
    }
  };

  const label = state === "idle" ? (online ? "Dictate" : "Offline") :
                state === "recording" ? "Stop" :
                state === "transcribing" ? "Transcribing…" : "Parsing…";

  const bg = state === "recording" ? DANGER : state === "idle" ? ACCENT : "#F5F1E8";

  return (
    <button
      onClick={state === "recording" ? stop : canStart ? start : undefined}
      disabled={disabled && state !== "recording"}
      className={"touch-target" + (state === "recording" ? " pulse-rec" : "")}
      title={label}
      aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px",
        border: "2px solid #000",
        background: bg,
        color: INK,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, fontWeight: 800,
        letterSpacing: "0.1em", textTransform: "uppercase",
        opacity: disabled && state === "idle" ? 0.5 : 1,
      }}
    >
      {state === "recording" && <Square size={14} />}
      {state === "idle" && <Mic size={14} />}
      {(state === "transcribing" || state === "parsing") && <Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} />}
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
