# PETENG Dishub web

## Menjalankan

1. Pastikan backend PETENG aktif.
2. Dari folder ini, jalankan `npm ci`.
3. Set `VITE_API_URL` ke base URL backend (default pengembangan:
   `http://localhost:8080`).
4. Jalankan `npm run dev`.

Validasi produksi menggunakan `npm run lint` dan `npm run build`.

Dashboard, laporan, publikasi penyelesaian, dan profil membaca data dari API
backend. Ketika API gagal, UI menampilkan error; tidak ada laporan atau berita
contoh yang digunakan sebagai fallback. Publikasi berita eksternal belum tersedia
dari backend.
