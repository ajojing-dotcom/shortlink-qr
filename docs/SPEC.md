# Spesifikasi — Pendek.in

Semua teks antarmuka berbahasa Indonesia.

## 0. Cara pakai

- **Pembuat link: hanya pemilik.** Semua fitur pengelolaan ada di balik login dengan satu kata sandi (`ADMIN_PASSWORD`). Tidak ada pendaftaran akun dan tidak ada mode tamu.
- **Pembuka link: siapa saja.** Shortlink dan QR dibagikan ke masyarakat umum, jadi redirect `/[slug]` dan halaman 404 terbuka untuk publik.

## 1. Rute

| Rute | Akses | Isi |
|---|---|---|
| `/` | Publik | Belum login → ke `/login`; sudah login → ke `/admin` |
| `/[slug]` | Publik | Redirect 302 ke URL tujuan + catat klik |
| `/login` | Publik | Form kata sandi |
| `/admin` | Pemilik | Buat shortlink + daftar link |
| `/admin/link/[slug]` | Pemilik | Detail & statistik satu link |
| `/admin/qr` | Pemilik | QR generator untuk teks/URL apa saja |
| `/api/...` | Pemilik | Endpoint CRUD, cek slug, ekspor CSV |

Slug yang dipesan (tidak boleh dipakai): `admin`, `api`, `login`, `logout`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `qr`.

## 2. Data (Upstash Redis)

```
link:{slug}        → hash { slug, targetUrl, title, createdAt, clicks, lastClickedAt, active, expiresAt }
links              → sorted set (score = createdAt) berisi slug, untuk daftar terbaru dulu
clicks:{slug}:{YYYY-MM-DD} → angka klik per hari (TTL 400 hari)
device:{slug}      → hash { mobile, desktop, tablet }
ref:{slug}         → hash { whatsapp, instagram, facebook, langsung, lainnya }
login:fail:{ip}    → hitungan gagal login (TTL 15 menit)
```

## 3. Redirect `/[slug]`

- Ditemukan, aktif, belum kedaluwarsa → 302 ke `targetUrl`, tambah `clicks`, `lastClickedAt`, hitungan harian, perangkat (dari User-Agent), sumber (dari Referer; kosong = "Langsung / QR").
- Tidak ditemukan / nonaktif / kedaluwarsa → halaman 404: "Link tidak ditemukan atau sudah tidak aktif".
- Pencatatan klik tidak boleh memperlambat redirect (pakai `waitUntil` / tanpa await).
- Karena link dibuka masyarakat, ganti tujuan link (edit) langsung berlaku — QR yang sudah tercetak tetap dipakai.

## 4. Dashboard `/admin`

**Form "Buat shortlink"**
- URL panjang (wajib, hanya `http://`/`https://`; tolak `javascript:`, `data:`, dan URL yang mengarah ke domain aplikasi sendiri).
- Nama link (opsional): huruf kecil, angka, tanda hubung, 2–50 karakter. Cek ketersediaan langsung saat mengetik (debounce 300 ms). Kosong → acak 6 karakter (tanpa huruf mirip seperti 0/O, 1/l).
- Judul (opsional), tanggal kedaluwarsa (opsional).

**Hasil** — kartu gelap: shortlink besar + tombol Salin, URL tujuan, QR kecil dengan unduh PNG/SVG, tombol "Atur QR" dan "Lihat detail".

**Daftar link** — terbaru dulu; cari judul/slug/tujuan; kolom: judul + shortlink, tujuan (dipotong), klik, tanggal dibuat, status (Aktif / Nonaktif / Kedaluwarsa); aksi: salin, QR, edit (tujuan, slug, judul, kedaluwarsa), aktif/nonaktif, hapus (dengan konfirmasi). Tombol **Ekspor CSV**.

## 5. Detail link

Total klik, klik 7 hari terakhir, terakhir diklik; grafik batang klik per hari 30 hari; rincian perangkat dan sumber klik.

## 6. QR Generator `/admin/qr`

- Isi: URL/teks bebas, atau pilih dari daftar link.
- Warna titik & latar (pilihan cepat + input hex), gaya titik (Kotak / Bulat / Halus), gaya sudut (Kotak / Bulat), koreksi kesalahan L/M/Q/H, ukuran unduhan 256–2048 px, margin.
- Logo di tengah (unggah PNG/SVG ≤ 1 MB) → koreksi kesalahan otomatis **H**.
- Teks keterangan opsional di bawah QR (ikut terunduh).
- Pratinjau langsung; Unduh PNG, Unduh SVG, Salin gambar.

## 7. Keamanan

- Login dengan `ADMIN_PASSWORD` (bandingkan dengan waktu-konstan), sesi berupa cookie httpOnly, Secure, SameSite=Lax, ditandatangani `SESSION_SECRET`, berlaku 30 hari.
- Batasi gagal login: 5 kali per IP → kunci 15 menit.
- Semua rute `/admin` dan `/api` dicek di middleware; hanya `/[slug]`, `/login`, dan 404 yang terbuka.
- `robots.txt` melarang pengindeksan `/admin` dan `/login`.
- Domain di shortlink diambil dari host permintaan, jadi otomatis benar di `*.vercel.app` maupun domain sendiri.
