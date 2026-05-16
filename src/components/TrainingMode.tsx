import { useState } from 'react'
import { useTrainingSystem, TRAINING_MODULES, TrainingModuleId } from '../systems/trainingSystem'
import { TrainingHub, ModuleDetails } from './training'
import {
  containerStyle,
  backgroundStyle,
  gradientOverlayStyle,
  contentStyle,
  headerStyle,
  logoContainerStyle,
  iconStyle,
  titleStyle,
  subtitleStyle,
  statsContainerStyle,
  statBadgeStyle,
  statValueStyle,
  statLabelStyle,
  exitButtonStyle,
  mainStyle,
  footerStyle,
  legendStyle,
  legendItemStyle,
  tipStyle
} from './training/trainingStyles'

// =============================================================================
// TRAINING MODE COMPONENT - Orchestrator
// Thin wrapper composing extracted subcomponents and styles
// =============================================================================

export interface TrainingModeProps {
  onExit: () => void
  onStartModule: (moduleId: TrainingModuleId) => void
}

export default function TrainingMode({ onExit, onStartModule }: TrainingModeProps) {
  const [view, setView] = useState<'hub' | 'details'>('hub')
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
        {/* HEADER */}
        <header style={headerStyle}>
          <div style={logoContainerStyle}>
            <span style={iconStyle}>🏗️</span>
            <div>
              <h1 style={titleStyle}>Training Center</h1>
              <p style={subtitleStyle}>Crane Operator Certification Program</p>
            </div>
          </div>
          
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
          
          <button style={exitButtonStyle} onClick={onExit}>
            <span>✕</span>
            <span>Exit Training</span>
          </button>
        </header>

        {/* MAIN CONTENT */}
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

        {/* FOOTER */}
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
