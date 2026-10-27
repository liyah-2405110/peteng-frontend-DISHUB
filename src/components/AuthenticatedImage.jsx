import { useEffect, useState } from 'react'
import SafeImage from './SafeImage'
import { getFotoBukti } from '../services/laporanService'

function AuthenticatedImage({ src, alt, className = '', fallback = 'Foto tidak tersedia' }) {
  const [loadedImage, setLoadedImage] = useState({ src: '', objectUrl: '', error: false })
  const isProtectedPath = typeof src === 'string' && src.startsWith('/api/dinas/')

  useEffect(() => {
    if (!isProtectedPath || !src) return undefined

    let active = true
    let objectUrl = ''
    getFotoBukti(src)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setLoadedImage({ src, objectUrl, error: false })
      })
      .catch((error) => {
        console.error('Gagal memuat foto bukti yang memerlukan autentikasi:', error)
        if (active) setLoadedImage({ src, objectUrl: '', error: true })
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [isProtectedPath, src])

  if (!isProtectedPath) {
    return <SafeImage src={src} alt={alt} className={className} fallback={fallback} />
  }
  if (loadedImage.src !== src) {
    return <div className={`safe-image-fallback ${className}`} role="status">Memuat foto...</div>
  }
  if (loadedImage.error) {
    return <div className={`safe-image-fallback ${className}`} role="img" aria-label={alt}>{fallback}</div>
  }
  return <img className={className} src={loadedImage.objectUrl} alt={alt} />
}

export default AuthenticatedImage
