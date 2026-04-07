'use client'

import { useMemo } from 'react'

/**
 * Computes guidance instructions based on heading, distance, and crowd density.
 * Uses a Threat Score matrix to prioritize immediate blockages over distant ones.
 * In future, this would use actual path-finding / ML-based analysis.
 * 
 * @param {number} heading - Current heading in degrees (0–360)
 * @param {Array} blobs - Crowd blob data {x, y, intensity}
 * @returns {{ message: string, suggestion: string, suggestedAngle: number|null, severity: string }}
 */
export function useGuidance(heading, blobs) {
	return useMemo(() => {
		// 1. Base Case: No threat
		if (!blobs || !Array.isArray(blobs) || blobs.length === 0) {
			return { message: 'SECTOR CLEAR', suggestion: 'Proceed on current line', suggestedAngle: null, severity: 'low' }
		}

		// 2. Calculate User's Facing Vector
		// Subtract 90 so 0 degrees (North) points UP on the Y axis
		const headingRad = ((heading - 90) * Math.PI) / 180
		const facingX = Math.cos(headingRad)
		const facingY = Math.sin(headingRad)

		let highestThreatBlob = null
		let highestThreatScore = 0

		// 3. Scan the Sector
		for (const blob of blobs) {
			// Normalize coordinates (User is at 0,0)
			const bx = blob.x - 0.5
			const by = blob.y - 0.5

			// Calculate actual distance from user
			const dist = Math.sqrt(bx * bx + by * by)
			if (dist < 0.05) continue // Skip blobs directly on top of the user (noise)

			// Calculate Field of View (Dot Product)
			const dot = (bx * facingX + by * facingY) / dist

			// Only care about blobs in front of the user (dot > 0.1 is roughly a 160-degree cone)
			if (dot > 0.1 && blob.intensity > 0.3) {
				// THREAT SCORE CALCULATION
				// - Higher dot product (more directly ahead) increases score
				// - Higher intensity (denser crowd) increases score
				// - Lower distance (closer to user) drastically increases score
				const proximityWeight = 1 - Math.min(dist, 1) // Closer = higher weight
				const threatScore = dot * 0.3 + blob.intensity * 0.3 + proximityWeight * 0.4

				if (threatScore > highestThreatScore) {
					highestThreatScore = threatScore
					highestThreatBlob = blob
				}
			}
		}

		// 4. Generate Tactical Advice
		if (highestThreatBlob) {
			const bx = highestThreatBlob.x - 0.5
			const by = highestThreatBlob.y - 0.5

			// Find the absolute angle of the threat
			const blobAngle = (Math.atan2(by, bx) * 180) / Math.PI + 90

			// Determine evasive maneuver (turn away from the blob)
			const relativeAngle = (blobAngle - heading + 360) % 360
			const side = relativeAngle > 180 ? 'LEFT' : 'RIGHT'

			// Dynamic avoidance: Steer harder for severe threats
			const avoidAngle = highestThreatBlob.intensity > 0.7 ? 45 : 30

			const isCritical = highestThreatScore > 0.7

			return {
				message: isCritical ? 'CRITICAL CONGESTION AHEAD' : 'MODERATE TRAFFIC DETECTED',
				suggestion: `Divert ${avoidAngle}° ${side}`,
				suggestedAngle: avoidAngle,
				severity: isCritical ? 'high' : 'medium',
			}
		}

		// 5. Ambient Warning (Dense crowd nearby, but not in our path)
		const hasHighBlobs = blobs.some((b) => b.intensity > 0.75)
		if (hasHighBlobs) {
			return {
				message: 'DENSE AREA DETECTED OFF-AXIS',
				suggestion: 'Maintain heading with caution',
				suggestedAngle: null,
				severity: 'medium',
			}
		}

		// 6. All Clear
		return {
			message: 'FORWARD PATH CLEAR',
			suggestion: 'Maintain current speed and heading',
			suggestedAngle: null,
			severity: 'low',
		}
	}, [heading, blobs])
}
