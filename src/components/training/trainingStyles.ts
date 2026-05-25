// =============================================================================
// TRAINING MODE STYLES - All styles extracted from TrainingMode.tsx
// =============================================================================

// ================================================================
// MAIN LAYOUT STYLES
// ================================================================

export const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  flexDirection: 'column',
  background: '#0a0f1a',
  fontFamily: 'Inter, system-ui, sans-serif',
  overflow: 'hidden'
}

export const backgroundStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: `
    radial-gradient(ellipse at 20% 0%, rgba(0,212,170,0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(74,158,255,0.08) 0%, transparent 50%),
    linear-gradient(180deg, #0a0f1a 0%, #0d1520 100%)
  `,
  zIndex: 0
}

export const gradientOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E")',
  opacity: 0.5
}

export const contentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: '24px 32px',
  gap: '20px'
}

// ================================================================
// HEADER STYLES
// ================================================================

export const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(255,255,255,0.1)'
}

export const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}

export const iconStyle: React.CSSProperties = {
  fontSize: '36px',
  filter: 'drop-shadow(0 0 10px rgba(0,212,170,0.5))'
}

export const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #fff 0%, #00d4aa 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
}

export const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: '#888',
  letterSpacing: '0.5px'
}

export const statsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px'
}

export const statBadgeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 16px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  minWidth: '80px'
}

export const statValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  fontFamily: 'monospace'
}

export const statLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}

export const exitButtonStyle: React.CSSProperties = {
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
  transition: 'all 0.2s'
}

// ================================================================
// MAIN CONTENT STYLES
// ================================================================

export const mainStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

export const hubStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '8px'
}

export const modulesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '16px',
  padding: '8px'
}

// ================================================================
// MODULE CARD STYLES
// ================================================================

export const moduleCardStyle: React.CSSProperties = {
  position: 'relative',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  transition: 'all 0.2s',
  cursor: 'pointer'
}

export const moduleNumberStyle: React.CSSProperties = {
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

export const statusIconStyle: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  fontSize: '20px'
}

export const moduleContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  paddingTop: '20px'
}

export const moduleTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 600,
  color: '#fff'
}

export const moduleDescriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#888',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
}

export const difficultyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '4px'
}

export const moduleMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginTop: '8px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255,255,255,0.05)'
}

export const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

export const rankBadgeStyle: React.CSSProperties = {
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

export const lockedOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  background: 'rgba(0,0,0,0.7)',
  borderRadius: '12px',
  backdropFilter: 'blur(4px)'
}

// ================================================================
// FOOTER STYLES
// ================================================================

export const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.1)'
}

export const legendStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px'
}

export const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

export const tipStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#666',
  fontStyle: 'italic'
}

// ================================================================
// DETAILS VIEW STYLES
// ================================================================

export const detailsStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
}

export const backButtonStyle: React.CSSProperties = {
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
  alignSelf: 'flex-start'
}

export const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '24px',
  flex: 1
}

export const detailsLeftStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
}

export const detailsRightStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

export const detailsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

export const detailsTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '32px',
  fontWeight: 700,
  color: '#fff'
}

export const difficultyLargeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '14px'
}

export const detailsDescriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  color: '#aaa',
  lineHeight: 1.6
}

// ================================================================
// SECTION STYLES
// ================================================================

export const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '13px',
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '1px'
}

export const conditionsSectionStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

export const conditionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px'
}

export const conditionItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

export const objectivesSectionStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

export const objectivesListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

export const objectiveItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '8px'
}

export const objectiveNumberStyle: React.CSSProperties = {
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

export const rewardsSectionStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

export const rewardsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

export const rewardItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  border: '1px solid',
  borderRadius: '8px'
}

// ================================================================
// RESULTS STYLES
// ================================================================

export const resultCardStyle: React.CSSProperties = {
  padding: '24px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  textAlign: 'center'
}

export const noResultCardStyle: React.CSSProperties = {
  padding: '48px 24px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px'
}

export const rankLargeStyle: React.CSSProperties = {
  fontSize: '72px',
  fontWeight: 800,
  lineHeight: 1,
  margin: '16px 0'
}

export const rankDescriptionStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
  marginBottom: '20px'
}

export const statsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255,255,255,0.1)'
}

export const statRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0'
}

// ================================================================
// PREREQUISITES & BUTTONS
// ================================================================

export const prerequisitesStyle: React.CSSProperties = {
  padding: '16px',
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '12px'
}

export const prereqsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

export const prereqItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  border: '1px solid',
  borderRadius: '6px',
  fontSize: '12px'
}

export const startButtonStyle: React.CSSProperties = {
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
  marginTop: 'auto'
}

export const lockedMessageStyle: React.CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontSize: '12px',
  color: '#ff4757'
}
