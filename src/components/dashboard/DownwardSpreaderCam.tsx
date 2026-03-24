// =============================================================================
// DOWNWARD SPREADER CAM — Top-down alignment view with grid and crosshairs
// =============================================================================

interface DownwardSpreaderCamProps {
  twistlockEngaged: boolean
  spreaderPos: { x: number; y: number; z: number }
  iceBuildup: number
  isMoving: boolean
}

export default function DownwardSpreaderCam({
  twistlockEngaged,
  spreaderPos,
  iceBuildup,
  isMoving,
}: DownwardSpreaderCamProps) {
  const alignmentX = spreaderPos.x / 20
  const alignmentZ = spreaderPos.z / 20

  return (
    <div className="cam-feed downward-spreader arctic">
      <div className="top-down-view">
        <div
          className={`spreader-top ${isMoving ? 'moving' : ''}`}
          style={{
            transform: `translate(${alignmentX * 40}px, ${alignmentZ * 30}px)`,
            transition: isMoving ? 'none' : 'transform 0.3s ease',
          }}
        >
          <div className="spreader-frame arctic">
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
              <div
                key={corner}
                className={`tl-corner ${corner} ${twistlockEngaged ? 'engaged' : ''} arctic`}
              >
                <div className="tl-indicator" />
              </div>
            ))}

            <div className="center-crosshair arctic">
              <div className="crosshair-h" />
              <div className="crosshair-v" />
            </div>
          </div>

          {iceBuildup > 0 && (
            <div className="ice-frost" style={{ opacity: iceBuildup }} />
          )}
        </div>

        <div className="target-container">
          <div className="container-outline ice-glow" />
          <div className="target-crosshair arctic" />

          <div
            className="alignment-target"
            style={{
              transform: `translate(${-alignmentX * 40}px, ${-alignmentZ * 30}px)`,
            }}
          >
            <div className="guide-h arctic" />
            <div className="guide-v arctic" />
          </div>
        </div>

        <div
          className="depth-ring"
          style={{ opacity: 0.3 + (spreaderPos.y / 50) * 0.7 }}
        >
          <div
            className="depth-marker"
            style={{ transform: `rotate(${(spreaderPos.y / 50) * 360}deg)` }}
          />
        </div>
      </div>

      <div className="data-overlay center arctic">
        <div className="data-row">
          <span className="data-label">POS</span>
          <span className="data-value arctic-cyan">
            X:{spreaderPos.x.toFixed(1)} Z:{spreaderPos.z.toFixed(1)}
          </span>
        </div>

        <div className="data-row">
          <span className="data-label">ALT</span>
          <span className="data-value arctic-cyan">{spreaderPos.y.toFixed(1)}m</span>
        </div>

        <div className="data-row">
          <span className="data-label">LOCK</span>
          <span className={`data-value ${twistlockEngaged ? 'arctic-green' : 'arctic-red'}`}>
            {twistlockEngaged ? 'ALL 4 ENGAGED' : 'UNLOCKED'}
          </span>
        </div>
      </div>
    </div>
  )
}
