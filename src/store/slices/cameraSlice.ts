// =============================================================================
// CAMERA SLICE — Camera modes, spectator sequences, multiview viewports, and dashboard presets.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { CameraSlice } from '../sliceTypes';
import {
    type GameState,
    type CabinViewMode,
} from '../gameStoreTypes';

export const createCameraSlice: StateCreator<GameState, [], [], CameraSlice> = (set, get, _api) => ({
    setSpectatorTarget: (shipId, duration = 10) => {
        const state = get()
        if (state.spectatorState.isActive) return

        set({
            spectatorState: {
                isActive: true,
                targetShipId: shipId,
                startTime: Date.now(),
                duration
            },
            cameraMode: 'spectator'
        })

        setTimeout(() => {
            const currentState = get()
            if (currentState.spectatorState.targetShipId === shipId) {
                get().endSpectatorMode()
            }
        }, duration * 1000)
    },

    endSpectatorMode: () => set({
        spectatorState: {
            isActive: false,
            targetShipId: null,
            startTime: 0,
            duration: 10
        },
        cameraMode: 'orbit'
    }),

    setCameraMode: (mode) => {
        set({ cameraMode: mode })
    },

    setMultiviewMode: (mode) => {
        set({ multiviewMode: mode })
        console.log(`📺 Multiview mode: ${mode}`)
    },

    setUnderwaterIntensity: (intensity) => {
        const newIntensity = Math.max(0, Math.min(2, intensity))
        set({ underwaterIntensity: newIntensity })
    },

    setDashboardPreset: (viewportId, presetId) => {
        set((state) => {
            const dashboardPresets = {
                ...state.dashboardPresets,
                [viewportId]: presetId
            }
            const newState = { dashboardPresets }
            return newState
        })
    },

    // Viewport-local camera history stack (Alt A)

    pushViewportHistory: (viewportId, transform) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const newHistory = vp.history.slice(0, vp.historyIndex + 1)
            newHistory.push(transform)
            if (newHistory.length > 20) newHistory.shift()
            const newIndex = newHistory.length - 1
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: {
                        ...vp,
                        history: newHistory,
                        historyIndex: newIndex
                    }
                }
            }
        })
    },

    navigateViewportHistory: (viewportId, direction) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const newIndex = Math.max(0, Math.min(vp.history.length - 1, vp.historyIndex + direction))
            if (newIndex === vp.historyIndex) return state
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: { ...vp, historyIndex: newIndex }
                }
            }
        })
    },

    pinViewportCamera: (viewportId, transform) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const newPinned = [...vp.pinned, transform]
            if (newPinned.length > 6) newPinned.shift()
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: { ...vp, pinned: newPinned }
                }
            }
        })
    },

    recallPinnedViewportCamera: (viewportId, pinIndex) => {
        set((state) => {
            const vp = state.viewportCameras[viewportId]
            const snapshot = vp.pinned[pinIndex]
            if (!snapshot) return state
            const newHistory = vp.history.slice(0, vp.historyIndex + 1)
            newHistory.push(snapshot)
            if (newHistory.length > 20) newHistory.shift()
            return {
                viewportCameras: {
                    ...state.viewportCameras,
                    [viewportId]: {
                        ...vp,
                        history: newHistory,
                        historyIndex: newHistory.length - 1
                    }
                }
            }
        })
    },

    setFocusedViewport: (viewportId) => set({ focusedViewport: viewportId }),

    // Wildlife and sea event actions

    setCabinViewMode: (mode: CabinViewMode) => {
        set({ cabinViewMode: mode })
        console.log(`🎮 Cabin view mode: ${mode}`)
    },

    // Time system - update game time from timeSystem

    setTugSpectatorActive: (active: boolean) => set({ tugSpectatorActive: active }),
});
