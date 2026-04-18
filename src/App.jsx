import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Plus, Settings as SettingsIcon, FileJson, Wifi, WifiOff } from "lucide-react";
import { newCard, INK, CREAM, ACCENT } from "./lib/schema.js";
import { loadCards, loadSettings, cardsSaver, settingsSaver } from "./lib/storage.js";
import Dashboard from "./components/Dashboard.jsx";
import CardEditor from "./components/CardEditor.jsx";
import CardView from "./components/CardView.jsx";
import ImportModal from "./components/ImportModal.jsx";
import Settings from "./components/Settings.jsx";
import { copyNodeAsPng, downloadNodeAsPng } from "./lib/exportCard.js";

function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    window.clearTimeout(show._t);
    show._t = window.setTimeout(() => setMsg(null), 2400);
  }, []);
  return { msg, show };
}

function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export default function App() {
  const [cards, setCards] = useState(() => loadCards());
  const [settings, setSettings] = useState(() => loadSettings());
  const [editingId, setEditingId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const toast = useToast();
  const online = useOnline();
  const renderTargetRef = useRef(null);
  const [renderTargetCard, setRenderTargetCard] = useState(null);
  const renderResolver = useRef(null);

  useEffect(() => { cardsSaver.save(cards); }, [cards]);
  useEffect(() => { settingsSaver.save(settings); }, [settings]);

  const editing = useMemo(
    () => cards.find((c) => c.id === editingId) || null,
    [cards, editingId]
  );

  const upsertCard = useCallback((card) => {
    setCards((cs) => {
      const i = cs.findIndex((c) => c.id === card.id);
      if (i < 0) return [...cs, card];
      const next = cs.slice();
      next[i] = card;
      return next;
    });
  }, []);

  const deleteCard = useCallback((id) => {
    setCards((cs) => cs.filter((c) => c.id !== id));
    setEditingId((cur) => (cur === id ? null : cur));
  }, []);

  const addCard = () => {
    const c = newCard();
    upsertCard(c);
    setEditingId(c.id);
  };

  // Renders a card off-screen, runs html2canvas against it, resolves.
  const withRenderedNode = useCallback(async (card, fn) => {
    return await new Promise((resolve, reject) => {
      renderResolver.current = { resolve, reject, fn };
      setRenderTargetCard(card);
    });
  }, []);

  useEffect(() => {
    if (!renderTargetCard || !renderTargetRef.current || !renderResolver.current) return;
    const { resolve, reject, fn } = renderResolver.current;
    // Two RAFs to ensure paint + font load before capture.
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      try {
        const result = await fn(renderTargetRef.current);
        resolve(result);
      } catch (e) {
        reject(e);
      } finally {
        renderResolver.current = null;
        setRenderTargetCard(null);
      }
    }));
  }, [renderTargetCard]);

  const copyCard = async (card) => {
    try {
      await withRenderedNode(card, copyNodeAsPng);
      toast.show("Copied — paste in Freeform");
    } catch (e) {
      toast.show(`Copy failed: ${e.message || e}`);
    }
  };

  const downloadCard = async (card) => {
    try {
      const name = `card-${card.room || "blank"}-${card.initials || "x"}.png`;
      await withRenderedNode(card, (el) => downloadNodeAsPng(el, name));
      toast.show("Downloaded");
    } catch (e) {
      toast.show(`Download failed: ${e.message || e}`);
    }
  };

  const importJSON = (text) => {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const next = arr.map((p) => newCard(p));
      setCards((cs) => [...cs, ...next]);
      setShowImport(false);
      toast.show(`Loaded ${next.length} card${next.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.show("Invalid JSON");
    }
  };

  return (
    <div
      className="safe"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(1200px 600px at 20% -10%, #FFF4E0 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #E3F1FF 0%, transparent 55%), " + CREAM,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: INK,
      }}
    >
      <Header
        count={cards.length}
        online={online}
        onAdd={addCard}
        onImport={() => setShowImport(true)}
        onSettings={() => setShowSettings(true)}
      />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 16px 80px" }}>
        <Dashboard
          cards={cards}
          onEdit={(id) => setEditingId(id)}
          onCopy={copyCard}
          onDownload={downloadCard}
          onDelete={deleteCard}
        />
      </main>

      {editing && (
        <CardEditor
          card={editing}
          settings={settings}
          online={online}
          onSave={(next) => { upsertCard(next); setEditingId(null); toast.show("Saved"); }}
          onClose={() => setEditingId(null)}
          onDelete={() => deleteCard(editing.id)}
          onCopy={() => copyCard(editing)}
          onDownload={() => downloadCard(editing)}
          onToast={toast.show}
        />
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={importJSON} />
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
          onClearAll={() => {
            if (confirm("Delete ALL cards and the API key? This cannot be undone.")) {
              setCards([]);
              setSettings({ apiKey: "", chatModel: "gpt-5.4", transcribeModel: "whisper-1" });
              toast.show("Cleared");
              setShowSettings(false);
            }
          }}
        />
      )}

      {/* Off-screen 540px render target for html2canvas. */}
      <div className="render-sandbox" aria-hidden="true">
        {renderTargetCard && (
          <div ref={renderTargetRef}>
            <CardView card={renderTargetCard} />
          </div>
        )}
      </div>

      {toast.msg && <Toast>{toast.msg}</Toast>}
    </div>
  );
}

function Header({ count, online, onAdd, onImport, onSettings }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: INK,
        color: "#F5F1E8",
        borderBottom: "3px solid #000",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: 32,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
            }}
          >
            Rounds<span style={{ color: ACCENT }}>.</span>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {count} card{count === 1 ? "" : "s"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <OnlinePill online={online} />
          <HeaderBtn onClick={onImport} icon={<FileJson size={16} />}>JSON</HeaderBtn>
          <HeaderBtn onClick={onSettings} icon={<SettingsIcon size={16} />}>Settings</HeaderBtn>
          <HeaderBtn onClick={onAdd} icon={<Plus size={16} />} primary>New card</HeaderBtn>
        </div>
      </div>
    </header>
  );
}

function HeaderBtn({ onClick, icon, children, primary }) {
  return (
    <button
      onClick={onClick}
      className="touch-target"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        border: "2px solid #000",
        background: primary ? ACCENT : "#F5F1E8",
        color: "#0A0A0A",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        boxShadow: "3px 3px 0 #000",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function OnlinePill({ online }) {
  return (
    <div
      title={online ? "Online — voice enabled" : "Offline — voice disabled, copy-PNG still works"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        border: "2px solid " + (online ? "#86EFAC" : "#FF6B6B"),
        color: online ? "#86EFAC" : "#FF6B6B",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        background: "transparent",
      }}
    >
      {online ? <Wifi size={12} /> : <WifiOff size={12} />}
      {online ? "Online" : "Offline"}
    </div>
  );
}

function Toast({ children }) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(24px + env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        padding: "10px 18px",
        background: INK,
        color: "#F5F1E8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.08em",
        zIndex: 200,
        boxShadow: "5px 5px 0 #000",
        border: "2px solid #000",
      }}
    >
      {children}
    </div>
  );
}
