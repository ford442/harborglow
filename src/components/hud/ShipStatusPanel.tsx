// =============================================================================
// SHIP STATUS PANEL - Ship info, upgrade progress, categories
// =============================================================================

import { useMemo } from 'react'
import { useGameStore, Ship, ShipType, selectUpgradeProgress } from '../../store/useGameStore'
import { SHIP_COLORS } from '../DesignSystem'
import { ProgressRing } from '../InteractiveFeedback'
import {
  shipStatusPanelStyle,
  shipStatusHeaderStyle,
  shipStatusIconStyle,
  shipStatusTitleStyle,
  shipStatusNameStyle,
  upgradeProgressContainerStyle,
  upgradeProgressHeaderStyle,
  upgradeProgressLabelStyle,
  upgradeProgressValueStyle,
  upgradeCategoriesContainerStyle,
  upgradeCategoryStyle,
  categoryIconStyle,
  categoryBarContainerStyle,
  categoryBarStyle,
  categoryLabelStyle,
  categoryCountStyle,
} from './styles'

interface ShipStatusPanelProps {
  ship: Ship
}

const UPGRADE_CATEGORIES: Record<ShipType, { name: string; icon: string; parts: string[] }[]> = {
  cruise: [
    { name: 'Exterior', icon: '🚢', parts: ['bow_lights', 'stern_lights', 'funnel'] },
    { name: 'Decks', icon: '🏨', parts: ['balcony_railing', 'pool_area'] },
    { name: 'Bridge', icon: '🧭', parts: ['mast'] },
  ],
  container: [
    { name: 'Stacks', icon: '📦', parts: ['stack_lights', 'crane_lights'] },
    { name: 'Bridge', icon: '🧭', parts: ['bridge_wings', 'mast'] },
  ],
  tanker: [
    { name: 'Hull', icon: '🛢️', parts: ['flare_stack', 'rail_lights'] },
    { name: 'Bridge', icon: '🧭', parts: ['bridge'] },
  ],
  bulk: [
    { name: 'Holds', icon: '🌾', parts: ['hatch_lights'] },
    { name: 'Gear', icon: '🏗️', parts: ['deck_cranes'] },
  ],
  lng: [
    { name: 'Tanks', icon: '❄️', parts: ['membrane_tanks'] },
    { name: 'Super', icon: '🏭', parts: ['superstructure'] },
  ],
  roro: [
    { name: 'Ramps', icon: '🚗', parts: ['vehicle_ramps'] },
    { name: 'Decks', icon: '💡', parts: ['deck_lighting'] },
  ],
  research: [
    { name: 'Lab', icon: '🔬', parts: ['lab_lights'] },
    { name: 'Gear', icon: '📡', parts: ['sonar', 'crane'] },
  ],
  droneship: [
    { name: 'Deck', icon: '🚀', parts: ['landing_platform'] },
    { name: 'Sys', icon: '⚡', parts: ['thruster_bays'] },
  ],
}

export default function ShipStatusPanel({ ship }: ShipStatusPanelProps) {
  const installedUpgrades = useGameStore(state => state.installedUpgrades)
  const shipColor = SHIP_COLORS[ship.type].primary
  
  const progress = useMemo(() => {
    const state = useGameStore.getState()
    return selectUpgradeProgress(state, ship.id)
  }, [installedUpgrades, ship.id])
  
  const categories = useMemo(() => {
    const cats = UPGRADE_CATEGORIES[ship.type] || []
    return cats.map(cat => ({
      ...cat,
      installed: cat.parts.filter(part => 
        installedUpgrades.some(u => u.shipId === ship.id && u.partName === part)
      ).length,
      total: cat.parts.length,
    }))
  }, [ship.type, ship.id, installedUpgrades])
  
  return (
    <div style={shipStatusPanelStyle}>
      <div style={shipStatusHeaderStyle}>
        <div style={{
          ...shipStatusIconStyle,
          background: `${shipColor}20`,
        }}>
          <ProgressRing 
            progress={progress} 
            size="md" 
            color={shipColor}
          />
        </div>
        <div>
          <div style={shipStatusTitleStyle}>Ship Status</div>
          <div style={{ ...shipStatusNameStyle, color: shipColor }}>
            {ship.name || ship.type}
          </div>
        </div>
      </div>
      
      <div style={upgradeProgressContainerStyle}>
        <div style={upgradeProgressHeaderStyle}>
          <span style={upgradeProgressLabelStyle}>Upgrade Progress</span>
          <span style={upgradeProgressValueStyle}>{progress.toFixed(0)}%</span>
        </div>
      </div>
      
      <div style={upgradeCategoriesContainerStyle}>
        {categories.map(cat => (
          <div key={cat.name} style={upgradeCategoryStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={categoryIconStyle}>{cat.icon}</span>
              <div style={categoryBarContainerStyle}>
                <div 
                  style={{
                    ...categoryBarStyle,
                    width: `${(cat.installed / Math.max(1, cat.total)) * 100}%`,
                    background: shipColor,
                  }}
                />
              </div>
            </div>
            <span style={categoryLabelStyle}>{cat.name}</span>
            <span style={categoryCountStyle}>{cat.installed}/{cat.total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
