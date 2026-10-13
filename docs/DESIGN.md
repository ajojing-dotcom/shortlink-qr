# Desain — KlikAje

Nuansa **Betawi**: merah ondel-ondel, hijau Betawi, dan kuning emas di atas latar krem, dengan hiasan **gigi balang** (deretan segitiga dari lisplang rumah Betawi) di bawah header dan di atas kartu hasil. Teks memakai logat Betawi yang ringan ("Pendekin, nyok!", "Waduh, linknya kagak ketemu!"), tapi label penting tetap jelas.

## Warna

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--bg` | `#FBF4E6` | Latar halaman (krem) |
| `--surface` | `#FFFFFF` | Kartu, header |
| `--ink` | `#2B1A12` | Teks utama (coklat tua) |
| `--muted` | `#6E5A4C` | Teks sekunder |
| `--line` | `#EADCC4` | Garis kartu |
| `--field` | `#D9C6A5` | Garis input |
| `--merah` (aksen) | `#B3202A` | Tombol utama, link, garis header, gigi balang |
| `--merah-tua` | `#8E1B22` | Teks shortlink, hover |
| `--merah-muda` | `#FBE3D6` | Menu aktif |
| `--hijau` | `#0E6B47` | "aja" di logo, status Aktif |
| `--hijau-tua` | `#0F3D2E` | Kartu hasil shortlink |
| `--emas` | `#F2B705` | Sorotan slug, gigi balang di kartu hasil |
| `--warn` / `--warn-bg` | `#8A5A00` / `#FFF4E0` | Status Kedaluwarsa |
| `--danger` / `--danger-bg` | `#B42318` / `#FDECEA` | Hapus, error |

Mode gelap (usulan): latar `#1A120D`, kartu `#24190F`, teks `#FBF4E6`, merah `#E0505A`, emas tetap.

## Huruf (Google Fonts)

- **Zilla Slab** 700 — judul (gaya papan nama/warung, tegas)
- **Plus Jakarta Sans** 400–700 — teks (huruf yang memang dibuat untuk Jakarta)
- **JetBrains Mono** 400/500 — shortlink, slug, kode warna

## Hiasan gigi balang

SVG pola segitiga 22×16 px dengan bulatan di ujung, diulang mendatar. Merah di bawah header (header punya garis bawah merah 4 px), emas di tepi atas kartu hasil. Hanya hiasan (`aria-hidden`).

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
