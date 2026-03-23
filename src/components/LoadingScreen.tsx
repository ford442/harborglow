// =============================================================================
// LOADING SCREEN COMPONENT
// =============================================================================

export default function LoadingScreen({ progress }: { progress: number }) {
    return (
        <div className="loading-container">
            <div className="loading-content">
                <div className="loading-spinner" />
                <div className="loading-bar">
                    <div
                        className="loading-progress"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="loading-text">{progress}%</p>
                {progress >= 90 && (
                    <p style={{ fontSize: '12px', color: '#00d4aa', marginTop: '8px' }}>
                        Calibrating monitors...
                    </p>
                )}
            </div>
        </div>
    )
}
