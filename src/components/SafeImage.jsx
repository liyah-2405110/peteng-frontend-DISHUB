import { useState } from 'react'

function SafeImage({ src, alt, className = '', fallback = 'Foto tidak tersedia' }) {
  const [failedSource, setFailedSource] = useState('')
  const failed = !src || failedSource === src

  if (failed) {
    return <div className={`safe-image-fallback ${className}`} role="img" aria-label={alt}>{fallback}</div>
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailedSource(src)} />
}

export default SafeImage
