// Saklar demo untuk halaman Publikasi Progres.
// Idealnya MonitoringPeta.jsx juga mengimpor DEMO_REPORTS & USE_DEMO_DATA dari sini
// supaya dua halaman tidak menyimpan salinan data yang berbeda.
// WAJIB false di produksi: data di bawah ini fiktif.
export const USE_DEMO_DATA = true

export const DEMO_REPORTS = [
  { id_laporan: 'LP-2610-001', kategori: 'PJU_MATI', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Lohbener, dekat pertigaan Pantura', deskripsi: 'Lampu jalan padam sepanjang sekitar 450 meter', foto: null, latitude: -6.3880, longitude: 108.2570, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-27T19:20:00+07:00' },
  { id_laporan: 'LP-2610-002', kategori: 'PJU_RUSAK', status: 'diproses', keterangan_lokasi: 'Jl. Raya Siliwangi, Karangampel', deskripsi: 'Tiang lampu miring dan lampu berkedip', foto: null, latitude: -6.4686, longitude: 108.4333, kondisi_penerangan: 'redup', tanggal_laporan: '2026-10-26T18:45:00+07:00' },
  { id_laporan: 'LP-2610-003', kategori: 'PJU_MATI', status: 'selesai', keterangan_lokasi: 'Jl. Mayor Dasuki, Sindang', deskripsi: 'Tiga titik lampu mati di dekat alun-alun', foto: null, latitude: -6.3330, longitude: 108.2820, kondisi_penerangan: 'baik', catatan_penanganan: 'Ganti tiga unit lampu dan cek sambungan kabel.', tanggal_laporan: '2026-10-24T20:05:00+07:00' },
  { id_laporan: 'LP-2610-004', kategori: 'PJU_TIDAK_ADA', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Jatibarang, area persawahan', deskripsi: 'Ruas jalan gelap, belum ada lampu jalan', foto: null, latitude: -6.4730, longitude: 108.3010, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-27T21:10:00+07:00' },
  { id_laporan: 'LP-2610-005', kategori: 'PJU_RUSAK', status: 'diproses', keterangan_lokasi: 'Jl. Jenderal Sudirman, Indramayu Kota', deskripsi: 'Panel lampu rusak, penerangan tidak stabil', foto: null, latitude: -6.3264, longitude: 108.3200, kondisi_penerangan: 'redup', tanggal_laporan: '2026-10-25T19:30:00+07:00' },
  { id_laporan: 'LP-2610-006', kategori: 'LAINNYA', status: 'diajukan', keterangan_lokasi: 'Jl. Raya Haurgeulis, dekat pasar', deskripsi: 'Kabel PJU menjuntai di pinggir jalan', foto: null, latitude: -6.4440, longitude: 108.1000, kondisi_penerangan: 'belum_diketahui', tanggal_laporan: '2026-10-28T06:40:00+07:00' },
  { id_laporan: 'LP-2610-007', kategori: 'PJU_MATI', status: 'selesai', keterangan_lokasi: 'Jl. Raya Lohbener Barat, KM 14', deskripsi: 'Lampu mati di tikungan rawan kecelakaan', foto: null, latitude: -6.3950, longitude: 108.2380, kondisi_penerangan: 'baik', catatan_penanganan: 'Perbaikan kontaktor panel dan penggantian lampu.', tanggal_laporan: '2026-10-22T20:15:00+07:00' },
  { id_laporan: 'LP-2610-008', kategori: 'PJU_MATI', status: 'diproses', keterangan_lokasi: 'Jl. Pahlawan, Sindang', deskripsi: 'Dua lampu mati dekat sekolah', foto: null, latitude: -6.3400, longitude: 108.2950, kondisi_penerangan: 'gelap', tanggal_laporan: '2026-10-26T19:50:00+07:00' },
]

// Teks sengaja generik dan ditandai demo:true supaya tidak terbaca sebagai berita nyata.
export const DEMO_ARTICLES = [
  { id_artikel: 'demo-1', demo: true, kategori: 'PEKERJAAN', judul: 'Contoh: pemeliharaan ruas jalan', lokasi: 'Contoh ruas jalan', isi: 'Teks contoh untuk menguji tampilan. Isi sebenarnya diketik petugas Dishub lewat tombol Tambah informasi.', sumber_url: '', tanggal_terbit: '2026-10-28T08:00:00+07:00' },
  { id_artikel: 'demo-2', demo: true, kategori: 'LALU_LINTAS', judul: 'Contoh: pengalihan arus lalu lintas', lokasi: 'Contoh persimpangan', isi: 'Teks contoh kedua. Hapus lewat tombol Hapus untuk mencoba alur penghapusan.', sumber_url: '', tanggal_terbit: '2026-10-27T14:30:00+07:00' },
]