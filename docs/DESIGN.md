# Desain — KlikAja

Tampilan netral, bersih, fokus pada link. Satu warna aksen biru, latar abu dingin, kartu putih, dan satu kartu gelap untuk hasil shortlink supaya langsung terlihat.

## Warna

| Token | Terang | Gelap (usulan) | Dipakai untuk |
|---|---|---|---|
| `--bg` | `#F2F3F5` | `#0E1013` | Latar halaman |
| `--surface` | `#FFFFFF` | `#171A1F` | Kartu, header |
| `--ink` | `#14161A` | `#F2F3F5` | Teks utama |
| `--muted` | `#5B6270` | `#9AA1AD` | Teks sekunder |
| `--line` | `#E2E5EA` | `#2A2F37` | Garis kartu |
| `--field` | `#D3D7DE` | `#3A3F49` | Garis input |
| `--accent` | `#3B4CF5` | `#6B78FF` | Tombol utama, link, grafik |
| `--accent-soft` | `#EEF0FF` | `#1E2250` | Menu aktif |
| `--accent-ink` | `#2733C2` | `#AEB6FB` | Teks shortlink |
| `--highlight` | `#D9F99D` | `#D9F99D` | Sorotan slug di kartu hasil |
| `--ok` / `--ok-bg` | `#157F3D` / `#E6F4EA` | | Status Aktif |
| `--warn` / `--warn-bg` | `#8A5A00` / `#FFF4E0` | | Status Kedaluwarsa |
| `--danger` / `--danger-bg` | `#B42318` / `#FDECEA` | | Hapus, error |
| `--hero` | `#14161A` | `#14161A` | Kartu hasil shortlink |

## Huruf (Google Fonts)

- **Bricolage Grotesque** 700 — judul (34 / 28 / 21 / 20 px, letter-spacing −0.02em)
- **Instrument Sans** 400/500/600 — teks (15 px, label 14 px, kecil 13 px)
- **JetBrains Mono** 400/500 — shortlink, slug, kode warna

## Bentuk & ukuran

- Radius: kartu 18 px, input/tombol 11–12 px, chip status 999 px
- Tinggi input 46 px, tombol utama 50 px, tombol ikon 38–44 px (target sentuh ≥ 44 px di HP)
- Lebar konten maks 1200 px, padding 32 px (16 px di HP)
- Ikon: garis (stroke 2 px), bukan emoji

## Layar (folder `design/`)

| File | Layar |
|---|---|
| `Main.dc.html` | Dashboard `/admin`: form buat, kartu hasil + QR, tabel daftar link |
| `QR.dc.html` | QR generator `/admin/qr` (interaktif: warna, gaya, logo, keterangan) |
| `Detail.dc.html` | Detail link: angka ringkas, grafik 30 hari, perangkat & sumber |
| `Mobile.dc.html` | Dashboard versi HP (390 px) dengan menu bawah |
| `Login.dc.html` | Halaman masuk + pesan salah sandi |
| `NotFound.dc.html` | 404 untuk link tidak ditemukan / nonaktif |

Di HP: tabel daftar link berubah jadi kartu, menu atas jadi menu bawah (Link, QR).
