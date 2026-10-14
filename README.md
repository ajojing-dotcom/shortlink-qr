# KlikAje — Shortlink & QR

Aplikasi shortlink + generator kode QR ala Betawi, dengan dua cara pakai:

- **Tanpa login (tamu)**: siapa saja bisa bikin shortlink + QR di beranda. Link aktif 90 hari dan dikelola lewat *link kelola* pribadi. Ada batas pembuatan per IP, cek link jahat, dan tombol lapor.
- **Dengan login (pemilik)**: link permanen, ganti tujuan, statistik lengkap, kelola semua link (termasuk link tamu) dan laporan.

Mode tamu bisa dimatikan dengan `PUBLIC_MODE=off`.

> Rencana domain: **klikaje.my.id** (contoh link: `klikaje.my.id/daftar-lomba`). Nama dan domain disimpan di satu file konfigurasi (`config/site.ts`) sehingga mudah diganti. Sebelum domain terpasang, aplikasi tetap jalan di alamat `*.vercel.app`.
>
> Memasang domain: beli `klikaje.my.id` (domain .my.id khusus perorangan WNI, daftar dengan KTP di registrar PANDI), lalu di Vercel buka **Project → Settings → Domains → Add**, dan isi DNS sesuai petunjuk Vercel (record `A` ke `76.76.21.21`, atau ganti nameserver ke Vercel).

## Status

Aplikasi sudah jalan di Vercel (proyek **klikaje** → klikaje.vercel.app). Repo ini public supaya deploy otomatis jalan di paket Hobby Vercel; semua rahasia (kata sandi, kunci database) disimpan di Environment Variables Vercel, bukan di repo.

| Isi repo | Keterangan |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | Spesifikasi fitur, data, rute, dan keamanan |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Token desain (warna, huruf, ukuran) dan daftar layar |
| [`design/`](design/) | File desain per layar (`.dc.html`) dari kanvas desain |
| [`.env.example`](.env.example) | Variabel lingkungan yang dibutuhkan saat deploy |
| `app/`, `components/`, `lib/` | Kode aplikasi |
| [`config/site.ts`](config/site.ts) | Nama aplikasi & domain |

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
| `PUBLIC_MODE` | `on` (bawaan) / `off` — izinkan bikin link tanpa login |
| `GUEST_LINK_DAYS`, `GUEST_RATE_LIMIT`, `BLOCKED_DOMAINS` | Aturan link tamu (opsional; bawaan 90 hari, 10/jam & 30/hari) |
| `GOOGLE_SAFE_BROWSING_KEY` | Opsional, cek link jahat ke Google |

## Deploy pertama kali (sekali saja)

1. **Vercel → Add New → Project → Import** repo `shortlink-qr` dari GitHub. Framework otomatis terdeteksi Next.js; klik **Deploy**.
2. Di proyek Vercel: **Storage → Create / Connect → Upstash (Redis)** → sambungkan ke proyek. `KV_REST_API_URL` & `KV_REST_API_TOKEN` terisi otomatis.
3. **Settings → Environment Variables**, tambah:
   - `ADMIN_PASSWORD` — kata sandi login Abang
   - `SESSION_SECRET` — teks acak ≥ 32 karakter (misal hasil `openssl rand -base64 32`, atau ketik acak panjang)
4. **Deployments → Redeploy** supaya variabel baru terbaca.
5. Buka alamat `….vercel.app` → login → bikin link pertama.
6. (Nanti) **Settings → Domains → Add** `klikaje.my.id` dan atur DNS sesuai petunjuk Vercel.

## Jalankan di komputer (opsional)

```bash
npm install
npm run dev   # http://localhost:3000 — tanpa Redis memakai memori sementara
```

## Alur kerja

```
Claude  ──(commit & push otomatis)──▶  GitHub (repo ini)  ──(import)──▶  v0 / Vercel
```

- Semua perubahan (fitur, desain, perbaikan) dikerjakan di Claude. Claude yang commit dan push ke branch `main`.
- v0 / Vercel hanya **mengimpor dari GitHub**. Jangan edit kode di v0, supaya repo tetap jadi satu-satunya sumber.
- Vercel yang tersambung ke repo ini otomatis deploy ulang setiap ada push ke `main`.
