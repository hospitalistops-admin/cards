import html2canvas from "html2canvas";

async function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }
}

export async function renderNodeToBlob(el) {
  await waitForFonts();
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: null,
    useCORS: true,
    logging: false,
  });
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function copyNodeAsPng(el) {
  const blob = await renderNodeToBlob(el);
  if (!blob) throw new Error("Render failed");
  // Safari requires ClipboardItem. Some older browsers don't support it.
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Clipboard image write not supported here — use Download.");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export async function downloadNodeAsPng(el, filename) {
  const blob = await renderNodeToBlob(el);
  if (!blob) throw new Error("Render failed");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `card-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
