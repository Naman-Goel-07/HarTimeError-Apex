'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from 'react-leaflet'
import { Target, Satellite } from 'lucide-react'
import L from 'leaflet'

function LocateControl({ userLocation }) {
	const map = useMap()
	const isLocked = !!(userLocation?.latitude && userLocation?.longitude)

	const handleJump = () => {
		if (isLocked) {
			map.flyTo([userLocation.latitude, userLocation.longitude], 18, { duration: 1.5 })
		}
	}

	return (
		<div className="absolute top-24 left-6 z-[1000]">
			<button
				onClick={handleJump}
				disabled={!isLocked}
				className={`group flex items-center gap-3 bg-black/90 border p-2 pr-4 rounded-sm backdrop-blur-xl transition-all active:scale-95 shadow-2xl
                    ${isLocked ? 'border-[#222] hover:border-[#00eeff]' : 'border-red-500/30 opacity-60'}`}
			>
				<Target className={`w-4 h-4 ${isLocked ? 'text-[#00eeff] animate-pulse' : 'text-red-500'}`} />
				<span className={`text-xs font-bold uppercase ${isLocked ? 'text-white' : 'text-red-500'}`}>{isLocked ? 'DRV_LOCK' : 'NO_SIGNAL'}</span>
			</button>
		</div>
	)
}

export default function StrategyMap({ points = [], userLocation = null, geofence = null }) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		// Fix Leaflet Icons
		if (typeof window !== 'undefined') {
			delete L.Icon.Default.prototype._getIconUrl
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
				iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
				shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
			})
			setMounted(true)
		}
	}, [])

	const devices = useMemo(() => {
		const groups = {}
		if (!Array.isArray(points)) return groups
		try {
			points.forEach((p) => {
				if (!p || !p.latitude || !p.longitude) return
				const id = p.device_id || 'unknown'
				if (!groups[id]) groups[id] = []
				groups[id].push(p)
			})
		} catch (e) {
			console.error('Grouping Error', e)
		}
		return groups
	}, [points])

	const currentCenter = useMemo(() => {
		try {
			if (geofence?.center_lat && geofence?.center_long) return [geofence.center_lat, geofence.center_long]
			if (userLocation?.latitude && userLocation?.longitude) return [userLocation.latitude, userLocation.longitude]
		} catch (e) {
			return null
		}
		return null
	}, [geofence, userLocation])

	// HYDRATION + NULL CHECK
	if (!mounted || typeof window === 'undefined' || !currentCenter || isNaN(currentCenter[0])) {
		return (
			<div className="w-full h-full bg-[#0b0b0b] flex flex-col items-center justify-center border border-[#222] rounded-xl">
				<Satellite className="w-8 h-8 text-[#00eeff]/40 mb-4 animate-bounce" />
				<span className="text-[#00eeff] text-[10px] uppercase tracking-widest animate-pulse">Establishing_Link...</span>
			</div>
		)
	}

	return (
		<div className="w-full h-full relative bg-[#0b0b0b] overflow-hidden rounded-xl border border-[#222]">
			<MapContainer
				center={currentCenter}
				zoom={17}
				scrollWheelZoom={true}
				style={{ height: '100%', width: '100%', background: '#0b0b0b' }}
				zoomControl={false}
			>
				<TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

				{geofence?.center_lat && (
					<Circle
						center={[geofence.center_lat, geofence.center_long]}
						radius={geofence.radius_meters || 500}
						pathOptions={{ color: '#00eeff', fillColor: '#00eeff', fillOpacity: 0.05, weight: 1 }}
					/>
				)}

				<LocateControl userLocation={userLocation} />

				{Object.entries(devices).map(([deviceId, history]) => {
					if (!history || !history[0]) return null
					const latest = history[0]
					return (
						<div key={deviceId}>
							<CircleMarker
								center={[latest.latitude, latest.longitude]}
								radius={8}
								pathOptions={{ fillColor: '#00eeff', color: '#fff', weight: 2, fillOpacity: 1 }}
							/>
							{history.slice(1, 10).map((tp, i) => (
								<CircleMarker
									key={`${deviceId}-trail-${i}`}
									center={[tp.latitude, tp.longitude]}
									radius={3}
									pathOptions={{ fillColor: '#00eeff', color: 'transparent', fillOpacity: 0.2 - i * 0.02 }}
								/>
							))}
						</div>
					)
				})}
			</MapContainer>
		</div>
	)
}
