import { API_URL } from './apiClient'

export const FALLBACK_LOKASI_INDRAMAYU = [
  { id_lokasi: 1, alamat: 'Jl. Raya Lohbener - Jatibarang KM 14.2', latitude: -6.40284, longitude: 108.28913, kecamatan: 'Lohbener' },
  { id_lokasi: 2, alamat: 'Jl. Mayor Dasuki, Jatibarang', latitude: -6.46731, longitude: 108.30945, kecamatan: 'Jatibarang' },
  { id_lokasi: 3, alamat: 'Jl. Terusan Sindang - Cantigi', latitude: -6.37521, longitude: 108.32415, kecamatan: 'Sindang' },
  { id_lokasi: 4, alamat: 'Jl. Pantura Karangampel', latitude: -6.44122, longitude: 108.41235, kecamatan: 'Karangampel' },
  { id_lokasi: 5, alamat: 'Jl. DI Panjaitan, Indramayu Kota', latitude: -6.32671, longitude: 108.32145, kecamatan: 'Indramayu Kota' },
  { id_lokasi: 6, alamat: 'Jl. Raya Balongan (Kawasan Kilang)', latitude: -6.37110, longitude: 108.38450, kecamatan: 'Balongan' },
  { id_lokasi: 7, alamat: 'Jl. Raya Patrol - Sukra (Pantura Barat)', latitude: -6.30560, longitude: 108.01230, kecamatan: 'Patrol' },
]

// GET /api/lokasi
export async function getDaftarLokasi() {
  try {
    const res = await fetch(`${API_URL}/api/lokasi`)
    if (!res.ok) throw new Error('Gagal mengambil data lokasi')
    const json = await res.json()
    if (Array.isArray(json.data) && json.data.length > 0) {
      return json.data
    }
    return FALLBACK_LOKASI_INDRAMAYU
  } catch {
    return FALLBACK_LOKASI_INDRAMAYU
  }
}

// GET /api/navigasi/rute?start_lat=...&start_lon=...&end_lat=...&end_lon=...
export async function cariRuteNavigasi(startLat, startLon, endLat, endLon) {
  try {
    const params = new URLSearchParams({
      start_lat: startLat,
      start_lon: startLon,
      end_lat: endLat,
      end_lon: endLon,
    })
    const res = await fetch(`${API_URL}/api/navigasi/rute?${params.toString()}`)
    if (!res.ok) throw new Error('Rute tidak ditemukan')
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

