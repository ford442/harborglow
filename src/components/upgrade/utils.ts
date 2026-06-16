import * as THREE from 'three'

export function optimizeQueueOrder(
    parts: Array<{ shipId: string; partName: string; worldPos: THREE.Vector3 }>,
    startPos: THREE.Vector3
) {
    const remaining = [...parts]
    const ordered: typeof parts = []
    let current = startPos.clone()

    while (remaining.length > 0) {
        let nearestIdx = 0
        let nearestDist = Infinity
        remaining.forEach((item, index) => {
            const distance = current.distanceTo(item.worldPos)
            if (distance < nearestDist) {
                nearestDist = distance
                nearestIdx = index
            }
        })

        const next = remaining.splice(nearestIdx, 1)[0]
        ordered.push(next)
        current = next.worldPos.clone()
    }

    return ordered.map(({ shipId, partName }) => ({ shipId, partName }))
}

export function projectWorldToScreen(worldPos: THREE.Vector3, camera: THREE.Camera) {
    const projected = worldPos.clone().project(camera)
    if (projected.z < -1 || projected.z > 1) return null

    const canvas = document.querySelector('canvas')
    const width = canvas?.clientWidth || window.innerWidth
    const height = canvas?.clientHeight || window.innerHeight

    return {
        x: (projected.x * 0.5 + 0.5) * width,
        y: (-projected.y * 0.5 + 0.5) * height,
    }
}

export function formatPartLabel(partName: string) {
    return partName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()
}
