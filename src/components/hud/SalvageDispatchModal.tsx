import { useMemo } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { createGlassPanelStyles, createButtonStyles } from '../DesignSystem'
import { stormSystem } from '../../systems/StormSystem'

function formatExpiry(expiresAt: number): string {
  return `${Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000))}m`
}

export default function SalvageDispatchModal() {
  const operationMode = useGameStore((s) => s.operationMode)
  const activeMission = useGameStore((s) => s.activeMission)
  const contracts = useGameStore((s) => s.salvageContracts)
  const acceptSalvageContract = useGameStore((s) => s.acceptSalvageContract)
  const refreshSalvageContracts = useGameStore((s) => s.refreshSalvageContracts)
  const tugboatUpgrades = useGameStore((s) => s.tugboatUpgrades)

  const showDispatch = operationMode === 'tugboat' && (!activeMission || activeMission.status !== 'active')
  const sortedContracts = useMemo(
    () => [...contracts].sort((a, b) => b.rewardEstimate - a.rewardEstimate).slice(0, 3),
    [contracts]
  )

  if (!showDispatch) return null

  return (
    <div
      style={{
        ...createGlassPanelStyles({ padding: '14px', maxWidth: '380px' }),
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 108,
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffb366', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Distressed Faction Dispatch
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
        Legacy operators are broadcasting open-water distress calls.
      </div>
      {sortedContracts.map((contract) => (
        <div
          key={contract.id}
          style={{
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(255,170,120,0.25)',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffe0c2' }}>{contract.vesselLabel}</span>
            <span style={{ fontSize: '11px', color: '#ffd36a' }}>${contract.rewardEstimate.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.72)' }}>
            {contract.factionLabel} • {contract.distanceNm.toFixed(1)}nm • {contract.seaState.toUpperCase()} seas
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>{contract.techniqueNote}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Standby stake: ${contract.acceptedFee}</span>
            <button
              onClick={() => {
                acceptSalvageContract(contract.id)
                stormSystem.start(contract.seaState === 'severe' ? 220 : 180)
              }}
              style={{ ...createButtonStyles({ variant: 'primary', size: 'sm', fullWidth: false }), fontSize: '10px' }}
            >
              Accept Contract
            </button>
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}>Expires in {formatExpiry(contract.expiresAt)}</div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={refreshSalvageContracts} style={createButtonStyles({ variant: 'secondary', size: 'sm', fullWidth: false })}>
          Refresh Calls
        </button>
        <span style={{ fontSize: '10px', color: tugboatUpgrades.heavy_tow_winch ? '#00d4aa' : 'rgba(255,255,255,0.45)' }}>
          Heavy Tow Winch: {tugboatUpgrades.heavy_tow_winch ? 'Unlocked' : 'Locked'}
        </span>
      </div>
    </div>
  )
}
