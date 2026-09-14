// =============================================================================
// TRAINING SYSTEM - Rank & Score Calculation
// =============================================================================

import { TrainingMetrics, TrainingRank } from './trainingTypes'

export function calculateRank(metrics: TrainingMetrics): TrainingRank {
  const { timeElapsed, maxSway, totalDamage, accuracyScore } = metrics

  // S-Rank: Perfect execution
  if (maxSway < 0.15 && totalDamage === 0 && accuracyScore >= 95) return 'S'

  // A-Rank: Excellent
  if (maxSway < 0.25 && totalDamage < 10 && accuracyScore >= 85) return 'A'

  // B-Rank: Good
  if (maxSway < 0.4 && totalDamage < 30 && accuracyScore >= 70) return 'B'

  // C-Rank: Pass
  if (accuracyScore >= 50) return 'C'

  // F-Rank: Fail
  return 'F'
}

export function calculateScore(metrics: TrainingMetrics): number {
  const baseScore = 1000

  // Time bonus (faster = better, up to 500 pts)
  const timeBonus = Math.max(0, 500 - metrics.timeElapsed * 2)

  // Sway penalty (high sway = penalty, up to -300 pts)
  const swayPenalty = metrics.maxSway * 300

  // Damage penalty (damage = penalty, up to -400 pts)
  const damagePenalty = metrics.totalDamage * 10

  // Accuracy bonus (accuracy % * 5, up to 500 pts)
  const accuracyBonus = metrics.accuracyScore * 5

  return Math.max(0, Math.round(baseScore + timeBonus - swayPenalty - damagePenalty + accuracyBonus))
}

export function getRankColor(rank: TrainingRank): string {
  switch (rank) {
    case 'S': return '#ffd700' // Gold
    case 'A': return '#00d4aa' // Teal
    case 'B': return '#4a9eff' // Blue
    case 'C': return '#888888' // Gray
    case 'F': return '#ff4757' // Red
  }
}

export function getRankDescription(rank: TrainingRank): string {
  switch (rank) {
    case 'S': return 'Perfect Execution'
    case 'A': return 'Excellent'
    case 'B': return 'Good'
    case 'C': return 'Pass'
    case 'F': return 'Needs Improvement'
  }
}
