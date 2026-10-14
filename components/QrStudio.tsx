"use client";

import { useState } from "react";
import { DEFAULT_STYLE, copyPng, downloadBlob, exportPng, exportSvg, safeName, type CornerStyle, type DotStyle, type Ecc, type QrStyle } from "@/lib/qr";
import { IconImage } from "./Icons";
import QrView from "./QrView";
import { useToast } from "./Toast";

const FG = [
  { hex: "#2b1a12", label: "Coklat tua" },
  { hex: "#b3202a", label: "Merah ondel-ondel" },
  { hex: "#0e6b47", label: "Hijau Betawi" },
  { hex: "#000000", label: "Hitam" },
];
const BG = [
  { hex: "#ffffff", label: "Putih" },
  { hex: "#fbf4e6", label: "Krem" },
  { hex: "#f2b705", label: "Kuning emas" },
  { hex: "#fbe3d6", label: "Merah muda" },
];

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <div role="group" aria-label={label} className="seg">
        {options.map((o) => (
          <button key={o.v} type="button" aria-pressed={o.v === value} onClick={() => onChange(o.v)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function Swatches({ label, value, list, onChange }: { label: string; value: string; list: { hex: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }} className="field">
      <legend className="label" style={{ padding: 0, marginBottom: 8 }}>{label}</legend>
      <div className="swatches">
        {list.map((s) => (
          <button key={s.hex} type="button" className="swatch" aria-label={s.label} title={s.label} aria-pressed={value.toLowerCase() === s.hex} style={{ background: s.hex }} onClick={() => onChange(s.hex)} />
        ))}
        <label title="Warna lain" style={{ position: "relative" }}>
          <span className="sr-only">{label} lain</span>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="swatch-custom" />
        </label>
      </div>
      <span className="mono muted" style={{ fontSize: 13 }}>{value}</span>
    </fieldset>
  );
}

export default function QrStudio({ initialData, links }: { initialData: string; links: { label: string; url: string }[] }) {
  const [data, setData] = useState(initialData);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);
  const [size, setSize] = useState(1024);
  const [caption, setCaption] = useState("Scan di mari, nyok!");
  const [busy, setBusy] = useState(false);
  const { toast, node } = useToast();
  const set = (p: Partial<QrStyle>) => setStyle((s) => ({ ...s, ...p }));
  const ecc = style.logo ? "H" : style.ecc;
  const name = `qr-${safeName(data)}`;

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 1024 * 1024) return toast("Logo kegedean, maksimal 1 MB.");
    const url = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    });
    set({ logo: url });
  }

  async function run(fn: () => Promise<void>) {
    if (!data.trim()) return toast("Isi dulu link atau tulisannya, Bang.");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page" style={{ gap: 24 }}>
      <div className="page-head">
        <h1>QR Generator</h1>
        <p>Bikin kode QR buat shortlink atau tulisan apa aje. Hasilnya langsung keliatan.</p>
      </div>

      <div className="studio">
        <section aria-label="Pengaturan QR" className="card stack studio-opts" style={{ gap: 22 }}>
          <div className="field">
            <label htmlFor="isi">Isi QR (link atau tulisan)</label>
            <input id="isi" className="input mono" style={{ fontSize: 14 }} value={data} onChange={(e) => setData(e.target.value)} placeholder="https://…" />
            {links.length ? (
              <select className="input" aria-label="Pilih dari daftar link" value="" onChange={(e) => e.target.value && setData(e.target.value)}>
                <option value="">Atau pilih dari daftar link…</option>
                {links.map((l) => <option key={l.url} value={l.url}>{l.label}</option>)}
              </select>
            ) : null}
          </div>

          <div className="two" style={{ gap: 18 }}>
            <Swatches label="Warna titik" value={style.fg} list={FG} onChange={(fg) => set({ fg })} />
            <Swatches label="Warna latar" value={style.bg} list={BG} onChange={(bg) => set({ bg })} />
          </div>

          <div className="two" style={{ gap: 18 }}>
            <Seg<DotStyle> label="Gaya titik" value={style.dot} onChange={(dot) => set({ dot })}
              options={[{ v: "kotak", label: "Kotak" }, { v: "bulat", label: "Bulat" }, { v: "halus", label: "Halus" }]} />
            <Seg<CornerStyle> label="Gaya sudut" value={style.corner} onChange={(corner) => set({ corner })}
              options={[{ v: "kotak", label: "Kotak" }, { v: "bulat", label: "Bulat" }]} />
          </div>

          <div className="two" style={{ gap: 18 }}>
            <div className="stack" style={{ gap: 6 }}>
              <Seg<Ecc> label="Koreksi kesalahan" value={ecc} onChange={(e) => !style.logo && set({ ecc: e })}
                options={[{ v: "L", label: "L" }, { v: "M", label: "M" }, { v: "Q", label: "Q" }, { v: "H", label: "H" }]} />
              <small className="muted" style={{ fontSize: 13 }}>{style.logo ? "Otomatis H karena pakai logo" : "M udah cukup buat kebanyakan keperluan"}</small>
            </div>
            <div className="field">
              <label htmlFor="ukuran">Ukuran unduhan</label>
              <input id="ukuran" type="range" min={256} max={2048} step={128} value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ accentColor: "var(--merah)", height: 40 }} />
              <small>{size} × {size} px</small>
            </div>
          </div>

          <div className="field">
            <label htmlFor="margin">Margin</label>
            <input id="margin" type="range" min={0} max={40} step={2} value={style.margin} onChange={(e) => set({ margin: Number(e.target.value) })} style={{ accentColor: "var(--merah)", height: 32 }} />
          </div>

          <div className="logo-row">
            <div className="row" style={{ gap: 12 }}>
              <span style={{ width: 44, height: 44, borderRadius: 10, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {style.logo ? <img src={style.logo} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} /> : <IconImage />}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Logo di tengah</div>
                <div className="muted" style={{ fontSize: 13 }}>PNG/JPG/SVG, maks 1 MB</div>
              </div>
            </div>
            {style.logo ? (
              <button type="button" className="btn" onClick={() => set({ logo: null })}>Hapus logo</button>
            ) : (
              <label className="btn" style={{ cursor: "pointer" }}>
                Unggah logo
                <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={onLogo} />
              </label>
            )}
          </div>

          <div className="field">
            <label htmlFor="ket">Tulisan di bawah QR <span className="muted" style={{ fontWeight: 400 }}>(boleh kosong)</span></label>
            <input id="ket" className="input" value={caption} maxLength={60} onChange={(e) => setCaption(e.target.value)} />
          </div>
        </section>

        <section aria-label="Pratinjau" className="card studio-prev">
          <div className="row" style={{ alignSelf: "stretch", justifyContent: "space-between" }}>
            <span className="label muted" style={{ fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase" }}>Pratinjau</span>
            <span className="muted" style={{ fontSize: 13 }}>ECC {ecc}</span>
          </div>
          <div className="qr-stage" style={{ background: style.bg }}>
            <QrView data={data || " "} style={style} size={300} />
            {caption.trim() ? <div className="qr-caption" style={{ color: style.fg }}>{caption}</div> : null}
          </div>
          <div className="row" style={{ alignSelf: "stretch" }}>
            <button type="button" className="btn btn-primary" style={{ flex: "1 1 120px", height: 48 }} disabled={busy}
              onClick={() => run(async () => downloadBlob(await exportPng(data, style, size, caption), `${name}.png`))}>Unduh PNG</button>
            <button type="button" className="btn" style={{ flex: "1 1 100px", height: 48 }} disabled={busy}
              onClick={() => run(async () => downloadBlob(new Blob([await exportSvg(data, style, size, caption)], { type: "image/svg+xml" }), `${name}.svg`))}>Unduh SVG</button>
            <button type="button" className="btn" style={{ flex: "1 1 100px", height: 48 }} disabled={busy}
              onClick={() => run(async () => { await copyPng(await exportPng(data, style, size, caption)); toast("Gambar QR udah disalin!"); })}>Salin gambar</button>
          </div>
        </section>
      </div>
      {node}
    </main>
  );
}
