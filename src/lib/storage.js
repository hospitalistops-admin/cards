const CARDS_KEY = "ffc:cards";
const SETTINGS_KEY = "ffc:settings";

const DEFAULT_SETTINGS = {
  apiKey: "",
  chatModel: "gpt-5.4",
  transcribeModel: "whisper-1",
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadCards() {
  const parsed = safeParse(localStorage.getItem(CARDS_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...safeParse(localStorage.getItem(SETTINGS_KEY), {}) };
}

// Debounced writer factory. Returns { save, flush }.
export function makeDebouncedSaver(key, delay = 300) {
  let timer = null;
  let latest = null;
  const write = () => {
    if (latest !== null) localStorage.setItem(key, JSON.stringify(latest));
    timer = null;
  };
  return {
    save(value) {
      latest = value;
      if (timer) clearTimeout(timer);
      timer = setTimeout(write, delay);
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        write();
      }
    },
  };
}

export const cardsSaver = makeDebouncedSaver(CARDS_KEY, 250);
export const settingsSaver = makeDebouncedSaver(SETTINGS_KEY, 200);

export function clearAll() {
  localStorage.removeItem(CARDS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
