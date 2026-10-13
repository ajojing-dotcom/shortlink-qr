# Pendek.in — Shortlink & QR

Aplikasi shortlink + generator kode QR yang bisa dipakai dengan dua cara:

- **Tanpa login.** Siapa saja bisa langsung membuat shortlink dan QR di beranda. Link aktif 90 hari dan bisa dikelola lewat link kelola pribadi.
- **Dengan login.** Pemilik masuk dengan kata sandi untuk membuat link permanen, mengganti tujuan link, melihat statistik lengkap, dan mengelola semua link, termasuk link tamu.

Mode tamu bisa dimatikan dengan `PUBLIC_MODE=off`.

> Nama "Pendek.in" hanya nama sementara — nantinya cukup diganti di satu file konfigurasi (`config/site.ts`).

## Status

Tahap **desain & spesifikasi**. Kode aplikasi belum dibuat.

| Isi repo | Keterangan |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | Spesifikasi fitur, data, rute, dan keamanan |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Token desain (warna, huruf, ukuran) dan daftar layar |
| [`design/`](design/) | File desain per layar (`.dc.html`) dari kanvas desain |
| [`.env.example`](.env.example) | Variabel lingkungan yang dibutuhkan saat deploy |

## Rencana teknologi

- **Next.js** (App Router) + TypeScript, deploy di **Vercel**
- **Upstash Redis** (integrasi Vercel Marketplace) untuk data link & statistik klik
- **qr-code-styling** untuk QR di sisi browser (PNG & SVG)
- Tailwind CSS, mode terang & gelap

## Variabel lingkungan

| Nama | Isi |
|---|---|
| `ADMIN_PASSWORD` | Kata sandi untuk masuk ke halaman admin |
| `SESSION_SECRET` | Teks acak minimal 32 karakter untuk menandatangani cookie sesi |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Otomatis terisi saat Upstash Redis disambungkan di Vercel |
| `PUBLIC_MODE` | `on` / `off`: mengizinkan pembuatan link tanpa login |
| `GUEST_LINK_DAYS`, `GUEST_RATE_LIMIT`, `BLOCKED_DOMAINS` | Aturan link tamu (lihat `docs/SPEC.md` §1a) |
| `GOOGLE_SAFE_BROWSING_KEY`, `TURNSTILE_SECRET` | Opsional, pengaman tambahan dari link jahat dan spam |

## Langkah berikutnya

1. Tinjau desain di kanvas, beri catatan perubahan.
2. Bangun aplikasi dari repo ini (v0 / Claude) mengikuti `docs/SPEC.md` dan `docs/DESIGN.md`.
3. Sambungkan Upstash Redis di Vercel, isi `ADMIN_PASSWORD` & `SESSION_SECRET`, lalu deploy.
