/**
 * APEX - Crowd Logic Strategy Engine (V2 Optimized)
 */

export function getDistanceMeters(lat1, lon1, lat2, lon2) {
	const R = 6371e3
	const φ1 = (lat1 * Math.PI) / 180
	const φ2 = (lat2 * Math.PI) / 180
	const Δφ = ((lat2 - lat1) * Math.PI) / 180
	const Δλ = ((lon2 - lon1) * Math.PI) / 180

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

	return R * c
}

export function computeHeatBlobs(centerLat, centerLon, allPoints, maxRadius = 300) {
	const blobs = []
	const NOW = Date.now()
	const FIVE_MINUTES = 5 * 60 * 1000

	allPoints.forEach((point) => {
		const distance = getDistanceMeters(centerLat, centerLon, point.latitude, point.longitude)

		// 1. DISTANCE CHECK: Must be within radar range
		// 2. SELF-FILTER: Ignore points within 2 meters (likely the user themselves)
		// 3. STALE DATA: Ignore points older than 5 minutes
		const pointTime = new Date(point.created_at).getTime()

		if (distance <= maxRadius && distance > 2 && NOW - pointTime < FIVE_MINUTES) {
			const dy = point.latitude - centerLat
			const dx = Math.cos((Math.PI / 180) * centerLat) * (point.longitude - centerLon)
			const angle = Math.atan2(dy, dx)

			// IMPROVED SCALING: Use the full 0-1 range for the radar UI
			// 0.5 is center. Max radius is a distance of 0.5 units from center.
			const relDist = distance / maxRadius

			// Calculate X and Y (0 to 1)
			const px = 0.5 + Math.cos(angle) * (relDist * 0.45) // 0.45 keeps it slightly inside the border
			const py = 0.5 - Math.sin(angle) * (relDist * 0.45)

			blobs.push({
				id: point.id,
				x: px,
				y: py,
				intensity: Math.max(0.3, 1 - distance / maxRadius),
				radius: 0.08,
			})
		}
	})

	return blobs
}

export function determineStrategyZone(blobs) {
	if (!blobs || blobs.length === 0) return { status: 'GREEN', text: 'OPTIMAL' }

	// Calculate "Pressure" (Density in the immediate vicinity)
	// Close blobs = within 20% of max radius
	const closeBlobs = blobs.filter((b) => b.intensity > 0.8).length
	const mediumBlobs = blobs.filter((b) => b.intensity > 0.5).length

	if (closeBlobs >= 3 || blobs.length > 15) {
		return { status: 'RED', text: 'DIRTY AIR' }
	}

	if (closeBlobs >= 1 || mediumBlobs >= 5) {
		return { status: 'YELLOW', text: 'CAUTION' }
	}

	return { status: 'GREEN', text: 'OPTIMAL' }
}
