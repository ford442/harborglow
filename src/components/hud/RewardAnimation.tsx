// =============================================================================
// REWARD ANIMATION — HarborGlow Mission Rewards
// Pops up when a mission is completed or failed.
// =============================================================================

import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { TYPOGRAPHY } from '../DesignSystem'

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RewardAnimation() {
  const activeMission = useGameStore((s) => s.activeMission)
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState(0)
  const [isSuccess, setIsSuccess] = useState(true)

  useEffect(() => {
    if (!activeMission) return

    if (activeMission.status === 'completed') {
      setIsSuccess(true)
      setAmount(activeMission.reward)
      setMessage('Mission Complete!')
      setShow(true)
      const t = setTimeout(() => setShow(false), 4000)
      return () => clearTimeout(t)
    }

    if (activeMission.status === 'failed') {
      setIsSuccess(false)
      setAmount(100)
      setMessage('Mission Failed')
      setShow(true)
      const t = setTimeout(() => setShow(false), 4000)
      return () => clearTimeout(t)
    }
  }, [activeMission?.status])

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        pointerEvents: 'none',
        fontFamily: TYPOGRAPHY.fontFamily,
      }}
    >
      <div
        style={{
          animation: 'rewardPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            marginBottom: '16px',
            animation: 'rewardFloat 2s ease-in-out infinite',
          }}
        >
          {isSuccess ? '💰' : '💥'}
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: isSuccess ? '#ffd700' : '#ff4444',
            textShadow: isSuccess
              ? '0 0 40px rgba(255, 215, 0, 0.5)'
              : '0 0 40px rgba(255, 68, 68, 0.5)',
            marginBottom: '8px',
          }}
        >
          {message}
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {isSuccess ? `+$${amount.toLocaleString()}` : `-$${amount.toLocaleString()}`}
        </div>
      </div>

      <style>{`
        @keyframes rewardPop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes rewardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
