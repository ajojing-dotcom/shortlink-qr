"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LinkDTO } from "@/lib/api";
import { DEFAULT_STYLE, downloadBlob, exportPng, exportSvg, safeName } from "@/lib/qr";
import { GigiBalang } from "./Brand";
import { IconCheck, IconCopy, IconDownload, IconEdit, IconPower, IconQr, IconSearch, IconTrash } from "./Icons";
import QrView from "./QrView";
import { copyText, useToast } from "./Toast";

const STATUS_LABEL = { aktif: "Aktif", nonaktif: "Nonaktif", kedaluwarsa: "Kedaluwarsa" } as const;
const fmtDate = (t: number | null) =>
  t ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(t) : "—";
const toDateInput = (t: number | null) =>
  t ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(t) : "";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Sesi habis, silakan login lagi.");
  }
  if (!res.ok) throw Object.assign(new Error(body.error ?? "Gagal."), { field: body.field });
  return body as T;
}

export default function Dashboard({ initial, origin }: { initial: LinkDTO[]; origin: string }) {
  const router = useRouter();
  const host = origin.replace(/^https?:\/\//, "");
  const [links, setLinks] = useState(initial);
  const [last, setLast] = useState<LinkDTO | null>(null);
  const { toast, node: toastNode } = useToast();
  useEffect(() => setLinks(initial), [initial]);

  const short = (slug: string) => `${origin}/${slug}`;
  const copy = async (slug: string) => {
    await copyText(short(slug));
    toast("Link udah disalin!");
  };

  return (
    <main className="page">
      <div className="page-head">
        <h1>Link aye</h1>
        <p>Bikin link panjang jadi pendek, bagiin, terus pantau udah berapa kali diklik.</p>
      </div>

      <div className="grid-2">
        <CreateForm
          host={host}
          onCreated={(l) => {
            setLast(l);
            setLinks((xs) => [l, ...xs]);
            router.refresh();
          }}
        />
        <ResultCard link={last} origin={origin} onCopy={copy} />
      </div>

      <LinkList
        links={links}
        origin={origin}
        onCopy={copy}
        toast={toast}
        onChanged={(slug, l) => {
          setLinks((xs) => (l ? xs.map((x) => (x.slug === slug ? l : x)) : xs.filter((x) => x.slug !== slug)));
          if (last?.slug === slug) setLast(l);
          router.refresh();
        }}
      />
      {toastNode}
    </main>
  );
}

// ---------- form buat ----------

function CreateForm({ host, onCreated }: { host: string; onCreated: (l: LinkDTO) => void }) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [exp, setExp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg: string; field?: string } | null>(null);
  const [check, setCheck] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const s = slug.trim();
    if (!s) return setCheck(null);
    const t = setTimeout(async () => {
      try {
        const r = await api<{ available: boolean; message: string }>(`/api/admin/slug?s=${encodeURIComponent(s)}`);
        setCheck({ ok: r.available, msg: r.message });
      } catch {
        setCheck(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { link } = await api<{ link: LinkDTO }>("/api/admin/links", {
        method: "POST",
        body: JSON.stringify({ url, slug: slug.trim() || undefined, title, expiresAt: exp || null }),
      });
      onCreated(link);
      setUrl("");
      setSlug("");
      setTitle("");
      setExp("");
      setCheck(null);
    } catch (e) {
      const x = e as Error & { field?: string };
      setErr({ msg: x.message, field: x.field });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card stack" aria-labelledby="buat" noValidate>
      <h2 id="buat">Bikin shortlink</h2>
      <div className="field">
        <label htmlFor="url">Link panjang</label>
        <input id="url" type="url" inputMode="url" className="input" placeholder="https://…" value={url}
          onChange={(e) => setUrl(e.target.value)} required aria-invalid={err?.field === "url"} />
      </div>
      <div className="field">
        <label htmlFor="slug">Nama link <span className="muted" style={{ fontWeight: 400 }}>(boleh kosong, nanti diacak)</span></label>
        <div className="prefixed">
          <span>{host}/</span>
          <input id="slug" type="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} aria-invalid={err?.field === "slug"} />
        </div>
        {check ? (check.ok ? <span className="hint-ok"><IconCheck />{check.msg}</span> : <span className="hint-bad">{check.msg}</span>) : null}
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor="judul">Judul</label>
          <input id="judul" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Misal: Formulir NIB" />
        </div>
        <div className="field">
          <label htmlFor="exp">Kedaluwarsa</label>
          <input id="exp" type="date" className="input" value={exp} onChange={(e) => setExp(e.target.value)} />
          <small>Kosongin kalau kagak ada batas.</small>
        </div>
      </div>
      {err ? <p role="alert" className="alert">{err.msg}</p> : null}
      <button type="submit" className="btn btn-primary btn-big" disabled={busy}>{busy ? "Lagi dibikin…" : "Pendekin, nyok!"}</button>
    </form>
  );
}

// ---------- kartu hasil ----------

function ResultCard({ link, origin, onCopy }: { link: LinkDTO | null; origin: string; onCopy: (s: string) => void }) {
  const host = origin.replace(/^https?:\/\//, "");
  const full = link ? `${origin}/${link.slug}` : "";
  const dl = async (ext: "png" | "svg") => {
    if (!link) return;
    const name = `qr-${safeName(host + "-" + link.slug)}.${ext}`;
    if (ext === "png") downloadBlob(await exportPng(full, DEFAULT_STYLE, 1024), name);
    else downloadBlob(new Blob([await exportSvg(full, DEFAULT_STYLE, 1024)], { type: "image/svg+xml" }), name);
  };
  return (
    <section aria-labelledby="hasil" className="hero">
      <div className="hero-gigi"><GigiBalang id="gb-hasil" color="#f2b705" /></div>
      <div className="hero-body">
        <h2 id="hasil">{link ? "Udah jadi, tinggal bagiin" : "Hasilnya nongol di mari"}</h2>
        {link ? (
          <>
            <p className="hero-url"><span>{host}/</span><mark>{link.slug}</mark></p>
            <p className="hero-target" title={link.targetUrl}>→ {link.targetUrl.replace(/^https?:\/\//, "")}</p>
            <div className="row">
              <button type="button" className="btn btn-white" onClick={() => onCopy(link.slug)}><IconCopy />Salin</button>
              <Link className="btn btn-on-dark" href={`/admin/qr?d=${encodeURIComponent(full)}`}>Atur QR</Link>
              <Link className="btn btn-on-dark" href={`/admin/link/${link.slug}`}>Lihat detail</Link>
            </div>
          </>
        ) : (
          <p className="hero-empty" style={{ margin: 0 }}>Isi form di samping, terus klik <b>Pendekin, nyok!</b> Shortlink sama QR-nya langsung muncul di sini.</p>
        )}
      </div>
      {link ? (
        <div className="qr-box">
          <div className="qr-frame"><QrView data={full} size={148} /></div>
          <div className="row" style={{ justifyContent: "center", gap: 6 }}>
            <button type="button" className="btn btn-sm btn-on-dark" onClick={() => dl("png")}>PNG</button>
            <button type="button" className="btn btn-sm btn-on-dark" onClick={() => dl("svg")}>SVG</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ---------- daftar ----------

function LinkList({ links, origin, onCopy, onChanged, toast }: {
  links: LinkDTO[];
  origin: string;
  onCopy: (s: string) => void;
  onChanged: (slug: string, l: LinkDTO | null) => void;
  toast: (m: string) => void;
}) {
  const host = origin.replace(/^https?:\/\//, "");
  const [q, setQ] = useState("");
  const [qrFor, setQrFor] = useState<LinkDTO | null>(null);
  const [editFor, setEditFor] = useState<LinkDTO | null>(null);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return links;
    return links.filter((l) => [l.title, l.slug, l.targetUrl].some((v) => v.toLowerCase().includes(s)));
  }, [links, q]);

  const toggle = async (l: LinkDTO) => {
    try {
      const { link } = await api<{ link: LinkDTO }>(`/api/admin/links/${l.slug}`, { method: "PATCH", body: JSON.stringify({ active: !l.active }) });
      onChanged(l.slug, link);
      toast(link.active ? "Link diaktifin lagi." : "Link dimatiin dulu.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const remove = async (l: LinkDTO) => {
    if (!window.confirm(`Hapus ${host}/${l.slug}? Link ini bakal kagak bisa dibuka lagi dan statistiknya ikut kehapus.`)) return;
    try {
      await api(`/api/admin/links/${l.slug}`, { method: "DELETE" });
      onChanged(l.slug, null);
      toast("Link udah dihapus.");
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const Actions = ({ l }: { l: LinkDTO }) => (
    <div className="actions">
      <button type="button" className="icon-btn" aria-label={`Salin ${l.slug}`} title="Salin" onClick={() => onCopy(l.slug)}><IconCopy /></button>
      <button type="button" className="icon-btn" aria-label={`QR ${l.slug}`} title="Lihat QR" onClick={() => setQrFor(l)}><IconQr /></button>
      <button type="button" className="icon-btn" aria-label={`Edit ${l.slug}`} title="Edit" onClick={() => setEditFor(l)}><IconEdit /></button>
      <button type="button" className="icon-btn" aria-label={l.active ? `Nonaktifkan ${l.slug}` : `Aktifkan ${l.slug}`} title={l.active ? "Nonaktifkan" : "Aktifkan"} onClick={() => toggle(l)}><IconPower /></button>
      <button type="button" className="icon-btn danger" aria-label={`Hapus ${l.slug}`} title="Hapus" onClick={() => remove(l)}><IconTrash /></button>
    </div>
  );

  return (
    <section aria-labelledby="daftar" className="card list">
      <div className="list-head">
        <h2 id="daftar">Daftar link <span className="muted" style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 500 }}>· {links.length} link</span></h2>
        <div className="row">
          <label className="search">
            <IconSearch />
            <span className="sr-only">Cari link</span>
            <input type="search" placeholder="Cari judul atau link" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <a className="btn" href="/api/admin/export" download><IconDownload />Ekspor CSV</a>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="empty">{links.length ? "Kagak ada link yang cocok." : "Belum ada link. Bikin yang pertama di atas, nyok!"}</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="links">
              <thead>
                <tr><th>Link</th><th>Tujuan</th><th style={{ textAlign: "right" }}>Klik</th><th>Dibuat</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.slug}>
                    <td>
                      <Link className="l-title" href={`/admin/link/${l.slug}`}>{l.title || l.slug}</Link>
                      <span className="l-slug">{host}/{l.slug}</span>
                    </td>
                    <td className="l-target" title={l.targetUrl}>{l.targetUrl.replace(/^https?:\/\//, "")}</td>
                    <td className="num">{l.clicks.toLocaleString("id-ID")}</td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                    <td><span className={`badge ${l.status}`}>{STATUS_LABEL[l.status]}</span></td>
                    <td><Actions l={l} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cards">
            {shown.map((l) => (
              <article key={l.slug} className="lcard">
                <div className="lcard-body">
                  <Link className="l-title" href={`/admin/link/${l.slug}`}>{l.title || l.slug}</Link>
                  <div className="l-slug">{host}/{l.slug}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{l.clicks.toLocaleString("id-ID")} klik · {STATUS_LABEL[l.status]}</div>
                </div>
                <button type="button" className="icon-btn" aria-label={`Salin ${l.slug}`} onClick={() => onCopy(l.slug)}><IconCopy /></button>
                <button type="button" className="icon-btn" aria-label={`QR ${l.slug}`} onClick={() => setQrFor(l)}><IconQr /></button>
                <button type="button" className="icon-btn" aria-label={`Edit ${l.slug}`} onClick={() => setEditFor(l)}><IconEdit /></button>
              </article>
            ))}
          </div>
        </>
      )}

      {qrFor ? <QrDialog link={qrFor} origin={origin} onClose={() => setQrFor(null)} /> : null}
      {editFor ? (
        <EditDialog
          link={editFor}
          host={host}
          onClose={() => setEditFor(null)}
          onSaved={(old, l) => {
            onChanged(old, l);
            setEditFor(null);
            toast("Perubahan udah disimpen.");
          }}
          onDelete={() => {
            const l = editFor;
            setEditFor(null);
            remove(l);
          }}
          onToggle={() => {
            const l = editFor;
            setEditFor(null);
            toggle(l);
          }}
        />
      ) : null}
    </section>
  );
}

function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const close = () => cb.current();
    d.addEventListener("close", close);
    return () => d.removeEventListener("close", close);
  }, []);
  return ref;
}

function QrDialog({ link, origin, onClose }: { link: LinkDTO; origin: string; onClose: () => void }) {
  const ref = useDialog(onClose);
  const full = `${origin}/${link.slug}`;
  const host = origin.replace(/^https?:\/\//, "");
  return (
    <dialog ref={ref} aria-labelledby="qr-title">
      <div className="dlg" style={{ alignItems: "center", textAlign: "center" }}>
        <h2 id="qr-title" style={{ fontSize: 22 }}>{link.title || link.slug}</h2>
        <div className="qr-frame" style={{ border: "1px solid var(--line)" }}><QrView data={full} size={220} /></div>
        <p className="l-slug" style={{ margin: 0, fontSize: 15 }}>{host}/{link.slug}</p>
        <div className="dlg-foot" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primary" onClick={async () => downloadBlob(await exportPng(full, DEFAULT_STYLE, 1024), `qr-${safeName(host + "-" + link.slug)}.png`)}>Unduh PNG</button>
          <Link className="btn" href={`/admin/qr?d=${encodeURIComponent(full)}`}>Atur QR</Link>
          <button type="button" className="btn" onClick={() => ref.current?.close()}>Tutup</button>
        </div>
      </div>
    </dialog>
  );
}

function EditDialog({ link, host, onClose, onSaved, onDelete, onToggle }: {
  link: LinkDTO; host: string; onClose: () => void; onSaved: (old: string, l: LinkDTO) => void; onDelete: () => void; onToggle: () => void;
}) {
  const ref = useDialog(onClose);
  const [url, setUrl] = useState(link.targetUrl);
  const [slug, setSlug] = useState(link.slug);
  const [title, setTitle] = useState(link.title);
  const [exp, setExp] = useState(toDateInput(link.expiresAt));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { link: l } = await api<{ link: LinkDTO }>(`/api/admin/links/${link.slug}`, {
        method: "PATCH",
        body: JSON.stringify({ url, slug, title, expiresAt: exp || null }),
      });
      onSaved(link.slug, l);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="edit-title">
      <form className="dlg" onSubmit={save}>
        <h2 id="edit-title" style={{ fontSize: 22 }}>Edit link</h2>
        <div className="field">
          <label htmlFor="e-url">Link tujuan</label>
          <input id="e-url" className="input" value={url} onChange={(e) => setUrl(e.target.value)} />
          <small>QR yang udah dicetak ikut pindah ke tujuan baru.</small>
        </div>
        <div className="field">
          <label htmlFor="e-slug">Nama link</label>
          <div className="prefixed"><span>{host}/</span><input id="e-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></div>
          {slug !== link.slug ? <small style={{ color: "var(--warn)" }}>Awas: link & QR lama ({link.slug}) bakal kagak jalan lagi.</small> : null}
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="e-title">Judul</label>
            <input id="e-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="e-exp">Kedaluwarsa</label>
            <input id="e-exp" type="date" className="input" value={exp} onChange={(e) => setExp(e.target.value)} />
          </div>
        </div>
        {err ? <p role="alert" className="alert">{err}</p> : null}
        <div className="dlg-foot" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <button type="button" className="btn" onClick={onToggle}>{link.active ? "Nonaktifkan" : "Aktifkan"}</button>
            <button type="button" className="btn" style={{ color: "var(--danger)" }} onClick={onDelete}>Hapus</button>
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => ref.current?.close()}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Nyimpen…" : "Simpan"}</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
