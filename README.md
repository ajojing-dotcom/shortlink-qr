# KlikAja — Shortlink & QR

Aplikasi shortlink + generator kode QR untuk pemakaian internal. Hanya pemilik yang bisa membuat dan mengelola link (login dengan satu kata sandi). Link pendek dan QR-nya bisa dibuka siapa saja, jadi aman dibagikan ke masyarakat.

> Rencana domain: **klikaja.my.id** (contoh link: `klikaja.my.id/daftar-lomba`). Nama dan domain disimpan di satu file konfigurasi (`config/site.ts`) sehingga mudah diganti. Sebelum domain terpasang, aplikasi tetap jalan di alamat `*.vercel.app`.
>
> Memasang domain: beli `klikaja.my.id` (domain .my.id khusus perorangan WNI, daftar dengan KTP di registrar PANDI), lalu di Vercel buka **Project → Settings → Domains → Add**, dan isi DNS sesuai petunjuk Vercel (record `A` ke `76.76.21.21`, atau ganti nameserver ke Vercel).

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
## Langkah berikutnya

1. Tinjau desain di kanvas, beri catatan perubahan.
2. Bangun aplikasi dari repo ini (v0 / Claude) mengikuti `docs/SPEC.md` dan `docs/DESIGN.md`.
3. Sambungkan Upstash Redis di Vercel, isi `ADMIN_PASSWORD` & `SESSION_SECRET`, lalu deploy.
