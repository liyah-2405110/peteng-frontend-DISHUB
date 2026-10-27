import { authFetch } from './apiClient'

async function readResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || fallbackMessage)
  }
  return data
}

// GET /api/dinas/laporan
export async function getLaporanDinasBackend() {
  const res = await authFetch('/api/dinas/laporan')
  if (!res.ok) {
    throw new Error('Gagal mengambil laporan dari backend')
  }

  const json = await res.json()
  if (!Array.isArray(json.data)) {
    throw new Error('Respons backend tidak menyediakan daftar laporan')
  }

  return json.data
}

// GET /api/dinas/laporan/:id_laporan
export async function getDetailLaporanDinas(idLaporan) {
  const res = await authFetch(`/api/dinas/laporan/${encodeURIComponent(idLaporan)}`)
  const json = await readResponse(res, 'Gagal mengambil detail laporan')
  return json.data
}

export async function getDaftarLaporanDinas() {
  return {
    source: 'backend',
    data: await getLaporanDinasBackend(),
  }
}

// POST /api/dinas/laporan/:id_laporan/penanganan/mulai
export async function mulaiPenangananLaporan(idLaporan) {
  const res = await authFetch(`/api/dinas/laporan/${encodeURIComponent(idLaporan)}/penanganan/mulai`, {
    method: 'POST',
  })
  return readResponse(res, 'Gagal memulai penanganan laporan')
}

// POST /api/dinas/laporan/:id_laporan/penanganan/bukti
export async function simpanBuktiPenanganan(idLaporan, { catatanPenanganan, kondisiPenerangan, fotoBukti }) {
  const formData = new FormData()
  formData.append('catatan_penanganan', catatanPenanganan)
  formData.append('kondisi_penerangan', kondisiPenerangan)
  formData.append('foto_bukti', fotoBukti)

  const res = await authFetch(`/api/dinas/laporan/${encodeURIComponent(idLaporan)}/penanganan/bukti`, {
    method: 'POST',
    body: formData,
  })
  return readResponse(res, 'Gagal menyimpan bukti penanganan')
}

// POST /api/dinas/laporan/:id_laporan/penanganan/verifikasi
export async function verifikasiBuktiPenanganan(idLaporan, { hasil, catatan }) {
  const res = await authFetch(`/api/dinas/laporan/${encodeURIComponent(idLaporan)}/penanganan/verifikasi`, {
    method: 'POST',
    body: JSON.stringify({ hasil, catatan }),
  })
  return readResponse(res, 'Gagal menyimpan verifikasi bukti')
}

export async function getFotoBukti(url) {
  const res = await authFetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Gagal mengambil foto bukti')
  }
  return res.blob()
}

// PATCH /api/dinas/laporan/:id_laporan/status
export async function updateStatusLaporan(idLaporan, { status, judul, deskripsi }) {
  try {
    const res = await authFetch(`/api/dinas/laporan/${idLaporan}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, judul, deskripsi }),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.message || 'Gagal memperbarui status laporan')
    }

    return { success: true, message: data.message || 'Status berhasil diperbarui' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// POST /api/dinas/laporan/:id_laporan/validasi-ai/mulai
export async function mulaiValidasiAI(idLaporan) {
  const res = await authFetch(`/api/dinas/laporan/${idLaporan}/validasi-ai/mulai`, {
    method: 'POST',
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Gagal memulai validasi AI')
  }

  return data
}

// POST /api/dinas/laporan/:id_laporan/validasi-ai/proses
export async function prosesValidasiAI(idLaporan) {
  const res = await authFetch(`/api/dinas/laporan/${idLaporan}/validasi-ai/proses`, {
    method: 'POST',
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || 'Gagal memproses validasi AI')
  }

  return data
}

// GET /api/dinas/laporan/:id_laporan/validasi-ai
export async function getValidasiAITerbaru(idLaporan) {
  const res = await authFetch(`/api/dinas/laporan/${idLaporan}/validasi-ai`)

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    throw new Error('Gagal mengambil hasil validasi AI')
  }

  const json = await res.json()
  return json.data || null
}
