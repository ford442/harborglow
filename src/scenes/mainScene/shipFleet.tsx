import React, { useEffect } from 'react'
import * as THREE from 'three'
import type { Ship } from '../../store/useGameStore'
import ShipComponent from '../Ship'
import type { AtSeaShip, ShipSchedulingConfig, DepartingShipsConfig } from './types'

export function ShipWrapper({
    ship,
    departingShips,
    shipPositionsRef,
    atSeaShipsRef
}: {
    ship: Ship
    departingShips: Set<string>
    shipPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
    atSeaShipsRef: React.MutableRefObject<Map<string, AtSeaShip>>
}) {
    if (atSeaShipsRef.current.has(ship.id)) return null

    const animatedPos = departingShips.has(ship.id)
        ? shipPositionsRef.current.get(`${ship.id}_current`)
        : null

    const displayShip: Ship = animatedPos
        ? { ...ship, position: [animatedPos.x, animatedPos.y, animatedPos.z] }
        : ship

    return <ShipComponent ship={displayShip} />
}


export function useShipScheduling(config: ShipSchedulingConfig) {
    const {
        ships,
        departingShips,
        setDepartingShips,
        atSeaShipsRef,
        shipPositionsRef,
        scheduleDeparture,
        returnToDock
    } = config

    useEffect(() => {
        // Schedule initial departures
        ships.forEach(ship => {
            if (ship.isDocked !== false && !ship.sailTime &&
                !departingShips.has(ship.id) &&
                !atSeaShipsRef.current.has(ship.id)) {
                scheduleDeparture(ship.id)
            }
        })

        const interval = setInterval(() => {
            const now = Date.now()

            // Check for departing ships
            ships.forEach(ship => {
                if (ship.sailTime && now >= ship.sailTime &&
                    !departingShips.has(ship.id) &&
                    !atSeaShipsRef.current.has(ship.id)) {

                    shipPositionsRef.current.set(ship.id, new THREE.Vector3(...ship.position))
                    setDepartingShips(new Set([...departingShips, ship.id]))
                }
            })

            // Check for returning ships
            atSeaShipsRef.current.forEach((atSeaShip, shipId) => {
                if (now >= atSeaShip.returnTime) {
                    atSeaShipsRef.current.delete(shipId)
                    returnToDock(shipId)
                    setTimeout(() => scheduleDeparture(shipId), 5000)
                }
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [ships, departingShips, scheduleDeparture, returnToDock, atSeaShipsRef, shipPositionsRef, setDepartingShips])
}


export function animateDepartingShips(config: DepartingShipsConfig) {
    const { departingShips, shipPositionsRef, delta, setDepartingShips, atSeaShipsRef, returnToDock } = config

    departingShips.forEach(shipId => {
        const originalPos = shipPositionsRef.current.get(shipId)
        if (!originalPos) return

        let currentPos = shipPositionsRef.current.get(`${shipId}_current`)
        if (!currentPos) {
            currentPos = originalPos.clone()
            shipPositionsRef.current.set(`${shipId}_current`, currentPos)
        }

        currentPos.z += delta * 20

        if (currentPos.z > originalPos.z + 100) {
            setDepartingShips(new Set([...departingShips].filter(id => id !== shipId)))

            atSeaShipsRef.current.set(shipId, {
                shipId,
                returnTime: Date.now() + 10000,
                originalPosition: [originalPos.x, originalPos.y, originalPos.z]
            })

            shipPositionsRef.current.delete(`${shipId}_current`)
            returnToDock(shipId)
        }
    })
}
