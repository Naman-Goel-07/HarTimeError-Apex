'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Reads real-time device heading (0–360°) using the DeviceOrientation API.
 * Handles iOS 13+ permissions and Android absolute alpha calculations.
 *
 * @param {Object} options
 * @param {number} options.throttleMs - ms between React state updates to prevent render lag (default: 50ms)
 * @returns {{ heading: number, cardinalDirection: string, isSupported: boolean, requestPermission: function, permissionGranted: boolean }}
 */
export function useCompass({ throttleMs = 50 } = {}) {
	const [heading, setHeading] = useState(0)
	const [isSupported, setIsSupported] = useState(true)
	const [permissionGranted, setPermissionGranted] = useState(false)

	// 1. Check support & initial permission state on mount
	useEffect(() => {
		if (typeof window === 'undefined') return

		if (!window.DeviceOrientationEvent) {
			setIsSupported(false)
			return
		}

		// If device doesn't require explicit permission (Android / older iOS), grant it automatically
		if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
			setPermissionGranted(true)
		}
	}, [])

	// 2. Request permission (MUST be called from a user interaction like onClick)
	const requestPermission = useCallback(async () => {
		if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
			try {
				const permission = await DeviceOrientationEvent.requestPermission()
				if (permission === 'granted') {
					setPermissionGranted(true)
				} else {
					console.warn('Compass permission denied.')
				}
			} catch (error) {
				console.error('Error requesting compass permission:', error)
			}
		} else {
			setPermissionGranted(true)
		}
	}, [])

	// 3. Listen to sensor data once permission is granted
	useEffect(() => {
		if (!permissionGranted || typeof window === 'undefined') return

		let lastUpdate = 0

		const handleOrientation = (event) => {
			const now = Date.now()
			if (now - lastUpdate < throttleMs) return // Prevent React from choking on high-frequency updates

			let newHeading = null

			// iOS specific property
			if (event.webkitCompassHeading !== undefined) {
				newHeading = event.webkitCompassHeading
			}
			// Android / Standard absolute orientation
			else if (event.absolute === true && event.alpha !== null) {
				// alpha is degrees counter-clockwise from North. Compass needs clockwise.
				newHeading = 360 - event.alpha
			}

			if (newHeading !== null) {
				setHeading(Math.round(newHeading))
				lastUpdate = now
			}
		}

		// Android prefers 'deviceorientationabsolute', iOS uses 'deviceorientation'
		const eventType = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'

		window.addEventListener(eventType, handleOrientation)

		return () => {
			window.removeEventListener(eventType, handleOrientation)
		}
	}, [permissionGranted, throttleMs])

	const cardinalDirection = getCardinalDirection(heading)

	return {
		heading,
		cardinalDirection,
		isSupported,
		requestPermission,
		permissionGranted,
	}
}

/**
 * Convert degrees to cardinal direction string
 */
function getCardinalDirection(deg) {
	if (deg === null || isNaN(deg)) return 'N'
	const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
	const index = Math.round(deg / 45) % 8
	return directions[index]
}
