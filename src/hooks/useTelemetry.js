import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// 🏁 Haversine Formula: Distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
	const R = 6371e3
	const φ1 = (lat1 * Math.PI) / 180
	const φ2 = (lat2 * Math.PI) / 180
	const Δφ = ((lat2 - lat1) * Math.PI) / 180
	const Δλ = ((lon2 - lon1) * Math.PI) / 180
	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
	return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function useTelemetry(eventId, isCockpit = true) {
	const [points, setPoints] = useState([])
	const [userLocation, setUserLocation] = useState(null)
	const [eventMeta, setEventMeta] = useState(null)
	const lastSentRef = useRef(0)
	const deviceIdRef = useRef(null)
	const THROTTLE_MS = 10000

	// Generate/Retrieve Device ID (Client-side only)
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const savedId = localStorage.getItem('apex_device_id')
			const newId = savedId || `DRV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
			if (!savedId) localStorage.setItem('apex_device_id', newId)
			deviceIdRef.current = newId
		}
	}, [])

	// 1. Fetch Geofence
	useEffect(() => {
		if (!eventId) return
		async function fetchMeta() {
			const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
			if (data) setEventMeta(data)
		}
		fetchMeta()
	}, [eventId])

	// 2. Real-time Subscription
	useEffect(() => {
		if (!eventId) return
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
					setPoints((prev) => [payload.new, ...prev.slice(0, 49)])
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
			setPoints([])
		}
	}, [eventId])

	// 3. GPS Uploading
	useEffect(() => {
		let watchId
		if (!eventId || !isCockpit) return

		const sendTelemetry = async (coords) => {
			if (!eventMeta) return
			const dist = getDistance(coords.latitude, coords.longitude, eventMeta.center_lat, eventMeta.center_long)

			// Only upload if within radius (default 1km fallback)
			if (dist > (eventMeta.radius_meters || 1000)) return

			await supabase.from('telemetry').insert([
				{
					event_id: eventId,
					latitude: coords.latitude,
					longitude: coords.longitude,
					device_id: deviceIdRef.current,
				},
			])

			fetch(`/api/py/compute/${eventId}`, { method: 'POST' }).catch(() => {})
		}

		if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
			watchId = navigator.geolocation.watchPosition(
				(position) => {
					const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude }
					setUserLocation(coords)
					const now = Date.now()
					if (now - lastSentRef.current > THROTTLE_MS) {
						sendTelemetry(coords)
						lastSentRef.current = now
					}
				},
				(err) => console.warn('GPS Signal:', err.message),
				{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
			)
		}
		return () => watchId && navigator.geolocation.clearWatch(watchId)
	}, [eventId, isCockpit, eventMeta])

	return { points, userLocation, eventMeta, deviceId: deviceIdRef.current }
}
