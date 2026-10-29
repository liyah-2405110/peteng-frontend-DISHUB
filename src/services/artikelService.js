// KERANGKA. Endpoint informasi jalan belum ada di backend yang saya lihat.
// Isi fungsi di bawah memakai helper request/auth yang SAMA dengan laporanService.js
// (saya tidak melihat file itu, jadi tidak saya tebak).
//
// Kontrak yang diharapkan halaman:
//   getArtikelJalan()          -> [{ id_artikel, judul, kategori, lokasi, isi, sumber_url, tanggal_terbit }]
//   buatArtikelJalan(payload)  -> payload: { judul, kategori, lokasi, isi, sumber_url }
//   hapusArtikelJalan(id)      -> void
// kategori: PEKERJAAN | LALU_LINTAS | PENGUMUMAN | LAINNYA
//
// Backend WAJIB memeriksa peran (hanya Dishub yang boleh membuat/menghapus).
// Menyembunyikan tombol di frontend bukan pengamanan.

const NOT_CONNECTED = () => {
  throw new Error('Endpoint informasi jalan belum terhubung ke backend.')
}

export async function getArtikelJalan() { return NOT_CONNECTED() }
export async function buatArtikelJalan() { return NOT_CONNECTED() }
export async function hapusArtikelJalan() { return NOT_CONNECTED() }