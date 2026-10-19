// =============================================================================
// EmitterAnchors — publishes world poses of a ship's attachment points
//
// Mounted inside ProceduralShip (so it inherits blueprint scale and bob) but
// outside the attachment-visual gate, so emitters keep working in tugboat
// mode, at far LOD and with attachment points hidden. Reads last frame's
// matrixWorld (one-frame lag, zero allocation).
// =============================================================================

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { AttachmentPoint } from '../../store/useGameStore'
import { getRigTypeForPart } from '../../systems/attachmentSystem'
import { rigGroupForAttachmentPoint } from '../../systems/lightShows/rigGroups'
import { emitterAnchorKey, setEmitterAnchor, type EmitterAnchor } from './emitterAnchors'

interface EmitterAnchorsProps {
  shipId: string
  shipType: string
  points: readonly AttachmentPoint[]
  installed: ReadonlySet<string>
}

const scratchScale = new THREE.Vector3()

export default function EmitterAnchors({ shipId, shipType, points, installed }: EmitterAnchorsProps) {
  const groups = useRef<(THREE.Group | null)[]>([])

  const anchors = useMemo<EmitterAnchor[]>(
    () => points.map((p) => ({
      key: emitterAnchorKey(shipId, p.partName),
      shipId,
      shipType,
      partName: p.partName,
      rigType: getRigTypeForPart(p.partName),
      group: rigGroupForAttachmentPoint(p.partName),
      installed: false,
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
    })),
    [points, shipId, shipType],
  )

  useEffect(() => {
    for (const a of anchors) setEmitterAnchor(a.key, a)
    return () => {
      for (const a of anchors) setEmitterAnchor(a.key, null)
    }
  }, [anchors])

  useEffect(() => {
    for (const a of anchors) a.installed = installed.has(a.partName)
  }, [anchors, installed])

  useFrame(() => {
    for (let i = 0; i < anchors.length; i++) {
      const g = groups.current[i]
      if (g) g.matrixWorld.decompose(anchors[i].position, anchors[i].quaternion, scratchScale)
    }
  })

  return (
    <>
      {points.map((p, i) => (
        <group
          key={p.partName}
          ref={(g) => { groups.current[i] = g }}
          position={p.position}
          rotation={p.rotation}
        />
      ))}
    </>
  )
}
