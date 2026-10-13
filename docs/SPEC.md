# Spesifikasi — Pendek.in

Semua teks antarmuka berbahasa Indonesia.

## 0. Dua cara pakai

| | Tanpa login (tamu) | Dengan login (pemilik) |
|---|---|---|
| Buat shortlink | Ya, dari beranda `/` | Ya, dari `/admin` |
| Nama link sendiri | Ya, min. 4 karakter | Ya, min. 2 karakter |
| Masa aktif | 90 hari (`GUEST_LINK_DAYS`) | Permanen atau tanggal pilihan sendiri |
| Ganti URL tujuan | Tidak | Ya |
| Statistik | Jumlah klik (lewat link kelola) | Lengkap: 30 hari, perangkat, sumber |
| Daftar link | Di browser ini saja (localStorage) | Semua link, termasuk link tamu |
| Hapus link | Ya, lewat link kelola | Ya, semua link |
| QR Generator | Ya, semua fitur | Ya, semua fitur |

Mode tamu bisa dimatikan dengan `PUBLIC_MODE=off`. Kalau mati, beranda hanya menampilkan tombol Masuk.

## 1. Rute

| Rute | Akses | Isi |
|---|---|---|
| `/` | Publik | Beranda tamu: form pendekkan, kartu hasil + QR, "Link Anda di perangkat ini" |
| `/qr` | Publik | QR generator untuk teks/URL apa saja |
| `/kelola/[slug]?kunci=...` | Pemegang kunci | Klik & hapus satu link tamu |
| `/[slug]` | Publik | Redirect 302 ke URL tujuan + catat klik |
| `/login` | Publik | Form kata sandi |
| `/admin` | Pemilik | Buat shortlink + daftar semua link |
| `/admin/link/[slug]` | Pemilik | Detail & statistik satu link |
| `/api/public/...` | Publik (dibatasi) | Buat link tamu, cek slug, data link kelola |
| `/api/admin/...` | Pemilik | CRUD, ekspor CSV |

Slug yang dipesan (tidak boleh dipakai): `admin`, `api`, `login`, `logout`, `kelola`, `qr`, `lapor`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`.

## 1a. Aturan mode tamu (anti penyalahgunaan)

Shortlink terbuka sering dipakai untuk menyamarkan link penipuan, jadi mode tamu wajib punya pengaman ini:

- **Batas pembuatan**: 10 link per jam per IP, 30 per hari (`GUEST_RATE_LIMIT`).
- **Cek URL**: tolak `javascript:`, `data:`, IP mentah, shortener lain (bit.ly, s.id, dll.), dan domain di daftar blokir (`BLOCKED_DOMAINS`). Jika `GOOGLE_SAFE_BROWSING_KEY` diisi, URL dicek ke Google Safe Browsing dulu.
- **Kunci kelola**: saat link tamu dibuat, server membuat kunci acak (disimpan sebagai hash). Link kelola hanya ditampilkan sekali dan disimpan juga di localStorage.
- **Lapor**: halaman `/lapor` dan tautan di footer. Laporan masuk ke daftar di `/admin`, dan pemilik bisa menonaktifkan link dengan satu klik.
- Link tamu otomatis nonaktif setelah masa aktif habis (TTL Redis).
- Captcha tidak dipakai dulu. Kalau nanti banyak spam, Cloudflare Turnstile bisa ditambahkan (`TURNSTILE_SECRET`).

## 2. Data (Upstash Redis)

```
link:{slug}        → hash { slug, targetUrl, title, createdAt, clicks, lastClickedAt, active, expiresAt, owner: "admin"|"guest", manageKeyHash, creatorIpHash }
reports            → list laporan { slug, alasan, waktu }
rl:create:{ip}     → hitungan pembuatan link tamu (TTL 1 jam / 1 hari)
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

## 4. Dashboard `/admin`

**Form "Buat shortlink"**
- URL panjang (wajib, hanya `http://`/`https://`; tolak `javascript:`, `data:`, dan URL yang mengarah ke domain aplikasi sendiri).
- Nama link (opsional): huruf kecil, angka, tanda hubung, 2–50 karakter. Cek ketersediaan langsung saat mengetik (debounce 300 ms). Kosong → acak 6 karakter (tanpa huruf mirip seperti 0/O, 1/l).
- Judul (opsional), tanggal kedaluwarsa (opsional).

**Hasil** — kartu gelap: shortlink besar + tombol Salin, URL tujuan, QR kecil dengan unduh PNG/SVG, tombol "Atur QR" dan "Lihat detail".

**Daftar link** — terbaru dulu; cari judul/slug/tujuan; kolom: judul + shortlink, tujuan (dipotong), klik, tanggal dibuat, status (Aktif / Nonaktif / Kedaluwarsa); aksi: salin, QR, edit (tujuan, slug, judul, kedaluwarsa), aktif/nonaktif, hapus (dengan konfirmasi). Tombol **Ekspor CSV**.

## 5. Detail link

Total klik, klik 7 hari terakhir, terakhir diklik; grafik batang klik per hari 30 hari; rincian perangkat dan sumber klik.

## 5a. Beranda tamu `/`

- Judul besar + satu kolom URL + tombol **Pendekkan**; nama link opsional di bawahnya.
- Kartu hasil (sama seperti di admin): shortlink besar, Salin, Atur QR, Bagikan (Web Share API), QR kecil + PNG/SVG, dan kotak **Link kelola**.
- "Link Anda di perangkat ini": daftar dari localStorage, jumlah klik diambil dari server, sisa masa aktif, salin/QR/hapus.
- Tiga kartu perbandingan Tanpa login / Dengan login / Aman dari link jahat, lalu footer berisi "Laporkan link berbahaya".
- Pemilik yang sudah login dan membuka `/` melihat tombol "Ke dashboard". Link yang dibuat dari `/` saat login dicatat sebagai link pemilik.

## 6. QR Generator `/qr` (publik) — juga ditautkan dari `/admin`

- Isi: URL/teks bebas, atau pilih dari daftar link (pilihan ini hanya muncul saat login).
- Warna titik & latar (pilihan cepat + input hex), gaya titik (Kotak / Bulat / Halus), gaya sudut (Kotak / Bulat), koreksi kesalahan L/M/Q/H, ukuran unduhan 256–2048 px, margin.
- Logo di tengah (unggah PNG/SVG ≤ 1 MB) → koreksi kesalahan otomatis **H**.
- Teks keterangan opsional di bawah QR (ikut terunduh).
- Pratinjau langsung; Unduh PNG, Unduh SVG, Salin gambar.

## 7. Keamanan

- Login dengan `ADMIN_PASSWORD` (bandingkan dengan waktu-konstan), sesi berupa cookie httpOnly, Secure, SameSite=Lax, ditandatangani `SESSION_SECRET`, berlaku 30 hari.
- Batasi gagal login: 5 kali per IP → kunci 15 menit.
- Semua rute `/admin` dan `/api/admin` dicek di middleware. `/api/public` hanya boleh membuat link tamu, membaca klik/menghapus link dengan kunci kelola yang benar, dan mengirim laporan.
- Domain di shortlink diambil dari host permintaan, jadi otomatis benar di `*.vercel.app` maupun domain sendiri.
