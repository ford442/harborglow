import { useEffect, useState } from 'react'

/**
 * WebGPUWarning — detects whether WebGPU is supported and shows a banner
 * if the current browser doesn't support it.
 * The app will still run with a Three.js WebGL fallback, but visual quality
 * may be reduced.
 */
export default function WebGPUWarning() {
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    // navigator.gpu is the WebGPU API entry point
    if (typeof navigator !== 'undefined' && !('gpu' in navigator)) {
      setUnsupported(true)
    }
  }, [])

  if (!unsupported) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="bg-yellow-900/80 border-b border-yellow-600/60 px-4 py-2 text-center">
        <p className="text-xs text-yellow-300">
          ⚠️{' '}
          <strong>WebGPU not detected</strong> — running in WebGL fallback mode.
          For the best experience use Chrome 121+, Edge 121+, or Firefox Nightly.
        </p>
      </div>
    </div>
  )
}
