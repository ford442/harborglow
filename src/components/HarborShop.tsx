// =============================================================================
// HARBOR SHOP - Dock upgrades, specialist hires, shift management
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import Modal from './MainMenu/Modal'
import {
  useEconomySystem,
  DOCK_UPGRADES,
  SPECIALISTS,
  getUpgradeCost,
  getPortReputationTier,
  type ActiveBoost,
} from '../systems/economySystem'
import { createGlassPanelStyles, createButtonStyles } from './DesignSystem'

export interface HarborShopProps {
  isOpen: boolean
  onClose: () => void
}

type ShopTab = 'upgrades' | 'specialists' | 'shift'

interface ShiftSummary {
  credits: number
  reputation: number
  bonus: number
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatSpecialistDuration(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 60)}m`
}

export default function HarborShop({ isOpen, onClose }: HarborShopProps) {
  const {
    credits,
    reputation,
    canAfford,
    getUpgradeLevel,
    isUpgradeMaxed,
    purchaseUpgrade,
    hireSpecialist,
    getActiveBoosts,
    endShift,
    state,
  } = useEconomySystem()

  const [activeTab, setActiveTab] = useState<ShopTab>('upgrades')
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoost[]>([])
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)
  const [purchaseFeedback, setPurchaseFeedback] = useState<string | null>(null)

  const repTier = getPortReputationTier(reputation)

  useEffect(() => {
    if (!isOpen) return
    const refreshBoosts = () => setActiveBoosts(getActiveBoosts())
    refreshBoosts()
    const interval = setInterval(refreshBoosts, 1000)
    return () => clearInterval(interval)
  }, [isOpen, getActiveBoosts, state.activeBoosts.length])

  const showFeedback = useCallback((message: string) => {
    setPurchaseFeedback(message)
    setTimeout(() => setPurchaseFeedback(null), 2200)
  }, [])

  const handlePurchaseUpgrade = (upgradeId: string, name: string) => {
    const success = purchaseUpgrade(upgradeId)
    if (success) {
      showFeedback(`Purchased ${name}`)
    } else {
      showFeedback('Purchase failed — check balance or max level')
    }
  }

  const handleHireSpecialist = (specialistId: string, name: string) => {
    const success = hireSpecialist(specialistId)
    if (success) {
      showFeedback(`Hired ${name}`)
      setActiveBoosts(getActiveBoosts())
    } else {
      showFeedback('Cannot hire — insufficient credits')
    }
  }

  const handleEndShift = () => {
    const result = endShift()
    setShiftSummary(result)
  }

  const openReputationPanel = () => {
    window.dispatchEvent(new CustomEvent('harborglow:expand-reputation'))
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <Modal onClose={onClose} title="Harbor Shop" icon="🏗️">
        <div style={shopContainerStyle}>
          {/* Balance header */}
          <div style={balanceHeaderStyle}>
            <div style={balanceItemStyle}>
              <span style={balanceIconStyle}>💰</span>
              <div>
                <div style={balanceLabelStyle}>Harbor Credits</div>
                <div style={balanceValueStyle}>{credits.toLocaleString()} HC</div>
              </div>
            </div>
            <button type="button" onClick={openReputationPanel} style={repLinkStyle} title="View reputation unlocks">
              <span style={{ fontSize: '18px' }}>{repTier.badge}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', color: '#888' }}>Port Reputation</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: repTier.color }}>
                  {repTier.name} · {reputation}/1000
                </div>
              </div>
              <span style={{ fontSize: '10px', color: '#666' }}>→</span>
            </button>
          </div>

          {purchaseFeedback && (
            <div style={feedbackBannerStyle}>{purchaseFeedback}</div>
          )}

          {/* Active boosts */}
          {activeBoosts.length > 0 && (
            <div style={boostsPanelStyle}>
              <div style={sectionLabelStyle}>Active Boosts</div>
              <div style={boostsListStyle}>
                {activeBoosts.map((boost) => (
                  <div key={boost.id} style={boostChipStyle}>
                    <span style={{ flex: 1, fontSize: '11px' }}>{boost.description}</span>
                    <span style={boostTimerStyle}>{formatDuration(boost.expiresAt - Date.now())}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={tabsRowStyle}>
            <TabButton label="Upgrades" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} />
            <TabButton label="Specialists" active={activeTab === 'specialists'} onClick={() => setActiveTab('specialists')} />
            <TabButton label="Shift" active={activeTab === 'shift'} onClick={() => setActiveTab('shift')} />
          </div>

          {/* Tab content */}
          <div className="glass-scroll" style={tabContentStyle}>
            {activeTab === 'upgrades' && (
              <div style={cardGridStyle}>
                {DOCK_UPGRADES.map((upgrade) => {
                  const level = getUpgradeLevel(upgrade.id)
                  const maxed = isUpgradeMaxed(upgrade.id)
                  const cost = getUpgradeCost(upgrade.id, level)
                  const affordable = canAfford(cost)
                  const disabled = maxed || !affordable

                  return (
                    <ShopCard
                      key={upgrade.id}
                      icon={upgrade.icon}
                      title={upgrade.name}
                      description={upgrade.description}
                      meta={maxed ? 'MAX LEVEL' : `Level ${level}/${upgrade.maxLevel}`}
                      cost={maxed ? undefined : cost}
                      disabled={disabled}
                      disabledReason={maxed ? 'Maxed out' : !affordable ? `Need ${(cost - credits).toLocaleString()} more HC` : undefined}
                      onPurchase={() => handlePurchaseUpgrade(upgrade.id, upgrade.name)}
                      actionLabel={maxed ? 'Owned' : 'Purchase'}
                    />
                  )
                })}
              </div>
            )}

            {activeTab === 'specialists' && (
              <div style={cardGridStyle}>
                {SPECIALISTS.map((specialist) => {
                  const affordable = canAfford(specialist.cost)
                  return (
                    <ShopCard
                      key={specialist.id}
                      icon={specialist.icon}
                      title={specialist.name}
                      description={specialist.description}
                      meta={`${specialist.role} · ${formatSpecialistDuration(specialist.duration)}`}
                      cost={specialist.cost}
                      disabled={!affordable}
                      disabledReason={!affordable ? `Need ${(specialist.cost - credits).toLocaleString()} more HC` : undefined}
                      onPurchase={() => handleHireSpecialist(specialist.id, specialist.name)}
                      actionLabel="Hire"
                    />
                  )
                })}
              </div>
            )}

            {activeTab === 'shift' && (
              <div style={shiftPanelStyle}>
                <div style={shiftStatsStyle}>
                  <ShiftStat label="Installations" value={state.shiftPerformance.installations} />
                  <ShiftStat label="Perfect Installs" value={state.shiftPerformance.perfectInstalls} />
                  <ShiftStat label="Shift Earnings" value={`${state.shiftPerformance.totalEarnings} HC`} />
                </div>
                <p style={shiftHintStyle}>
                  End your shift to collect performance bonuses. A perfect shift (all installs flawless) earns +500 HC.
                  High volume (10+ installs) earns +200 HC.
                </p>
                <button
                  type="button"
                  onClick={handleEndShift}
                  style={createButtonStyles({ variant: 'primary', size: 'md', fullWidth: true })}
                >
                  End Shift & Collect Bonus
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {shiftSummary && (
        <Modal onClose={() => setShiftSummary(null)} title="Shift Complete" icon="📋">
          <div style={summaryContainerStyle}>
            <div style={summaryRowStyle}>
              <span>Total Earnings</span>
              <span style={summaryValueStyle}>{shiftSummary.credits.toLocaleString()} HC</span>
            </div>
            <div style={summaryRowStyle}>
              <span>Performance Bonus</span>
              <span style={summaryValueStyle}>+{shiftSummary.bonus.toLocaleString()} HC</span>
            </div>
            <div style={summaryRowStyle}>
              <span>Reputation Gained</span>
              <span style={{ ...summaryValueStyle, color: repTier.color }}>+{shiftSummary.reputation}</span>
            </div>
            <button
              type="button"
              onClick={() => setShiftSummary(null)}
              style={{ ...createButtonStyles({ variant: 'primary', size: 'md', fullWidth: true }), marginTop: '16px' }}
            >
              Start New Shift
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tabButtonBaseStyle,
        background: active ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255,255,255,0.05)',
        color: active ? '#00d4aa' : '#888',
        borderColor: active ? 'rgba(0, 212, 170, 0.4)' : 'rgba(255,255,255,0.1)',
      }}
    >
      {label}
    </button>
  )
}

function ShiftStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={shiftStatItemStyle}>
      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{value}</div>
    </div>
  )
}

interface ShopCardProps {
  icon: string
  title: string
  description: string
  meta: string
  cost?: number
  disabled: boolean
  disabledReason?: string
  onPurchase: () => void
  actionLabel: string
}

function ShopCard({ icon, title, description, meta, cost, disabled, disabledReason, onPurchase, actionLabel }: ShopCardProps) {
  return (
    <div style={{
      ...shopCardStyle,
      opacity: disabled ? 0.55 : 1,
      borderColor: disabled ? 'rgba(255,255,255,0.08)' : 'rgba(0, 212, 170, 0.25)',
    }}>
      <div style={cardHeaderStyle}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: '10px', color: '#00d4aa', marginTop: '2px' }}>{meta}</div>
        </div>
        {cost !== undefined && (
          <div style={costBadgeStyle}>{cost.toLocaleString()} HC</div>
        )}
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '8px 0', lineHeight: 1.4 }}>{description}</p>
      <button
        type="button"
        onClick={onPurchase}
        disabled={disabled}
        title={disabledReason}
        style={{
          ...createButtonStyles({ variant: disabled ? 'secondary' : 'primary', size: 'sm', fullWidth: true }),
          minHeight: '44px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {disabled && disabledReason ? disabledReason : actionLabel}
      </button>
    </div>
  )
}

// =============================================================================
// Shop toggle button (exported for HUD / Operator Cabin)
// =============================================================================

export function HarborShopButton({ onClick }: { onClick: () => void }) {
  const { credits } = useEconomySystem()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...createGlassPanelStyles({ padding: '8px 12px' }),
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        border: hovered ? '1px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(255, 215, 0, 0.25)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        minHeight: '44px',
        minWidth: '44px',
      }}
      title="Open Harbor Shop"
    >
      <span style={{ fontSize: '16px' }}>🏗️</span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shop</div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffd700' }}>{credits.toLocaleString()} HC</div>
      </div>
    </button>
  )
}

// =============================================================================
// Styles
// =============================================================================

const shopContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxHeight: 'min(70vh, 600px)',
}

const balanceHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'space-between',
  alignItems: 'stretch',
}

const balanceItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  background: 'rgba(255, 215, 0, 0.08)',
  borderRadius: '10px',
  border: '1px solid rgba(255, 215, 0, 0.2)',
  flex: '1 1 140px',
}

const balanceIconStyle: React.CSSProperties = { fontSize: '22px' }
const balanceLabelStyle: React.CSSProperties = { fontSize: '10px', color: '#888', textTransform: 'uppercase' }
const balanceValueStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 700, color: '#ffd700', fontFamily: 'monospace' }

const repLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.12)',
  cursor: 'pointer',
  flex: '1 1 160px',
  minHeight: '44px',
}

const feedbackBannerStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(0, 212, 170, 0.15)',
  border: '1px solid rgba(0, 212, 170, 0.3)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#00d4aa',
  textAlign: 'center',
}

const boostsPanelStyle: React.CSSProperties = {
  padding: '10px',
  background: 'rgba(0, 212, 170, 0.06)',
  borderRadius: '10px',
  border: '1px solid rgba(0, 212, 170, 0.15)',
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: '8px',
}

const boostsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const boostChipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 10px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '6px',
  color: '#ccc',
}

const boostTimerStyle: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#00d4aa',
  fontWeight: 600,
}

const tabsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
}

const tabButtonBaseStyle: React.CSSProperties = {
  flex: '1 1 80px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: '44px',
  transition: 'all 0.15s ease',
}

const tabContentStyle: React.CSSProperties = {
  overflowY: 'auto',
  flex: 1,
  paddingRight: '4px',
}

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '10px',
}

const shopCardStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '12px',
  border: '1px solid',
  display: 'flex',
  flexDirection: 'column',
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
}

const costBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#ffd700',
  background: 'rgba(255, 215, 0, 0.12)',
  padding: '4px 8px',
  borderRadius: '6px',
  whiteSpace: 'nowrap',
}

const shiftPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

const shiftStatsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '10px',
}

const shiftStatItemStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '10px',
  textAlign: 'center',
  border: '1px solid rgba(255,255,255,0.08)',
}

const shiftHintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.6)',
  lineHeight: 1.5,
  margin: 0,
}

const summaryContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  fontSize: '13px',
  color: '#ccc',
}

const summaryValueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffd700',
  fontFamily: 'monospace',
}
