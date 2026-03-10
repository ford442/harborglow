// =============================================================================
// PHASE 6.1: HUD DESIGN SYSTEM - Glassmorphism & Animations
// =============================================================================

export const GLASSMORPHISM = {
  background: 'rgba(20, 20, 30, 0.6)',
  backgroundHover: 'rgba(30, 30, 45, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderHover: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  borderRadiusSmall: '12px',
  backdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  boxShadowHover: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
  boxShadowGlow: (color: string) => `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${color}40, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
}

export const TYPOGRAPHY = {
  fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  fontFamilyMono: '"JetBrains Mono", "Fira Code", monospace',
  
  sizes: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px'
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  }
}

export const ANIMATIONS = {
  // Button press feedback
  buttonPress: `
    @keyframes buttonPress {
      0% { transform: scale(1); }
      50% { transform: scale(0.96); }
      100% { transform: scale(1); }
    }
  `,
  
  // Hover glow pulse
  hoverGlow: `
    @keyframes hoverGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
      50% { box-shadow: 0 0 20px 4px rgba(255,255,255,0.1); }
    }
  `,
  
  // Progress bar shimmer
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  
  // Ripple effect for clicks
  ripple: `
    @keyframes ripple {
      0% { transform: scale(0); opacity: 0.5; }
      100% { transform: scale(4); opacity: 0; }
    }
  `,
  
  // Slide in from bottom
  slideUp: `
    @keyframes slideUp {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
  `,
  
  // Slide in from right
  slideInRight: `
    @keyframes slideInRight {
      0% { transform: translateX(20px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
  `,
  
  // Pulse for attention
  attentionPulse: `
    @keyframes attentionPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,215,0,0.4); }
      50% { transform: scale(1.02); box-shadow: 0 0 20px 10px rgba(255,215,0,0.2); }
    }
  `,
  
  // Spinner for loading states
  spin: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
  
  // Shake for errors
  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `,
  
  // Glow pulse for active elements
  glowPulse: (color: string) => `
    @keyframes glowPulse-${color.replace('#', '')} {
      0%, 100% { box-shadow: 0 0 5px ${color}40, 0 0 10px ${color}20; }
      50% { box-shadow: 0 0 15px ${color}60, 0 0 30px ${color}30; }
    }
  `
}

// Ship type color palette
export const SHIP_COLORS = {
  cruise: {
    primary: '#ff6b9d',
    secondary: '#ff8fb3',
    glow: '#ff6b9d80',
    gradient: 'linear-gradient(135deg, #ff6b9d, #ff8fb3)'
  },
  container: {
    primary: '#00d4aa',
    secondary: '#00ffb8',
    glow: '#00d4aa80',
    gradient: 'linear-gradient(135deg, #00d4aa, #00ffb8)'
  },
  tanker: {
    primary: '#ff9500',
    secondary: '#ffb84d',
    glow: '#ff950080',
    gradient: 'linear-gradient(135deg, #ff9500, #ffb84d)'
  }
}

// Inject all animations into document
export function injectDesignSystem() {
  if (document.getElementById('harborglow-design-system')) return
  
  const style = document.createElement('style')
  style.id = 'harborglow-design-system'
  style.textContent = `
    ${Object.values(ANIMATIONS).filter(a => typeof a === 'string').join('\n')}
    
    /* Custom scrollbar for glass panels */
    .glass-scroll::-webkit-scrollbar {
      width: 6px;
    }
    .glass-scroll::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 3px;
    }
    .glass-scroll::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }
    .glass-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }
    
    /* Selection color */
    ::selection {
      background: rgba(0, 200, 255, 0.3);
      color: #fff;
    }
  `
  document.head.appendChild(style)
}

// Utility for creating glass panel styles
export function createGlassPanelStyles(options?: {
  glowColor?: string
  padding?: string
  maxWidth?: string
  animated?: boolean
}): React.CSSProperties {
  const { glowColor, padding = '16px', maxWidth, animated = true } = options || {}
  
  return {
    background: GLASSMORPHISM.background,
    backdropFilter: GLASSMORPHISM.backdropFilter,
    borderRadius: GLASSMORPHISM.borderRadius,
    border: GLASSMORPHISM.border,
    boxShadow: glowColor ? GLASSMORPHISM.boxShadowGlow(glowColor) : GLASSMORPHISM.boxShadow,
    padding,
    maxWidth,
    transition: animated ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
    WebkitBackdropFilter: GLASSMORPHISM.backdropFilter
  }
}

// Utility for button styles
export function createButtonStyles(options?: {
  color?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}): React.CSSProperties {
  const { color = '#fff', variant = 'secondary', size = 'md', fullWidth = true } = options || {}
  
  const sizeStyles = {
    sm: { padding: '8px 12px', fontSize: '11px' },
    md: { padding: '12px 16px', fontSize: '13px' },
    lg: { padding: '16px 20px', fontSize: '14px' }
  }
  
  const variantStyles = {
    primary: {
      background: color,
      color: '#000',
      border: 'none'
    },
    secondary: {
      background: 'rgba(255,255,255,0.1)',
      color,
      border: `1px solid ${color}40`
    },
    ghost: {
      background: 'transparent',
      color,
      border: '1px solid transparent'
    }
  }
  
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    borderRadius: GLASSMORPHISM.borderRadiusSmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...sizeStyles[size],
    ...variantStyles[variant]
  }
}

// Progress ring component styles
export function createProgressRingStyles(radius: number, strokeWidth: number, color: string) {
  const circumference = 2 * Math.PI * radius
  
  return {
    container: {
      position: 'relative' as const,
      width: radius * 2 + strokeWidth,
      height: radius * 2 + strokeWidth
    },
    svg: {
      transform: 'rotate(-90deg)',
      width: '100%',
      height: '100%'
    },
    track: {
      fill: 'none',
      stroke: 'rgba(255,255,255,0.1)',
      strokeWidth
    },
    progress: {
      fill: 'none',
      stroke: color,
      strokeWidth,
      strokeLinecap: 'round' as const,
      strokeDasharray: circumference,
      transition: 'stroke-dashoffset 0.3s ease'
    }
  }
}
