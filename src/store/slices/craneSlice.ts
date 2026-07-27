// =============================================================================
// CRANE SLICE — Crane kinematics, twistlock/heater, joysticks, contracts, and the install queue.
// =============================================================================

import type { StateCreator } from 'zustand';
import type { CraneSlice } from '../sliceTypes';
import {
    type GameState,
} from '../gameStoreTypes';
import type { AttachmentSystemConfig } from '../../systems/attachmentSystem';

export const createCraneSlice: StateCreator<GameState, [], [], CraneSlice> = (set, get, _api) => ({
    setCraneContract: (contract) => set((state) => {
        const newState = { craneContract: contract }
        return newState
    }),

    completeCraneContract: () => set((state) => {
        const contract = state.craneContract
        if (!contract || contract.status === 'completed') return {}
        const newState = {
            craneContract: { ...contract, status: 'completed' as const },
            money: state.money + contract.reward,
        }
        console.log(`📊 Crane contract complete — +${contract.reward} credits`)
        return newState
    }),

    setSpreaderPos: (pos) => set({ spreaderPos: pos }),

    setSpreaderRotation: (rotation) => set({ spreaderRotation: rotation }),

    setCableDepth: (depth) => set({ cableDepth: depth }),

    setLoadTension: (tension) => set({ loadTension: tension }),

    setTrolleyPosition: (position) => set({ trolleyPosition: position }),

    setWinchSpeed: (speed: number) => set({ winchSpeed: speed }),

    setHighlightedUpgradePart: (partName) => set({ highlightedUpgradePart: partName }),

    setPendingAutoInstall: (pending) => set({ pendingAutoInstall: pending }),

    setInstallQueue: (queue) => set((state) => {
        const nextState = {
            installQueue: queue,
            installQueueIndex: 0,
            isQueueRunning: queue.length > 0,
            isQueuePaused: false,
            queuePausedAt: null,
            queuePausedShipId: null,
            pendingAutoInstall: null,
        }
        return nextState
    }),

    advanceInstallQueue: () => set((state) => {
        const nextIndex = state.installQueueIndex + 1
        if (nextIndex >= state.installQueue.length) {
            return {
                installQueue: [],
                installQueueIndex: 0,
                isQueueRunning: false,
                isQueuePaused: false,
                queuePausedAt: null,
                queuePausedShipId: null,
            }
        }
        return {
            installQueueIndex: nextIndex,
            isQueuePaused: false,
            queuePausedAt: null,
            queuePausedShipId: null,
        }
    }),

    abortInstallQueue: () => set({
        installQueue: [],
        installQueueIndex: 0,
        isQueueRunning: false,
        isQueuePaused: false,
        queuePausedAt: null,
        queuePausedShipId: null,
    }),

    pauseInstallQueue: (shipId) => set((state) => ({
        isQueuePaused: true,
        queuePausedAt: Date.now(),
        queuePausedShipId: shipId,
        isQueueRunning: state.installQueue.length > 0,
    })),

    resumeInstallQueue: () => set({
        isQueuePaused: false,
        queuePausedAt: null,
        queuePausedShipId: null,
    }),

    setJoystickLeft: (pos) => set((state) => {
        const nextState = { joystickLeft: pos }
        if ((state.isQueueRunning || state.isQueuePaused) && (Math.abs(pos.x) > 0.001 || Math.abs(pos.y) > 0.001)) {
            return {
                ...nextState,
                installQueue: [],
                installQueueIndex: 0,
                isQueueRunning: false,
                isQueuePaused: false,
                queuePausedAt: null,
                queuePausedShipId: null,
            }
        }
        return nextState
    }),

    setJoystickRight: (pos) => set((state) => {
        const nextState = { joystickRight: pos }
        if ((state.isQueueRunning || state.isQueuePaused) && (Math.abs(pos.x) > 0.001 || Math.abs(pos.y) > 0.001)) {
            return {
                ...nextState,
                installQueue: [],
                installQueueIndex: 0,
                isQueueRunning: false,
                isQueuePaused: false,
                queuePausedAt: null,
                queuePausedShipId: null,
            }
        }
        return nextState
    }),

    setTwistlockEngaged: (engaged) => set({
        twistlockEngaged: engaged,
        // Engaging the twistlock starts the clock on an install attempt; releasing
        // it ends the attempt. Ephemeral — never persisted.
        installAttemptStartedAt: engaged ? Date.now() : null,
    }),

    setHeaterActive: (active) => set({ heaterActive: active }),

    setIsMoving: (moving) => set({ isMoving: moving }),

    // Multiview system actions

    setAttachmentSystemConfig: (config: Partial<AttachmentSystemConfig>) => {
        set((state) => ({
            attachmentSystemConfig: { ...state.attachmentSystemConfig, ...config }
        }))
    },
});
