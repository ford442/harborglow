const fs = require('fs');
let code = fs.readFileSync('src/scenes/Tugboat.tsx', 'utf8');

// Replace PROBE_OFFSETS loop
code = code.replace(
`    for (const offset of PROBE_OFFSETS) {
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)

      const probeX = pos.x + localOff.x
      const probeZ = pos.z + localOff.z
      const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
      const probeY = pos.y + localOff.y
      const submerged = waterH - 2.5 - probeY

      if (submerged > 0) {
        const force = submerged * PHYSICS.buoyancyScale * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: probeX, y: probeY, z: probeZ },
          true
        )
      }
    }`,
`    // Use batch evaluation for buoyancy queries
    const xs = new Float32Array(PROBE_OFFSETS.length)
    const zs = new Float32Array(PROBE_OFFSETS.length)
    const ys = new Float32Array(PROBE_OFFSETS.length)
    for (let i = 0; i < PROBE_OFFSETS.length; i++) {
      const offset = PROBE_OFFSETS[i]
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)
      xs[i] = pos.x + localOff.x
      zs[i] = pos.z + localOff.z
      ys[i] = pos.y + localOff.y
    }
    const heights = waveSystem.getWaterHeightBatch(xs, zs, time)
    for (let i = 0; i < PROBE_OFFSETS.length; i++) {
      const waterH = heights[i]
      const submerged = waterH - 2.5 - ys[i]
      if (submerged > 0) {
        const force = submerged * PHYSICS.buoyancyScale * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: xs[i], y: ys[i], z: zs[i] },
          true
        )
      }
    }`
);
fs.writeFileSync('src/scenes/Tugboat.tsx', code);

let code2 = fs.readFileSync('src/scenes/TugboatTargetShip.tsx', 'utf8');
code2 = code2.replace(
`    for (const offset of PROBE_OFFSETS) {
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)

      const probeX = pos.x + localOff.x
      const probeZ = pos.z + localOff.z
      const waterH = waveSystem.getWaterHeight(probeX, probeZ, time)
      const probeY = pos.y + localOff.y
      const submerged = waterH - 2.5 - probeY

      if (submerged > 0) {
        const force = submerged * BUOYANCY_SCALE * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: probeX, y: probeY, z: probeZ },
          true
        )
      }
    }`,
`    const xs = new Float32Array(PROBE_OFFSETS.length)
    const zs = new Float32Array(PROBE_OFFSETS.length)
    const ys = new Float32Array(PROBE_OFFSETS.length)
    for (let i = 0; i < PROBE_OFFSETS.length; i++) {
      const offset = PROBE_OFFSETS[i]
      const localOff = new THREE.Vector3(offset.x, 0, offset.z)
      localOff.applyQuaternion(quat)
      xs[i] = pos.x + localOff.x
      zs[i] = pos.z + localOff.z
      ys[i] = pos.y + localOff.y
    }
    const heights = waveSystem.getWaterHeightBatch(xs, zs, time)
    for (let i = 0; i < PROBE_OFFSETS.length; i++) {
      const waterH = heights[i]
      const submerged = waterH - 2.5 - ys[i]
      if (submerged > 0) {
        const force = submerged * BUOYANCY_SCALE * delta
        rb.applyImpulseAtPoint(
          { x: 0, y: force, z: 0 },
          { x: xs[i], y: ys[i], z: zs[i] },
          true
        )
      }
    }`
);
fs.writeFileSync('src/scenes/TugboatTargetShip.tsx', code2);
