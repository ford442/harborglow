import { TRAINING_MODULES, TrainingModuleId, getRankColor, getRankDescription, TrainingResult, useTrainingSystem } from '../../systems/trainingSystem'
import {
  detailsStyle,
  backButtonStyle,
  detailsGridStyle,
  detailsLeftStyle,
  detailsHeaderStyle,
  detailsTitleStyle,
  difficultyLargeStyle,
  detailsDescriptionStyle,
  conditionsSectionStyle,
  sectionTitleStyle,
  conditionsGridStyle,
  objectivesSectionStyle,
  objectivesListStyle,
  objectiveItemStyle,
  objectiveNumberStyle,
  rewardsSectionStyle,
  rewardsListStyle,
  detailsRightStyle,
  resultCardStyle,
  rankLargeStyle,
  rankDescriptionStyle,
  statsListStyle,
  noResultCardStyle,
  prerequisitesStyle,
  prereqsListStyle,
  prereqItemStyle,
  startButtonStyle,
  lockedMessageStyle,
  conditionItemStyle,
  rewardItemStyle,
  statRowStyle
} from './trainingStyles'

// =============================================================================
// MODULE DETAILS - Training module information and statistics
// =============================================================================

interface ModuleDetailsProps {
  moduleId: TrainingModuleId
  onBack: () => void
  onStart: () => void
  isAvailable: boolean
  isCompleted: boolean
  bestResult: TrainingResult | undefined
}

export function ModuleDetails({ moduleId, onBack, onStart, isAvailable, isCompleted, bestResult }: ModuleDetailsProps) {
  const training = useTrainingSystem()
  const module = TRAINING_MODULES.find(m => m.id === moduleId)
  if (!module) return null

  const difficultyStars = '★'.repeat(module.difficulty) + '☆'.repeat(5 - module.difficulty)

  return (
    <div style={detailsStyle}>
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
