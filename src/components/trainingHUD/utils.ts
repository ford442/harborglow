import { TrainingMetrics } from '../../systems/trainingSystem';

export function getRankColor(rank: string) {
  switch (rank) {
    case 'S': return '#ffd700'
    case 'A': return '#00d4aa'
    case 'B': return '#4da6ff'
    case 'C': return '#ffa64d'
    default: return '#ff4d4d'
  }
}

export function calculateScore(metrics: TrainingMetrics) {
  let score = 10000;
  score -= metrics.totalDamage * 100;
  score -= (metrics.maxSway > 0.5 ? 2000 : metrics.maxSway * 1000);
  score *= (metrics.accuracyScore / 100);
  return Math.max(0, Math.round(score));
}

export function calculateRank(score: number) {
  if (score >= 9000) return 'S';
  if (score >= 7500) return 'A';
  if (score >= 5000) return 'B';
  if (score >= 2500) return 'C';
  return 'D';
}