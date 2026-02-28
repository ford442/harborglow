import React from 'react'
import { useGameStore, UpgradeId } from '../store/useGameStore'
import { useMusicSystem } from '../systems/musicSystem'

const UPGRADES: { id: UpgradeId; name: string; desc: string; icon: string; cost: string }[] = [
  {
    id: 'RGB_MATRIX',
    name: 'RGB Matrix',
    desc: 'Music-reactive LED panels spanning the entire hull',
    icon: '💡',
    cost: '₿ 2.4k',
  },
  {
    id: 'PROJECTOR_RIG',
    name: 'Projector Rig',
    desc: 'High-power gobo projectors for sky-wide light shows',
    icon: '📽️',
    cost: '₿ 5.1k',
  },
  {
    id: 'POWER_UNIT',
    name: 'Power Unit',
    desc: 'Shore-power converter + UPS for full-night operation',
    icon: '⚡',
    cost: '₿ 1.8k',
  },
  {
    id: 'SPEAKER_ARRAY',
    name: 'Speaker Array',
    desc: 'Directional line-array speaker clusters on every deck',
    icon: '🔊',
    cost: '₿ 3.3k',
  },
]

/**
 * UpgradeMenu — modal panel for selecting and installing ship upgrades.
 * The crane picks up the selected upgrade and installs it.
 * Activates the music system on first RGB_MATRIX install.
 */
export default function UpgradeMenu() {
  const currentShip = useGameStore((s) => s.currentShip)
  const selectedUpgrade = useGameStore((s) => s.selectedUpgrade)
  const selectUpgrade = useGameStore((s) => s.selectUpgrade)
  const installUpgrade = useGameStore((s) => s.installUpgrade)
  const closeUpgradeMenu = useGameStore((s) => s.closeUpgradeMenu)

  // Start the music system (will activate when musicPlaying becomes true)
  useMusicSystem()

  if (!currentShip) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div className="glass p-6 w-[420px] max-w-[95vw] pointer-events-auto shadow-2xl border border-cyan-500/20">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-cyan-300 neon-text">
              ⚙️ Upgrade Workshop
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{currentShip.label}</p>
          </div>
          <button
            onClick={closeUpgradeMenu}
            className="text-gray-500 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Already installed */}
        {currentShip.installedUpgrades.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Installed</div>
            <div className="flex flex-wrap gap-1">
              {currentShip.installedUpgrades.map((u) => (
                <span
                  key={u}
                  className="text-xs px-2 py-0.5 rounded bg-green-900/40 border border-green-500/40 text-green-400"
                >
                  ✓ {u.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade list */}
        <div className="space-y-2 mb-4">
          {UPGRADES.map((upg) => {
            const installed = currentShip.installedUpgrades.includes(upg.id)
            const selected = selectedUpgrade === upg.id
            return (
              <button
                key={upg.id}
                disabled={installed}
                onClick={() => !installed && selectUpgrade(upg.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  installed
                    ? 'border-green-700/40 bg-green-900/20 opacity-60 cursor-not-allowed'
                    : selected
                    ? 'border-cyan-400 bg-cyan-900/30'
                    : 'border-gray-700 bg-gray-900/40 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{upg.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{upg.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{upg.desc}</div>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-400 font-mono ml-2 shrink-0">
                    {installed ? '✓' : upg.cost}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Install button */}
        <button
          onClick={installUpgrade}
          disabled={!selectedUpgrade}
          className={`w-full py-2.5 rounded-lg font-bold text-sm tracking-wider transition-all ${
            selectedUpgrade
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {selectedUpgrade ? '🏗️ Install via Crane' : 'Select an Upgrade'}
        </button>

        {selectedUpgrade === 'RGB_MATRIX' && (
          <p className="text-xs text-cyan-400/70 text-center mt-2">
            Installing RGB Matrix will activate the light show + music!
          </p>
        )}
      </div>
    </div>
  )
}
