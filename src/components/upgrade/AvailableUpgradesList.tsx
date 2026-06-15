import React from 'react';
import { formatPartLabel } from './utils';
import {
    upgradeRowStyle,
    installButtonStyle,
    installingSpinnerStyle,
    queueCheckboxStyle
} from './styles';

export function AvailableUpgradesList({
    availableUpgrades,
    isNavigating,
    isHighlighted,
    lastInstalled,
    selectedForQueue,
    shipColor,
    installing,
    onSelectUpgrade,
    onInstall,
    onToggleQueueSelection,
    activeAutoInstallPartName
}: any) {
    if (availableUpgrades.length === 0) return null;

    return (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#888' }}>
                🏗️ Crane pickup and place:
            </p>
            {availableUpgrades.map((option: any) => {
                const navigating = isNavigating(option.partName)
                const highlighted = isHighlighted(option.partName)
                const justInstalled = lastInstalled === option.partName && !navigating
                const selected = selectedForQueue.has(option.partName)

                return (
                    <div
                        key={option.partName}
                        style={{
                            ...upgradeRowStyle,
                            borderColor: navigating
                                ? shipColor
                                : highlighted
                                    ? '#00ffff'
                                    : '#444',
                            boxShadow: navigating
                                ? `0 0 15px ${shipColor}60, inset 0 0 10px ${shipColor}20`
                                : highlighted
                                    ? '0 0 12px #00ffff40, inset 0 0 8px #00ffff20'
                                    : 'none',
                        }}
                        onMouseEnter={() => onSelectUpgrade(option.partName)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={queueCheckboxStyle}>
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => onToggleQueueSelection(option.partName)}
                                    style={{ margin: 0, cursor: 'pointer' }}
                                />
                            </label>
                            <span style={{
                                color: navigating ? shipColor : '#fff',
                                fontWeight: navigating ? 'bold' : 'normal'
                            }}>
                                {formatPartLabel(option.partName)}
                            </span>
                        </div>
                        <button
                            onClick={() => onInstall(option.partName)}
                            disabled={!!installing || !!activeAutoInstallPartName}
                            style={{
                                ...installButtonStyle,
                                backgroundColor: justInstalled ? `${shipColor}40` : navigating ? `${shipColor}20` : 'rgba(0, 212, 170, 0.15)',
                                borderColor: justInstalled ? shipColor : navigating ? shipColor : 'rgba(0, 212, 170, 0.4)',
                                color: navigating ? shipColor : '#00d4aa',
                                opacity: (installing && installing !== option.partName) ? 0.5 : 1,
                            }}
                        >
                            {navigating ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ ...installingSpinnerStyle, borderTopColor: shipColor }} />
                                    <span>Moving...</span>
                                </div>
                            ) : justInstalled ? (
                                'Installed!'
                            ) : (
                                'Install'
                            )}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
