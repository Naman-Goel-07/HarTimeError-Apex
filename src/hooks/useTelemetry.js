import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const EVENT_ID = '9da4b67b-1234-5678-abcd-1234567890ab'

export function useTelemetry(isCockpit = true) {
	const [points, setPoints] = useState([])
	const [userLocation, setUserLocation] = useState(null)
	const lastSentRef = useRef(0)
	const THROTTLE_MS = 10000

	// 1. DATA LINK: Fetch only FRESH relays and listen for new ones
	useEffect(() => {
		if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

		async function fetchPoints() {
			// 🏁 LOGIC UPGRADE: Only fetch data from the last 10 minutes
			const timeThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString()

			const { data, error } = await supabase
				.from('telemetry')
				.select('id, event_id, latitude, longitude, created_at')
				.eq('event_id', EVENT_ID)
				.gt('created_at', timeThreshold) // "Greater Than" our 10-minute threshold
				.order('created_at', { ascending: false })
				.limit(100)

			if (!error && data) setPoints(data)
		}
		fetchPoints()

		const channel = supabase
			.channel('live-telemetry')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'telemetry',
					filter: `event_id=eq.${EVENT_ID}`,
				},
				(payload) => {
					setPoints((prev) => [payload.new, ...prev.slice(0, 99)])
				},
			)
			.subscribe()

		return () => supabase.removeChannel(channel)
	}, [])

	// 2. GPS LINK: Track location for map, upload ONLY if isCockpit
	useEffect(() => {
		let watchId

		const sendTelemetry = async (coords) => {
			if (!isCockpit) return

			const { latitude, longitude } = coords
			const { error } = await supabase.from('telemetry').insert([
				{
					event_id: EVENT_ID,
					latitude,
					longitude,
				},
			])
			if (error) console.error('Link Error:', error.message)
		}

		if ('geolocation' in navigator) {
			watchId = navigator.geolocation.watchPosition(
				(position) => {
					const coords = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					}

					// Updates local state for the DRV_LOCK button
					setUserLocation(coords)

					const now = Date.now()
					if (now - lastSentRef.current > THROTTLE_MS) {
						sendTelemetry(coords)
						lastSentRef.current = now
					}
				},
				(err) => console.warn('GPS Wait:', err.message),
				{
					enableHighAccuracy: true,
					maximumAge: 0,
					timeout: 10000,
				},
			)
		}

		return () => {
			if (watchId) navigator.geolocation.clearWatch(watchId)
		}
	}, [isCockpit])

	return { points, userLocation }
}
