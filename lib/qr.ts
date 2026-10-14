"use client";

// Pembuatan QR di browser (qr-code-styling) + ekspor PNG/SVG dengan teks keterangan.
import type QRCodeStylingType from "qr-code-styling";
import type { Options } from "qr-code-styling";

export type DotStyle = "kotak" | "bulat" | "halus";
export type CornerStyle = "kotak" | "bulat";
export type Ecc = "L" | "M" | "Q" | "H";

export interface QrStyle {
  fg: string;
  bg: string;
  dot: DotStyle;
  corner: CornerStyle;
  ecc: Ecc;
  /** margin dalam piksel pada ukuran 300 px; diskalakan untuk ukuran lain */
  margin: number;
  logo?: string | null;
}

export const DEFAULT_STYLE: QrStyle = { fg: "#2b1a12", bg: "#ffffff", dot: "kotak", corner: "bulat", ecc: "M", margin: 12 };

let mod: Promise<typeof QRCodeStylingType> | null = null;
export function loadQr() {
  if (!mod) mod = import("qr-code-styling").then((m) => m.default);
  return mod;
}

export function qrOptions(data: string, style: QrStyle, size: number, type: "canvas" | "svg" = "canvas"): Options {
  const scale = size / 300;
  return {
    type,
    width: size,
    height: size,
    data: data || " ",
    margin: Math.round(style.margin * scale),
    qrOptions: { errorCorrectionLevel: style.logo ? "H" : style.ecc },
    backgroundOptions: { color: style.bg },
    dotsOptions: {
      color: style.fg,
      type: style.dot === "bulat" ? "dots" : style.dot === "halus" ? "rounded" : "square",
    },
    cornersSquareOptions: { color: style.fg, type: style.corner === "bulat" ? "extra-rounded" : "square" },
    cornersDotOptions: { color: style.fg, type: style.corner === "bulat" ? "dot" : "square" },
    image: style.logo || undefined,
    imageOptions: { margin: Math.round(4 * scale), imageSize: 0.3, hideBackgroundDots: true, crossOrigin: "anonymous", saveAsBlob: true },
  };
}

async function rawBlob(data: string, style: QrStyle, size: number, ext: "png" | "svg"): Promise<Blob> {
  const QR = await loadQr();
  const qr = new QR(qrOptions(data, style, size, ext === "svg" ? "svg" : "canvas"));
  const out = await qr.getRawData(ext);
  if (!out) throw new Error("Gagal membuat gambar QR.");
  return out instanceof Blob ? out : new Blob([out as BlobPart], { type: ext === "svg" ? "image/svg+xml" : "image/png" });
}

const CAPTION_FONT = '700 {px}px "Zilla Slab", Georgia, serif';

export async function exportPng(data: string, style: QrStyle, size: number, caption = ""): Promise<Blob> {
  const qrBlob = await rawBlob(data, style, size, "png");
  if (!caption.trim()) return qrBlob;
  const img = await createImageBitmap(qrBlob);
  const fontPx = Math.round(size * 0.07);
  const capH = Math.round(fontPx * 2);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + capH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = style.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, size, size);
  ctx.fillStyle = style.fg;
  ctx.font = CAPTION_FONT.replace("{px}", String(fontPx));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(caption.trim(), size / 2, size + capH / 2 - fontPx * 0.25, size * 0.92);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat PNG."))), "image/png")
  );
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

export async function exportSvg(data: string, style: QrStyle, size: number, caption = ""): Promise<string> {
  const raw = await (await rawBlob(data, style, size, "svg")).text();
  const inner = raw.replace(/<\?xml[^>]*\?>\s*/, "");
  if (!caption.trim()) return `<?xml version="1.0" encoding="UTF-8"?>\n${inner}`;
  const fontPx = Math.round(size * 0.07);
  const capH = Math.round(fontPx * 2);
  const h = size + capH;
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">`,
    `<rect width="${size}" height="${h}" fill="${style.bg}"/>`,
    inner.replace(/<svg\b/, `<svg x="0" y="0"`),
    `<text x="${size / 2}" y="${size + capH / 2}" text-anchor="middle" dominant-baseline="middle" fill="${style.fg}" font-family="Zilla Slab, Georgia, serif" font-weight="700" font-size="${fontPx}">${escapeXml(caption.trim())}</text>`,
    `</svg>`,
  ].join("\n");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function safeName(s: string) {
  return (s.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "qr").toLowerCase();
}

export async function copyPng(blob: Blob) {
  if (!("clipboard" in navigator) || typeof ClipboardItem === "undefined") throw new Error("Browser ini belum bisa menyalin gambar.");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
