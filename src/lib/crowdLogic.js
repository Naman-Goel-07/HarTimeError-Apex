// THE MATH ENGINE: Translates real GPS coordinates into 2D Radar Blobs

// Haversine Formula: Returns distance in meters between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
	const R = 6371e3 // Earth radius in meters
	const φ1 = (lat1 * Math.PI) / 180
	const φ2 = (lat2 * Math.PI) / 180
	const Δφ = ((lat2 - lat1) * Math.PI) / 180
	const Δλ = ((lon2 - lon1) * Math.PI) / 180

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

	return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

// Forward Azimuth: Calculates the compass bearing from Point 1 to Point 2
function getBearing(lat1, lon1, lat2, lon2) {
	const φ1 = (lat1 * Math.PI) / 180
	const φ2 = (lat2 * Math.PI) / 180
	const Δλ = ((lon2 - lon1) * Math.PI) / 180

	const y = Math.sin(Δλ) * Math.cos(φ2)
	const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

	let θ = Math.atan2(y, x)
	let bearing = (θ * 180) / Math.PI

	return (bearing + 360) % 360 // Normalize to 0-360
}

/**
 * Transforms an array of Supabase GPS pings into relative X/Y coordinates for the Radar UI.
 */
export function computeHeatBlobs(userLat, userLon, points, maxRadiusMeters = 500) {
	if (!userLat || !userLon || !points || points.length === 0) return []

	// 1. Group by Device to ensure we only look at the LATEST ping per driver
	const activeUnits = new Map()
	points.forEach((p) => {
		if (p.device_id && p.device_id !== 'DRV-SYNCING' && !activeUnits.has(p.device_id)) {
			// Ignore ourselves on the radar
			const savedId = typeof window !== 'undefined' ? localStorage.getItem('apex_device_id') : null
			if (p.device_id !== savedId) {
				activeUnits.set(p.device_id, p)
			}
		}
	})

	const blobs = []

	// 2. Map GPS to Radar Grid
	activeUnits.forEach((unit) => {
		const dist = getDistance(userLat, userLon, unit.latitude, unit.longitude)

		// If they are further away than our radar can see, ignore them
		if (dist > maxRadiusMeters) return

		const bearing = getBearing(userLat, userLon, unit.latitude, unit.longitude)

		// Convert to radar scale (0 to 1).
		// Example: If dist is 250m and max is 500m, ratio is 0.5 (halfway to edge)
		const ratio = dist / maxRadiusMeters
		const bearingRad = (bearing * Math.PI) / 180

		// Calculate X and Y offsets.
		// Multiply by 0.5 because the radius of the radar is half of the total width (0 to 1)
		const dx = ratio * Math.sin(bearingRad) * 0.5
		const dy = ratio * Math.cos(bearingRad) * 0.5

		blobs.push({
			id: unit.device_id,
			x: 0.5 + dx, // 0.5 is the center of the radar
			y: 0.5 - dy, // Subtract dy because Y=0 is the TOP of a computer screen (North)
			intensity: 0.6, // Set a default intensity
			radius: 0.08,
			distance: dist, // Store distance for the Guidance engine
		})
	})

	return blobs
}

/**
 * Calculates overall sector threat level based on proximity of blobs
 */
export function determineStrategyZone(blobs) {
	if (!blobs || blobs.length === 0) {
		return { status: 'GREEN', text: 'SECTOR CLEAR' }
	}

	// Check if anyone is dangerously close (e.g., within 0.5 meters)
	const criticalThreat = blobs.some((b) => b.distance < 0.5)
	if (criticalThreat) {
		return { status: 'RED', text: 'TRAFFIC AHEAD' }
	}

	// Check if there is high traffic within 2 meters
	const moderateThreat = blobs.some((b) => b.distance < 2)
	if (moderateThreat) {
		return { status: 'YELLOW', text: 'WARNING' }
	}

	return { status: 'GREEN', text: 'SECTOR CLEAR' }
}
