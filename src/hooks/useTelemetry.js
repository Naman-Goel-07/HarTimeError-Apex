import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 🏁 Haversine Formula: Calculates distance in meters between two GPS points
function getDistance(lat1, lon1, lat2, lon2) {
	const R = 6371e3 // Earth's radius in meters
	const φ1 = (lat1 * Math.PI) / 180
	const φ2 = (lat2 * Math.PI) / 180
	const Δφ = ((lat2 - lat1) * Math.PI) / 180
	const Δλ = ((lon2 - lon1) * Math.PI) / 180

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

	return R * c
}

export function useTelemetry(eventId, isCockpit = true) {
	const [points, setPoints] = useState([])
	const [userLocation, setUserLocation] = useState(null)
	const [eventMeta, setEventMeta] = useState(null)
	const lastSentRef = useRef(0)
	const THROTTLE_MS = 10000

	// 1. Fetch Event Metadata (Perimeter Settings)
	useEffect(() => {
		if (!eventId) return
		async function fetchMeta() {
			const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
			if (data) setEventMeta(data)
		}
		fetchMeta()
	}, [eventId])

	// 2. Data Link: Real-time Listening
	useEffect(() => {
		if (!eventId || !process.env.NEXT_PUBLIC_SUPABASE_URL) return

		const channel = supabase
			.channel(`live-telemetry-${eventId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'telemetry',
					filter: `event_id=eq.${eventId}`,
				},
				(payload) => {
					setPoints((prev) => [payload.new, ...prev.slice(0, 99)])
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
			setPoints([])
		}
	}, [eventId])

	// 3. GPS Link: Conditional Upload (The Geofence)
	useEffect(() => {
		let watchId
		if (!eventId || !isCockpit || !eventMeta) return

		const sendTelemetry = async (coords) => {
			// 🚩 PERIMETER ENFORCEMENT
			const distance = getDistance(coords.latitude, coords.longitude, eventMeta.center_lat, eventMeta.center_long)

			if (distance > eventMeta.radius_meters) {
				console.warn(`[APEX] OUT OF BOUNDS: ${Math.round(distance)}m from center.`)
				return // Kill the transmission if off-track
			}

			const { error } = await supabase.from('telemetry').insert([{ event_id: eventId, latitude: coords.latitude, longitude: coords.longitude }])

			if (!error) {
				fetch(`/api/py/compute/${eventId}`, { method: 'POST' }).catch(() => {})
			}
		}

		if ('geolocation' in navigator) {
			watchId = navigator.geolocation.watchPosition(
				(position) => {
					const coords = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					}
					setUserLocation(coords)

					const now = Date.now()
					if (now - lastSentRef.current > THROTTLE_MS) {
						sendTelemetry(coords)
						lastSentRef.current = now
					}
				},
				(err) => console.warn('GPS Wait:', err.message),
				{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
			)
		}

		return () => {
			if (watchId) navigator.geolocation.clearWatch(watchId)
		}
	}, [eventId, isCockpit, eventMeta])

	return { points, userLocation, eventMeta }
}
