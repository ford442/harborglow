// =============================================================================
// TWISTLOCK CAM — Merged Left/Right twistlock camera feed.
// The only visual difference between sides is the `mirror` CSS class.
// =============================================================================

interface TwistlockCamProps {
  side: 'left' | 'right'
  twistlockEngaged: boolean
  height: number
  iceBuildup: number
  isMoving: boolean
}

export default function TwistlockCam({
  side,
  twistlockEngaged,
  height,
  iceBuildup,
  isMoving,
}: TwistlockCamProps) {
  return (
    <div
      className={`cam-feed ${side}-twistlock arctic`}
      style={{
        filter:
          iceBuildup > 0.3
            ? `contrast(${1 - iceBuildup * 0.2}) brightness(${0.9 - iceBuildup * 0.1})`
            : undefined,
      }}
    >
      <div className="feed-grid">
        <div className={`spreader-side${side === 'right' ? ' mirror' : ''}`}>
          <div className={`spreader-beam frosted ${isMoving ? 'moving' : ''}`} />

          <div
            className={`twistlock ${side} engaged arctic ${twistlockEngaged ? 'locked' : 'unlocked'}`}
            style={{
              boxShadow: twistlockEngaged
                ? '0 0 20px #00ff44, inset 0 0 10px #00ff44'
                : '0 0 20px #ff4444, inset 0 0 10px #ff4444',
            }}
          >
            <div className="lock-icon">{twistlockEngaged ? '🔒' : '🔓'}</div>
          </div>

          <div className="corner-casting" style={{ transform: `translateY(${height * 2}px)` }}>
            <div className="container-corner ice-coated" />
          </div>

          {iceBuildup > 0 && (
            <div className="ice-overlay" style={{ opacity: iceBuildup }}>
              <div className="frost-pattern" />
            </div>
          )}
        </div>

        <div className="height-ruler">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="ruler-mark" style={{ top: `${i * 10}%` }}>
              <span>{(10 - i) * 2}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="data-overlay arctic">
        <div className="data-row">
          <span className="data-label">LOCK</span>
          <span className={`data-value ${twistlockEngaged ? 'arctic-green' : 'arctic-red'}`}>
            {twistlockEngaged ? 'ENGAGED' : 'DISENGAGED'}
          </span>
        </div>

        <div className="data-row">
          <span className="data-label">HGT</span>
          <span className="data-value arctic-cyan">{height.toFixed(1)}m</span>
        </div>

        {iceBuildup > 0 && (
          <div className="data-row">
            <span className="data-label">ICE</span>
            <span className="data-value arctic-white">{(iceBuildup * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
