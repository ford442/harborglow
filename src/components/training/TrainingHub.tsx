import { TRAINING_MODULES, TrainingModuleId, getRankColor, TrainingResult, useTrainingSystem } from '../../systems/trainingSystem'
import { 
  moduleCardStyle, 
  moduleNumberStyle, 
  statusIconStyle, 
  moduleContentStyle, 
  moduleTitleStyle, 
  moduleDescriptionStyle, 
  difficultyStyle, 
  moduleMetaStyle, 
  rankBadgeStyle, 
  lockedOverlayStyle,
  hubStyle,
  modulesGridStyle
} from './trainingStyles'

// =============================================================================
// TRAINING HUB - Module Selection Grid
// =============================================================================

interface TrainingHubProps {
  onSelectModule: (moduleId: TrainingModuleId) => void
}

export function TrainingHub({ onSelectModule }: TrainingHubProps) {
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
      <div style={moduleNumberStyle}>{index}</div>
      
      <div style={statusIconStyle}>{getStatusIcon()}</div>
      
      <div style={moduleContentStyle}>
        <h3 style={moduleTitleStyle}>{module.title}</h3>
        <p style={moduleDescriptionStyle}>{module.description}</p>
        
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
        
        <div style={moduleMetaStyle}>
          <MetaItem icon="⏱️" value={`${module.estimatedTime}min`} />
          <MetaItem icon="🚢" value={module.shipType} />
        </div>
      </div>
      
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
// HELPERS
// =============================================================================

interface MetaItemProps {
  icon: string
  value: string
}

function MetaItem({ icon, value }: MetaItemProps) {
  return (
    <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span>{icon}</span>
      <span>{value}</span>
    </span>
  )
}
