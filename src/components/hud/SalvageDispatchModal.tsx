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
  const money = useGameStore((s) => s.money)
  const reputation = useGameStore((s) => s.reputation)
  const boothTier = useGameStore((s) => s.boothTier)
  const purchaseTugboatUpgrade = useGameStore((s) => s.purchaseTugboatUpgrade)

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
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>Bank ${money.toLocaleString()}</span>
      </div>
      <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Tug Upgrades
        </div>
        <span style={{ fontSize: '10px', color: tugboatUpgrades.heavy_tow_winch ? '#00d4aa' : 'rgba(255,255,255,0.45)' }}>
          Heavy Tow Winch: {tugboatUpgrades.heavy_tow_winch ? 'Unlocked' : 'Locked'}
        </span>
        <span style={{ fontSize: '10px', color: tugboatUpgrades.cavitation_suppression_jets ? '#00d4aa' : 'rgba(255,255,255,0.45)' }}>
          Cavitation Jets: {tugboatUpgrades.cavitation_suppression_jets ? 'Unlocked' : 'Locked'}
        </span>
        <button
          onClick={() => purchaseTugboatUpgrade('searchlight_rig')}
          disabled={tugboatUpgrades.searchlight_rig || money < 600 || reputation < 550}
          style={{ ...createButtonStyles({ variant: 'secondary', size: 'sm', fullWidth: true }), opacity: tugboatUpgrades.searchlight_rig ? 0.7 : 1 }}
        >
          {tugboatUpgrades.searchlight_rig ? '✓ Searchlight Rig' : 'Buy Searchlight Rig ($600 / 550 rep)'}
        </button>
        <button
          onClick={() => purchaseTugboatUpgrade('dynamic_positioning_assist')}
          disabled={tugboatUpgrades.dynamic_positioning_assist || money < 900 || reputation < 1100 || boothTier < 2}
          style={{ ...createButtonStyles({ variant: 'secondary', size: 'sm', fullWidth: true }), opacity: tugboatUpgrades.dynamic_positioning_assist ? 0.7 : 1 }}
        >
          {tugboatUpgrades.dynamic_positioning_assist
            ? '✓ Dynamic Positioning Assist'
            : 'Buy Dynamic Positioning Assist ($900 / 1100 rep)'}
        </button>
      </div>
    </div>
  )
}
