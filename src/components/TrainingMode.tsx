// =============================================================================
// TRAINING MODE COMPONENT - HarborGlow Crane Operator Training
// Training Hub UI and Active Module Interface
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useTrainingSystem, TRAINING_MODULES, TrainingModuleId, getRankColor, getRankDescription, TrainingResult } from '../systems/trainingSystem'
import { GLASSMORPHISM } from './DesignSystem'

// =============================================================================
// TRAINING MODE PROPS
// =============================================================================

export interface TrainingModeProps {
  onExit: () => void
  onStartModule: (moduleId: TrainingModuleId) => void
}

// =============================================================================
// MAIN TRAINING MODE COMPONENT
// =============================================================================

export default function TrainingMode({ onExit, onStartModule }: TrainingModeProps) {
  const [view, setView] = useState<'hub' | 'details' | 'results'>('hub')
  const [selectedModule, setSelectedModule] = useState<TrainingModuleId | null>(null)
  const training = useTrainingSystem()
  const { progress } = training

  const handleSelectModule = (moduleId: TrainingModuleId) => {
    setSelectedModule(moduleId)
    setView('details')
  }

  const handleStartModule = () => {
    if (selectedModule && training.isModuleAvailable(selectedModule)) {
      onStartModule(selectedModule)
    }
  }

  const handleBackToHub = () => {
    setView('hub')
    setSelectedModule(null)
  }

  return (
    <div style={containerStyle}>
      <div style={backgroundStyle}>
        <div style={gradientOverlayStyle} />
      </div>

      <div style={contentStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div style={logoContainerStyle}>
            <span style={iconStyle}>🏗️</span>
            <div>
              <h1 style={titleStyle}>Training Center</h1>
              <p style={subtitleStyle}>Crane Operator Certification Program</p>
            </div>
          </div>
          
          {/* Stats */}
          <div style={statsContainerStyle}>
            <StatBadge 
              label="Modules"
              value={`${progress.results.length}/${TRAINING_MODULES.length}`}
              color="#00d4aa"
            />
            <StatBadge 
              label="Total Score"
              value={progress.totalScore.toLocaleString()}
              color="#4a9eff"
            />
            <StatBadge 
              label="Reputation Bonus"
              value={`+${progress.permanentReputationBonus}`}
              color="#ffd700"
            />
          </div>
          
          {/* Exit Button */}
          <button style={exitButtonStyle} onClick={onExit}>
            <span>✕</span>
            <span>Exit Training</span>
          </button>
        </header>

        {/* Main Content */}
        <main style={mainStyle}>
          {view === 'hub' && <TrainingHub onSelectModule={handleSelectModule} />}
          {view === 'details' && selectedModule && (
            <ModuleDetails 
              moduleId={selectedModule}
              onBack={handleBackToHub}
              onStart={handleStartModule}
              isAvailable={training.isModuleAvailable(selectedModule)}
              isCompleted={training.isModuleCompleted(selectedModule)}
              bestResult={training.getBestResult(selectedModule)}
            />
          )}
        </main>

        {/* Footer */}
        <footer style={footerStyle}>
          <div style={legendStyle}>
            <LegendItem icon="⭐" label="Locked" color="#666" />
            <LegendItem icon="▶️" label="Available" color="#00d4aa" />
            <LegendItem icon="✓" label="Completed" color="#4a9eff" />
          </div>
          <p style={tipStyle}>Tip: Complete modules to unlock new training scenarios and earn reputation bonuses</p>
        </footer>
      </div>
    </div>
  )
}

// =============================================================================
// TRAINING HUB - Module Selection Grid
// =============================================================================

interface TrainingHubProps {
  onSelectModule: (moduleId: TrainingModuleId) => void
}

function TrainingHub({ onSelectModule }: TrainingHubProps) {
  const { progress, isModuleAvailable, isModuleCompleted, getBestResult } = useTrainingSystem()

  return (
    <div style={hubStyle}>
      <div style={modulesGridStyle}>
        {TRAINING_MODULES.map((module, index) => {
          const state = progress.moduleStates[module.id]
          const isAvailable = isModuleAvailable(module.id)
          const isCompleted = isModuleCompleted(module.id)
          const bestResult = getBestResult(module.id)
          
          return (
            <ModuleCard
              key={module.id}
              module={module}
              state={state}
              index={index + 1}
              isAvailable={isAvailable}
              isCompleted={isCompleted}
              bestResult={bestResult}
              onClick={() => onSelectModule(module.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// MODULE CARD
// =============================================================================

interface ModuleCardProps {
  module: typeof TRAINING_MODULES[0]
  state: string
  index: number
  isAvailable: boolean
  isCompleted: boolean
  bestResult: TrainingResult | undefined
  onClick: () => void
}

function ModuleCard({ module, state, index, isAvailable, isCompleted, bestResult, onClick }: ModuleCardProps) {
  const difficultyStars = '★'.repeat(module.difficulty) + '☆'.repeat(5 - module.difficulty)
  
  const getStatusIcon = () => {
    if (state === 'locked') return '🔒'
    if (isCompleted) return '🏆'
    if (state === 'in-progress') return '⏳'
    return '▶️'
  }

  const getCardStyle = (): React.CSSProperties => ({
    ...moduleCardStyle,
    opacity: state === 'locked' ? 0.6 : 1,
    cursor: isAvailable ? 'pointer' : 'not-allowed',
    borderColor: isCompleted 
      ? getRankColor(bestResult?.rank || 'C') + '60'
      : isAvailable 
        ? '#00d4aa40' 
        : '#333',
    boxShadow: isCompleted
      ? `0 4px 20px ${getRankColor(bestResult?.rank || 'C')}20`
      : isAvailable
        ? '0 4px 20px rgba(0,212,170,0.15)'
        : 'none'
  })

  return (
    <div 
      style={getCardStyle()}
      onClick={() => isAvailable && onClick()}
    >
      {/* Module Number */}
      <div style={moduleNumberStyle}>{index}</div>
      
      {/* Status Icon */}
      <div style={statusIconStyle}>{getStatusIcon()}</div>
      
      {/* Content */}
      <div style={moduleContentStyle}>
        <h3 style={moduleTitleStyle}>{module.title}</h3>
        <p style={moduleDescriptionStyle}>{module.description}</p>
        
        {/* Difficulty */}
        <div style={difficultyStyle}>
          <span style={{ color: '#666', fontSize: '11px' }}>Difficulty:</span>
          <span style={{ 
            color: module.difficulty <= 2 ? '#00d4aa' : module.difficulty <= 3 ? '#ff9500' : '#ff4757',
            fontSize: '12px',
            letterSpacing: '2px'
          }}>
            {difficultyStars}
          </span>
        </div>
        
        {/* Meta Info */}
        <div style={moduleMetaStyle}>
          <MetaItem icon="⏱️" value={`${module.estimatedTime}min`} />
          <MetaItem icon="🚢" value={module.shipType} />
        </div>
      </div>
      
      {/* Best Result Badge */}
      {isCompleted && bestResult && (
        <div style={{
          ...rankBadgeStyle,
          background: getRankColor(bestResult.rank) + '30',
          borderColor: getRankColor(bestResult.rank) + '60',
          color: getRankColor(bestResult.rank)
        }}>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>{bestResult.rank}</span>
          <span style={{ fontSize: '10px' }}>{bestResult.score.toLocaleString()}</span>
        </div>
      )}
      
      {/* Locked Overlay */}
      {state === 'locked' && (
        <div style={lockedOverlayStyle}>
          <span style={{ fontSize: '24px' }}>🔒</span>
          <span style={{ fontSize: '11px', color: '#666' }}>Complete prerequisites</span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MODULE DETAILS
// =============================================================================

interface ModuleDetailsProps {
  moduleId: TrainingModuleId
  onBack: () => void
  onStart: () => void
  isAvailable: boolean
  isCompleted: boolean
  bestResult: TrainingResult | undefined
}

function ModuleDetails({ moduleId, onBack, onStart, isAvailable, isCompleted, bestResult }: ModuleDetailsProps) {
  const training = useTrainingSystem()
  const module = TRAINING_MODULES.find(m => m.id === moduleId)
  if (!module) return null

  const difficultyStars = '★'.repeat(module.difficulty) + '☆'.repeat(5 - module.difficulty)

  return (
    <div style={detailsStyle}>
      {/* Back Button */}
      <button style={backButtonStyle} onClick={onBack}>
        <span>←</span> Back to Hub
      </button>

      <div style={detailsGridStyle}>
        {/* Left Column - Info */}
        <div style={detailsLeftStyle}>
          <div style={detailsHeaderStyle}>
            <h2 style={detailsTitleStyle}>{module.title}</h2>
            <div style={difficultyLargeStyle}>
              <span style={{ color: '#666' }}>Difficulty:</span>
              <span style={{ 
                color: module.difficulty <= 2 ? '#00d4aa' : module.difficulty <= 3 ? '#ff9500' : '#ff4757',
                letterSpacing: '3px'
              }}>
                {difficultyStars}
              </span>
            </div>
          </div>
          
          <p style={detailsDescriptionStyle}>{module.description}</p>
          
          {/* Conditions */}
          <div style={conditionsSectionStyle}>
            <h4 style={sectionTitleStyle}>Training Conditions</h4>
            <div style={conditionsGridStyle}>
              <ConditionItem icon="🚢" label="Ship Type" value={module.shipType} />
              <ConditionItem icon="🌤️" label="Weather" value={module.weather} />
              <ConditionItem icon="🕐" label="Time" value={`${module.timeOfDay}:00`} />
              <ConditionItem icon="⏱️" label="Duration" value={`~${module.estimatedTime} min`} />
            </div>
          </div>
          
          {/* Objectives */}
          <div style={objectivesSectionStyle}>
            <h4 style={sectionTitleStyle}>Training Objectives</h4>
            <ul style={objectivesListStyle}>
              {module.objectives.map((obj, i) => (
                <li key={obj.id} style={objectiveItemStyle}>
                  <span style={objectiveNumberStyle}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{obj.title}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{obj.description}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Rewards */}
          <div style={rewardsSectionStyle}>
            <h4 style={sectionTitleStyle}>Completion Rewards</h4>
            <div style={rewardsListStyle}>
              <RewardItem icon="⭐" label={`+${module.rewards.reputation} Reputation`} color="#ffd700" />
              {module.rewards.unlocks.map((unlock, i) => (
                <RewardItem 
                  key={i} 
                  icon="🎁" 
                  label={unlock.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  color="#00d4aa"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Start */}
        <div style={detailsRightStyle}>
          {/* Best Result Card */}
          {isCompleted && bestResult ? (
            <div style={resultCardStyle}>
              <h4 style={sectionTitleStyle}>Best Performance</h4>
              <div style={{
                ...rankLargeStyle,
                color: getRankColor(bestResult.rank),
                textShadow: `0 0 30px ${getRankColor(bestResult.rank)}60`
              }}>
                {bestResult.rank}
              </div>
              <div style={rankDescriptionStyle}>{getRankDescription(bestResult.rank)}</div>
              
              <div style={statsListStyle}>
                <StatRow label="Score" value={bestResult.score.toLocaleString()} />
                <StatRow label="Time" value={`${Math.floor(bestResult.metrics.timeElapsed / 60)}:${String(bestResult.metrics.timeElapsed % 60).padStart(2, '0')}`} />
                <StatRow label="Max Sway" value={`${Math.round(bestResult.metrics.maxSway * 100)}%`} />
                <StatRow label="Accuracy" value={`${Math.round(bestResult.metrics.accuracyScore)}%`} />
                <StatRow label="Attempts" value={bestResult.attempts.toString()} />
              </div>
            </div>
          ) : (
            <div style={noResultCardStyle}>
              <span style={{ fontSize: '48px', opacity: 0.3 }}>🏗️</span>
              <p style={{ color: '#666', textAlign: 'center' }}>
                Complete this module to see your performance statistics
              </p>
            </div>
          )}
          
          {/* Prerequisites */}
          {module.prerequisites.length > 0 && (
            <div style={prerequisitesStyle}>
              <h4 style={{ ...sectionTitleStyle, fontSize: '12px' }}>Prerequisites</h4>
              <div style={prereqsListStyle}>
                {module.prerequisites.map(prereqId => {
                  const prereq = TRAINING_MODULES.find(m => m.id === prereqId)
                  const isMet = training.isModuleCompleted(prereqId)
                  return (
                    <div key={prereqId} style={{
                      ...prereqItemStyle,
                      background: isMet ? '#00d4aa20' : '#ff475720',
                      borderColor: isMet ? '#00d4aa40' : '#ff475740'
                    }}>
                      <span>{isMet ? '✓' : '○'}</span>
                      <span style={{ fontSize: '12px' }}>{prereq?.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Start Button */}
          <button 
            style={{
              ...startButtonStyle,
              opacity: isAvailable ? 1 : 0.5,
              cursor: isAvailable ? 'pointer' : 'not-allowed',
              background: isCompleted 
                ? `linear-gradient(135deg, ${getRankColor(bestResult?.rank || 'C')}40, ${getRankColor(bestResult?.rank || 'C')}20)`
                : 'linear-gradient(135deg, #00d4aa40, #00a88430)'
            }}
            onClick={onStart}
            disabled={!isAvailable}
          >
            <span style={{ fontSize: '24px' }}>{isCompleted ? '↻' : '▶️'}</span>
            <span>{isCompleted ? 'Retry Module' : 'Start Training'}</span>
          </button>
          
          {!isAvailable && (
            <p style={lockedMessageStyle}>
              Complete all prerequisites to unlock this module
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ ...statBadgeStyle, borderColor: color + '40' }}>
      <span style={{ ...statValueStyle, color }}>{value}</span>
      <span style={statLabelStyle}>{label}</span>
    </div>
  )
}

function LegendItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={legendItemStyle}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ fontSize: '11px', color }}>{label}</span>
    </div>
  )
}

function MetaItem({ icon, value }: { icon: string; value: string }) {
  return (
    <div style={metaItemStyle}>
      <span style={{ fontSize: '12px' }}>{icon}</span>
      <span style={{ fontSize: '11px', color: '#888', textTransform: 'capitalize' }}>{value}</span>
    </div>
  )
}

function ConditionItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={conditionItemStyle}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '10px', color: '#666' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#fff', textTransform: 'capitalize' }}>{value}</div>
      </div>
    </div>
  )
}

function RewardItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ ...rewardItemStyle, background: color + '15', borderColor: color + '30' }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ fontSize: '12px', color }}>{label}</span>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={statRowStyle}>
      <span style={{ color: '#888', fontSize: '12px' }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  background: '#0a0f1a',
  fontFamily: 'Inter, system-ui, sans-serif',
  overflow: 'hidden'
}

const backgroundStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: `
    radial-gradient(ellipse at 20% 0%, rgba(0,212,170,0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(74,158,255,0.08) 0%, transparent 50%),
    linear-gradient(180deg, #0a0f1a 0%, #0d1520 100%)
  `,
  zIndex: 0
}

const gradientOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E")',
  opacity: 0.5
}

const contentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: '24px 32px',
  gap: '20px'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(255,255,255,0.1)'
}

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}

const iconStyle: React.CSSProperties = {
  fontSize: '36px',
  filter: 'drop-shadow(0 0 10px rgba(0,212,170,0.5))'
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #fff 0%, #00d4aa 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#888',
  letterSpacing: '0.5px'
}

const statsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px'
}

const statBadgeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  minWidth: '80px'
}

const statValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  fontFamily: 'monospace'
}

const statLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

const exitButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  background: 'rgba(255,71,87,0.1)',
  border: '1px solid rgba(255,71,87,0.3)',
  borderRadius: '8px',
  color: '#ff4757',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    background: 'rgba(255,71,87,0.2)'
  }
} as React.CSSProperties

const mainStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

const hubStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '8px'
}

const modulesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '16px',
  padding: '8px'
}

const moduleCardStyle: React.CSSProperties = {
  position: 'relative',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  transition: 'all 0.2s',
  ':hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(0,212,170,0.3)'
  }
} as React.CSSProperties

const moduleNumberStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,212,170,0.2)',
  border: '1px solid rgba(0,212,170,0.3)',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#00d4aa'
}

const statusIconStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  fontSize: '20px'
}

const moduleContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  paddingTop: '20px'
}

const moduleTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff'
}

const moduleDescriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#888',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}

const difficultyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '4px'
}

const moduleMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginTop: '8px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.05)'
}

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const rankBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '12px',
  right: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '6px 12px',
  border: '1px solid',
  borderRadius: '6px'
}

const lockedOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '12px',
  backdropFilter: 'blur(2px)'
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.1)'
}

const legendStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px'
}

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const tipStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#666',
  fontStyle: 'italic'
}

// Details View Styles
const detailsStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

const backButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  alignSelf: 'flex-start',
  ':hover': {
    background: 'rgba(255,255,255,0.1)'
  }
} as React.CSSProperties

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '24px',
  flex: 1
}

const detailsLeftStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
}

const detailsRightStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const detailsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const detailsTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '32px',
  fontWeight: 700,
  color: '#fff'
}

const difficultyLargeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '14px'
}

const detailsDescriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#aaa',
  lineHeight: 1.6
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '13px',
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '1px'
}

const conditionsSectionStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

const conditionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px'
}

const conditionItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

const objectivesSectionStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

const objectivesListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const objectiveItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

const objectiveNumberStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,212,170,0.2)',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#00d4aa',
  flexShrink: 0
}

const rewardsSectionStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

const rewardsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const rewardItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  border: '1px solid',
  borderRadius: '8px'
}

const resultCardStyle: React.CSSProperties = {
  padding: '24px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  textAlign: 'center'
}

const noResultCardStyle: React.CSSProperties = {
  padding: '48px 24px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px'
}

const rankLargeStyle: React.CSSProperties = {
  fontSize: '72px',
  fontWeight: 800,
  lineHeight: 1,
  margin: '16px 0'
}

const rankDescriptionStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
  marginBottom: '20px'
}

const statsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.1)'
}

const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0'
}

const prerequisitesStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

const prereqsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const prereqItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  border: '1px solid',
  borderRadius: '6px',
  fontSize: '12px'
}

const startButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '16px 32px',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginTop: 'auto',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,212,170,0.3)'
  }
} as React.CSSProperties

const lockedMessageStyle: React.CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontSize: '12px',
  color: '#ff4757'
}
