// =============================================================================
// REPUTATION PANEL - HarborGlow
// Displays reputation, tier progress, and unlocks
// =============================================================================

import { useState } from 'react'
import { useReputationSystem, REPUTATION_TIERS, UNLOCKABLE_SHIPS, UNLOCKABLE_LIGHT_RIGS, UNLOCKABLE_TRAINING, UNLOCKABLE_HARBORS } from '../systems/reputationSystem'

// =============================================================================
// REPUTATION PANEL COMPONENT
// =============================================================================

export default function ReputationPanel() {
  const { state, tierConfig, progress, isUnlocked } = useReputationSystem()
  const [activeTab, setActiveTab] = useState<'overview' | 'ships' | 'rigs' | 'training' | 'harbors'>('overview')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div style={containerStyle}>
      {/* Compact Header - Always Visible */}
      <button style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={tierBadgeStyle}>
          <span style={{ fontSize: '20px' }}>{tierConfig.badge}</span>
          <div>
            <div style={{ fontSize: '11px', color: tierConfig.color, fontWeight: 600 }}>
              {tierConfig.name}
            </div>
            <div style={{ fontSize: '10px', color: '#888' }}>
              {state.totalReputation.toLocaleString()} rep
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={miniProgressContainerStyle}>
          <div style={{ ...miniProgressFillStyle, width: `${progress.progress}%`, background: tierConfig.color }} />
        </div>
        
        <span style={{ fontSize: '12px', color: '#666', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={expandedContentStyle}>
          {/* Tabs */}
          <div style={tabsContainerStyle}>
            <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <TabButton label="Ships" active={activeTab === 'ships'} onClick={() => setActiveTab('ships')} count={state.unlocks.ships.length} />
            <TabButton label="Rigs" active={activeTab === 'rigs'} onClick={() => setActiveTab('rigs')} count={state.unlocks.lightRigs.length} />
            <TabButton label="Training" active={activeTab === 'training'} onClick={() => setActiveTab('training')} count={state.unlocks.training.length} />
          </div>

          {/* Tab Content */}
          <div style={tabContentStyle}>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'ships' && <UnlocksTab items={UNLOCKABLE_SHIPS} type="ship" />}
            {activeTab === 'rigs' && <UnlocksTab items={UNLOCKABLE_LIGHT_RIGS} type="lightRig" />}
            {activeTab === 'training' && <UnlocksTab items={UNLOCKABLE_TRAINING} type="training" />}
            {activeTab === 'harbors' && <UnlocksTab items={UNLOCKABLE_HARBORS} type="harbor" />}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// TAB COMPONENTS
// =============================================================================

function TabButton({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button 
      style={{ ...tabButtonStyle, background: active ? 'rgba(0,212,170,0.2)' : 'transparent', color: active ? '#00d4aa' : '#888' }}
      onClick={onClick}
    >
      {label}
      {count !== undefined && (
        <span style={{ ...tabCountStyle, background: active ? '#00d4aa' : '#444', color: active ? '#000' : '#fff' }}>
          {count}
        </span>
      )}
    </button>
  )
}

function OverviewTab() {
  const { state, tierConfig, progress } = useReputationSystem()

  return (
    <div style={overviewStyle}>
      {/* Tier Display */}
      <div style={tierDisplayStyle}>
        <div style={{ ...tierIconStyle, background: tierConfig.color + '20', borderColor: tierConfig.color + '40' }}>
          <span style={{ fontSize: '32px' }}>{tierConfig.badge}</span>
        </div>
        <div>
          <h3 style={{ margin: 0, color: tierConfig.color, fontSize: '16px' }}>{tierConfig.name}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>{tierConfig.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={progressSectionStyle}>
        <div style={progressHeaderStyle}>
          <span style={{ fontSize: '12px', color: '#888' }}>Progress to Next Tier</span>
          <span style={{ fontSize: '12px', color: '#fff' }}>
            {state.totalReputation.toLocaleString()} / {progress.required.toLocaleString()}
          </span>
        </div>
        <div style={progressBarContainerStyle}>
          <div style={{ ...progressBarFillStyle, width: `${progress.progress}%`, background: tierConfig.color }} />
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
          {Math.round(progress.progress)}% complete
        </div>
      </div>

      {/* Stats */}
      <div style={statsGridStyle}>
        <StatBox label="Total Installations" value={state.stats.totalInstallations} icon="🔧" />
        <StatBox label="Perfect Installs" value={state.stats.perfectInstallations} icon="⭐" />
        <StatBox label="Ships Served" value={state.stats.shipsServed} icon="🚢" />
        <StatBox label="Events Handled" value={state.stats.eventsHandled} icon="🌊" />
        <StatBox label="Training Completed" value={state.stats.trainingCompleted} icon="🎓" />
        <StatBox label="Lifetime Rep" value={state.lifetimeReputation.toLocaleString()} icon="🏆" />
      </div>

      {/* Tier Roadmap */}
      <div style={roadmapStyle}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fff' }}>Tier Roadmap</h4>
        <div style={roadmapListStyle}>
          {Object.entries(REPUTATION_TIERS).map(([key, tier]) => {
            const isCurrent = key === state.tier
            const isUnlocked = state.totalReputation >= tier.minRep
            return (
              <div key={key} style={{ ...roadmapItemStyle, opacity: isUnlocked ? 1 : 0.4 }}>
                <span style={{ fontSize: '16px' }}>{tier.badge}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: isCurrent ? tier.color : '#fff', fontWeight: isCurrent ? 600 : 400 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{tier.minRep.toLocaleString()} rep</div>
                </div>
                {isCurrent && <span style={{ fontSize: '10px', color: tier.color }}>CURRENT</span>}
                {!isCurrent && isUnlocked && <span style={{ fontSize: '10px', color: '#00d4aa' }}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {state.recentGains.length > 0 && (
        <div style={recentActivityStyle}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fff' }}>Recent Activity</h4>
          <div style={activityListStyle}>
            {state.recentGains.slice(0, 5).map((gain, i) => (
              <div key={i} style={activityItemStyle}>
                <span style={{ fontSize: '11px', color: '#00d4aa' }}>+{gain.amount}</span>
                <span style={{ fontSize: '11px', color: '#888', flex: 1 }}>{formatSource(gain.source)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{formatTime(gain.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UnlocksTab({ items, type }: { items: typeof UNLOCKABLE_SHIPS; type: string }) {
  const { state, isUnlocked } = useReputationSystem()

  return (
    <div style={unlocksStyle}>
      <div style={unlocksGridStyle}>
        {items.map(item => {
          const unlocked = isUnlocked(type as any, item.id)
          return (
            <div 
              key={item.id} 
              style={{ 
                ...unlockCardStyle, 
                opacity: unlocked ? 1 : 0.5,
                borderColor: unlocked ? '#00d4aa40' : '#333'
              }}
            >
              <div style={{ ...unlockIconStyle, background: unlocked ? '#00d4aa20' : '#222' }}>
                <span style={{ fontSize: '24px', filter: unlocked ? 'none' : 'grayscale(100%)' }}>{item.icon}</span>
              </div>
              <div style={unlockInfoStyle}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: unlocked ? '#fff' : '#666' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '10px', color: '#888' }}>{item.description}</div>
                {!unlocked && (
                  <div style={{ fontSize: '10px', color: '#ff9500', marginTop: '4px' }}>
                    🔒 {item.reputationRequired.toLocaleString()} rep required
                  </div>
                )}
                {unlocked && (
                  <div style={{ fontSize: '10px', color: '#00d4aa', marginTop: '4px' }}>
                    ✓ Unlocked
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatBox({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div style={statBoxStyle}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{value}</span>
      <span style={{ fontSize: '10px', color: '#888' }}>{label}</span>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatSource(source: string): string {
  return source
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  width: '280px'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s',
  borderLeft: '3px solid transparent'
}

const tierBadgeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flex: 1
}

const miniProgressContainerStyle: React.CSSProperties = {
  width: '60px',
  height: '4px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '2px',
  overflow: 'hidden'
}

const miniProgressFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s'
}

const expandedContentStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  maxHeight: '70vh',
  overflow: 'auto'
}

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginBottom: '16px',
  padding: '4px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '8px'
}

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
}

const tabCountStyle: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '10px',
  fontSize: '9px'
}

const tabContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const overviewStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const tierDisplayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '12px'
}

const tierIconStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  border: '2px solid'
}

const progressSectionStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

const progressHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px'
}

const progressBarContainerStyle: React.CSSProperties = {
  height: '8px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '4px',
  overflow: 'hidden'
}

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s'
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px'
}

const statBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

const roadmapStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

const roadmapListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const roadmapItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '6px'
}

const recentActivityStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

const activityListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const activityItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '4px'
}

const unlocksStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const unlocksGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const unlockCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px',
  border: '1px solid transparent',
  transition: 'all 0.2s'
}

const unlockIconStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px'
}

const unlockInfoStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
}
