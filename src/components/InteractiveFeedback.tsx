import { useState, useRef, useCallback, ReactNode } from 'react'
import { GLASSMORPHISM, SHIP_COLORS, createProgressRingStyles } from './DesignSystem'

// =============================================================================
// PHASE 6.3: INTERACTIVE FEEDBACK SYSTEM
// Ripple effects, progress rings, haptic-style animations
// =============================================================================

interface RippleButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  color?: string
  glowColor?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  success?: boolean
  className?: string
  style?: React.CSSProperties
}

// Ripple effect button with haptic feedback
export function RippleButton({
  children,
  onClick,
  disabled = false,
  color = '#fff',
  glowColor,
  size = 'md',
  fullWidth = true,
  variant = 'secondary',
  loading = false,
  success = false,
  style = {}
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [isPressed, setIsPressed] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    
    const button = buttonRef.current
    if (!button) return
    
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple = { id: Date.now(), x, y }
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
    
    onClick?.()
  }, [disabled, loading, onClick])

  const sizeStyles = {
    sm: { padding: '8px 12px', fontSize: '11px', minHeight: '32px' },
    md: { padding: '12px 16px', fontSize: '13px', minHeight: '44px' },
    lg: { padding: '16px 20px', fontSize: '14px', minHeight: '56px' }
  }

  const variantStyles = {
    primary: {
      background: success ? 'linear-gradient(135deg, #00d4aa, #00ffb8)' : (glowColor || color),
      color: '#000',
      border: 'none',
      boxShadow: success 
        ? '0 4px 20px rgba(0, 212, 170, 0.5)' 
        : `0 4px 20px ${glowColor || color}40`
    },
    secondary: {
      background: isPressed 
        ? 'rgba(255,255,255,0.15)' 
        : 'rgba(255,255,255,0.08)',
      color,
      border: `1px solid ${success ? '#00d4aa' : color}40`,
      boxShadow: glowColor ? `0 0 20px ${glowColor}30` : 'none'
    },
    ghost: {
      background: isPressed ? 'rgba(255,255,255,0.1)' : 'transparent',
      color,
      border: '1px solid transparent',
      boxShadow: 'none'
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        borderRadius: GLASSMORPHISM.borderRadiusSmall,
        fontWeight: 600,
        letterSpacing: '0.5px',
        cursor: disabled ? 'not-allowed' : loading ? 'wait' : 'pointer',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: '4px',
            height: '4px',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'rippleEffect 0.6s ease-out forwards',
            pointerEvents: 'none'
          }}
        />
      ))}
      
      {/* Loading spinner */}
      {loading && (
        <span 
          style={{
            width: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px',
            height: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'currentColor',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} 
        />
      )}
      
      {/* Success checkmark */}
      {success && !loading && (
        <svg 
          width={size === 'sm' ? 14 : size === 'md' ? 16 : 20}
          height={size === 'sm' ? 14 : size === 'md' ? 16 : 20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: 'checkmarkPop 0.3s ease-out' }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      
      <style>{
        `
        @keyframes rippleEffect {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(50); opacity: 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes checkmarkPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        `
      }</style>
    </button>
  )
}

// Progress ring for installation feedback
interface ProgressRingProps {
  progress: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode
  label?: string
}

export function ProgressRing({ 
  progress, 
  color = '#00d4aa', 
  size = 'md',
  children,
  label 
}: ProgressRingProps) {
  const dimensions = {
    sm: { radius: 20, strokeWidth: 3, fontSize: 10 },
    md: { radius: 32, strokeWidth: 4, fontSize: 14 },
    lg: { radius: 48, strokeWidth: 6, fontSize: 18 }
  }
  
  const { radius, strokeWidth, fontSize } = dimensions[size]
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  const styles = createProgressRingStyles(normalizedRadius, strokeWidth, color)
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} style={styles.svg}>
          {/* Track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.3s ease',
              filter: `drop-shadow(0 0 6px ${color})`
            }}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        
        {/* Center content */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize,
          fontWeight: 700,
          color: progress >= 100 ? color : '#fff'
        }}>
          {children || `${Math.round(progress)}%`}
        </div>
      </div>
      
      {label && (
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      )}
    </div>
  )
}

// Installation progress with animated steps
interface InstallationProgressProps {
  steps: string[]
  currentStep: number
  color?: string
}

export function InstallationProgress({ steps, currentStep, color = '#00d4aa' }: InstallationProgressProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        
        return (
          <div 
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '10px',
              background: isActive ? `${color}15` : 'transparent',
              border: isActive ? `1px solid ${color}40` : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isCompleted ? color : isActive ? `${color}30` : 'rgba(255,255,255,0.1)',
              color: isCompleted || isActive ? '#000' : 'rgba(255,255,255,0.5)',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.3s ease'
            }}>
              {isCompleted ? '✓' : index + 1}
            </div>
            
            <span style={{
              fontSize: '13px',
              color: isActive ? '#fff' : isCompleted ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.3s ease'
            }}>
              {step}
            </span>
            
            {isActive && (
              <span style={{
                marginLeft: 'auto',
                width: '16px',
                height: '16px',
                border: `2px solid ${color}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Toast notification system
interface ToastProps {
  message: string
  type?: 'success' | 'info' | 'warning' | 'error'
  shipType?: 'cruise' | 'container' | 'tanker'
  onClose?: () => void
}

export function Toast({ message, type = 'info', shipType, onClose }: ToastProps) {
  const colors = shipType ? SHIP_COLORS[shipType] : {
    primary: type === 'success' ? '#00d4aa' : type === 'warning' ? '#ff9500' : type === 'error' ? '#ff4757' : '#00c8ff',
    glow: type === 'success' ? '#00d4aa80' : type === 'warning' ? '#ff950080' : type === 'error' ? '#ff475780' : '#00c8ff80'
  }
  
  const icons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕'
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '20px',
      padding: '16px 24px',
      background: GLASSMORPHISM.background,
      backdropFilter: GLASSMORPHISM.backdropFilter,
      borderRadius: GLASSMORPHISM.borderRadius,
      border: `1px solid ${colors.primary}40`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${colors.glow}`,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideInRight 0.4s ease-out, fadeOut 0.3s ease-in 4.7s forwards',
      zIndex: 10000
    }}>
      <span style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: colors.primary,
        color: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 700
      }}>
        {icons[type]}
      </span>
      
      <span style={{ color: '#fff', fontSize: '14px' }}>{message}</span>
      
      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginLeft: '8px',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            lineHeight: 1
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

// Ship spawn splash effect
interface SpawnSplashProps {
  shipType: 'cruise' | 'container' | 'tanker'
  onComplete?: () => void
}

export function SpawnSplash({ shipType, onComplete }: SpawnSplashProps) {
  const colors = SHIP_COLORS[shipType]
  
  setTimeout(() => onComplete?.(), 1500)
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        animation: 'spawnPulse 1.5s ease-out forwards'
      }} />
      
      <style>{
        `
        @keyframes spawnPulse {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(2); opacity: 0.8; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes fadeOut {
          to { opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        `
      }</style>
    </div>
  )
}
