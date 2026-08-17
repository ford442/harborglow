/**
 * Canvas-bound audio analysis driver — imports @react-three/fiber only here
 * so menu / loading paths avoid pulling the 3D stack via audioVisualSync.ts.
 */

import { useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { audioVisualSync, type AudioAnalysisData, globalAudioData } from './audioVisualSync'

export function useAudioVisualSync() {
  const [audioData, setAudioData] = useState<AudioAnalysisData>(globalAudioData)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      await audioVisualSync.initialize()
      if (mounted) setIsInitialized(true)
    }

    init()

    const unsubscribe = audioVisualSync.onFrame((data) => {
      if (mounted) setAudioData(data)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const bpm = useGameStore((state) => state.bpm)
  useEffect(() => {
    audioVisualSync.setBPM(bpm)
  }, [bpm])

  useFrame((state) => {
    if (isInitialized) {
      audioVisualSync.analyze(state.clock.elapsedTime)
    }
  })

  return { audioData, isInitialized }
}
