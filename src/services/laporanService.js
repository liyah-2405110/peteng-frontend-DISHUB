import { authFetch } from './apiClient'

// Data representatif fallback berbasis kondisi riil Kabupaten Indramayu
// jika backend Go belum aktif atau database lokal kosong.
export const INITIAL_MOCK_LAPORAN = [
  {
    id_laporan: 'IDM-2024-8812',
    id_warga: 101,
    pelapor_nama: 'Ahmad Suhendra',
    pelapor_phone: '+62 812-3981-8812',
    pelapor_skor: '9.6 / 10',
    foto: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    latitude: -6.40284,
    longitude: 108.28913,
    kecamatan: 'Lohbener',
    keterangan_lokasi: 'Jl. Raya Lohbener - Jatibarang (KM 14.2) - Jalur Utama Logistik Pantura',
    kategori: 'PJU_MATI',
    tingkat_kegelapan: 3,
    deskripsi: 'Mati total 6 tiang PJU sepanjang 420 meter. Kondisi sangat gelap gulita (< 3 Lux). Jalur rawan lakalantas truk logistik.',
    status: 'diterima', // Tervalidasi AI (Siap Disposisi)
    tanggal_laporan: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    armada: 'Regu Derek 02 (Standby)',
    ai_validation: {
      hasil_validasi: 'valid',
      tingkat_kegelapan_ai: 3,
      cnn_confidence: 0.984,
      yolo_confidence: 0.986,
      objek_terdeteksi: [
        { label: 'PJU Mati [ID: T-LHB-08]', confidence: 0.984, zone: 'Zero-Luminance (<3 Lux)', area: '420m Void' },
      ],
      catatan: 'Citra malam mengonfirmasi kegelapan total 6 tiang berurutan. Sinkron dengan data GIS Koridor Lohbener.',
      model_version: 'PJU-YOLOV8-INDRAMAYU-v2.4',
      geotag_match: true,
      bukan_duplikat: true,
      satelit_match: true,
      gis_korelasi: true,
      rekomendasi: 'Dibutuhkan penggantian 4 Unit Lampu LED Smart 120W dan perbaikan jumper kabel pada tiang nomor T-LHB-08 s/d T-LHB-14.',
      estimasi_menit: 45,
    },
  },
  {
    id_laporan: 'IDM-2024-8809',
    id_warga: 102,
    pelapor_nama: 'Dedi Ruswandi',
    pelapor_phone: '+62 852-2410-8809',
    pelapor_skor: '8.9 / 10',
    foto: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    latitude: -6.46731,
    longitude: 108.30945,
    kecamatan: 'Jatibarang',
    keterangan_lokasi: 'Jl. Mayor Dasuki, Kec. Jatibarang Pasar (Kawasan Niaga)',
    kategori: 'PJU_RUSAK',
    tingkat_kegelapan: 2,
    deskripsi: 'Lampu kedip dan redup (2 tiang), jarak 90 meter sekitar 7 Lux. Kabel konektor kendor.',
    status: 'diproses', // Dalam penanganan armada
    tanggal_laporan: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    armada: 'Regu Derek 01 (Menuju Lokasi)',
    ai_validation: {
      hasil_validasi: 'valid',
      tingkat_kegelapan_ai: 2,
      cnn_confidence: 0.912,
      yolo_confidence: 0.925,
      objek_terdeteksi: [{ label: 'PJU Redup', confidence: 0.912 }],
      catatan: 'Sensor lux mendeteksi fluktuasi intensitas cahaya pada 2 armatur PJU.',
      model_version: 'PJU-YOLOV8-INDRAMAYU-v2.4',
      geotag_match: true,
      bukan_duplikat: true,
      satelit_match: true,
      gis_korelasi: true,
      rekomendasi: 'Pemeriksaan ballast dan penggantian photocell regulator otomatis.',
      estimasi_menit: 30,
    },
  },
  {
    id_laporan: 'IDM-2024-8802',
    id_warga: 103,
    pelapor_nama: 'Siti Nurhaliza',
    pelapor_phone: '+62 878-1922-8802',
    pelapor_skor: '9.1 / 10',
    foto: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    latitude: -6.37521,
    longitude: 108.32415,
    kecamatan: 'Sindang',
    keterangan_lokasi: 'Jl. Terusan Sindang - Cantigi, Dekat Jembatan (Jalan Penghubung)',
    kategori: 'PJU_RUSAK',
    tingkat_kegelapan: 3,
    deskripsi: 'Tiang miring 30 derajat tertabrak truk, kabel terurai bahaya bagi pengendara roda dua.',
    status: 'diproses', // Dalam Penanganan
    tanggal_laporan: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    armada: 'Regu Derek 05 (Di Lokasi)',
    ai_validation: {
      hasil_validasi: 'valid',
      tingkat_kegelapan_ai: 3,
      cnn_confidence: 0.991,
      yolo_confidence: 0.988,
      objek_terdeteksi: [{ label: 'Tiang Miring 30 Derajat', confidence: 0.991 }],
      catatan: 'Terdeteksi kerusakan struktural tiang PJU octagonal dan kabel terurai.',
      model_version: 'PJU-YOLOV8-INDRAMAYU-v2.4',
      geotag_match: true,
      bukan_duplikat: true,
      satelit_match: true,
      gis_korelasi: true,
      rekomendasi: 'Pengangkatan tiang dengan crane derek dan pengisolasian kabel tegangan.',
      estimasi_menit: 60,
    },
  },
  {
    id_laporan: 'IDM-2024-8798',
    id_warga: 104,
    pelapor_nama: 'Budi Santoso',
    pelapor_phone: '+62 821-5544-8798',
    pelapor_skor: '9.4 / 10',
    foto: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
    latitude: -6.44122,
    longitude: 108.41235,
    kecamatan: 'Karangampel',
    keterangan_lokasi: 'Jl. Pantura Karangampel - Krangkeng',
    kategori: 'PJU_MATI',
    tingkat_kegelapan: 3,
    deskripsi: 'Penggantian LED 120W sepanjang 250 meter telah tuntas dipasang dan diuji malam.',
    status: 'selesai', // Selesai
    tanggal_laporan: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    armada: 'Regu Derek 01 (Selesai)',
    ai_validation: {
      hasil_validasi: 'valid',
      tingkat_kegelapan_ai: 1,
      cnn_confidence: 1.0,
      yolo_confidence: 0.995,
      objek_terdeteksi: [{ label: 'PJU Berfungsi Terang (35 Lux)', confidence: 1.0 }],
      catatan: 'Foto pasca audit menunjukkan penerangan optimal 35 Lux merata.',
      model_version: 'PJU-YOLOV8-INDRAMAYU-v2.4',
      geotag_match: true,
      bukan_duplikat: true,
      satelit_match: true,
      gis_korelasi: true,
      rekomendasi: 'Pekerjaan selesai, foto purna perbaikan siap diterbitkan ke buletin warga.',
      estimasi_menit: 0,
    },
  },
  {
    id_laporan: 'IDM-2024-8820',
    id_warga: 105,
    pelapor_nama: 'Kartika Sari',
    pelapor_phone: '+62 813-9090-8820',
    pelapor_skor: '8.7 / 10',
    foto: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    latitude: -6.32671,
    longitude: 108.32145,
    kecamatan: 'Indramayu Kota',
    keterangan_lokasi: 'Jl. DI Panjaitan, Indramayu Kota (Dekat Alun-Alun)',
    kategori: 'PJU_RUSAK',
    tingkat_kegelapan: 2,
    deskripsi: 'Lampu PJU padam 1 unit di depan pertokoan.',
    status: 'diajukan', // Menunggu Validasi AI
    tanggal_laporan: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    armada: 'Belum Ditugaskan',
    ai_validation: null,
  },
]

// GET /api/dinas/laporan
export async function getDaftarLaporanDinas() {
  try {
    const res = await authFetch('/api/dinas/laporan')
    if (!res.ok) {
      throw new Error('Gagal mengambil laporan dari backend')
    }
    const json = await res.json()
    // Backend returns: { status: "sukses", message: "...", data: [...] }
    if (Array.isArray(json.data) && json.data.length > 0) {
      return { source: 'backend', data: json.data }
    }
    // Jika backend kosong atau belum ada data
    return { source: 'mock', data: INITIAL_MOCK_LAPORAN }
  } catch (err) {
    // Fallback ke data mock representatif agar UI tetap interaktif
    return { source: 'mock', data: INITIAL_MOCK_LAPORAN, offlineNotice: err.message }
  }
}

// PATCH /api/dinas/laporan/:id_laporan/status
export async function updateStatusLaporan(idLaporan, { status, judul, deskripsi }) {
  try {
    const res = await authFetch(`/api/dinas/laporan/${idLaporan}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        judul,
        deskripsi,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.message || 'Gagal memperbarui status laporan')
    }

    return { success: true, message: data.message || 'Status berhasil diperbarui' }
  } catch (err) {
    // Jika backend offline, return informasi jelas
    return { success: false, error: err.message }
  }
}

// POST /api/dinas/laporan/:id_laporan/validasi-ai/mulai
export async function mulaiValidasiAI(idLaporan) {
  try {
    const res = await authFetch(`/api/dinas/laporan/${idLaporan}/validasi-ai/mulai`, {
      method: 'POST',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || 'Gagal memulai validasi AI')
    }
    return { success: true, message: data.message }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// POST /api/dinas/laporan/:id_laporan/validasi-ai/mock
export async function simpanHasilMockAI(idLaporan, { hasil_validasi, tingkat_kegelapan_ai, catatan }) {
  try {
    const res = await authFetch(`/api/dinas/laporan/${idLaporan}/validasi-ai/mock`, {
      method: 'POST',
      body: JSON.stringify({
        hasil_validasi,
        tingkat_kegelapan_ai,
        catatan,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || 'Gagal menyimpan hasil mock AI')
    }
    return { success: true, message: data.message }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// GET /api/dinas/laporan/:id_laporan/validasi-ai
export async function getValidasiAITerbaru(idLaporan) {
  try {
    const res = await authFetch(`/api/dinas/laporan/${idLaporan}/validasi-ai`)
    if (!res.ok) {
      return null
    }
    const json = await res.json()
    return json.data || null
  } catch {
    return null
  }
}
