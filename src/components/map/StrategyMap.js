'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from 'react-leaflet'
import { Target, Satellite, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 🛠️ Leaflet Icon Fix for Production
if (typeof window !== 'undefined') {
	delete L.Icon.Default.prototype._getIconUrl
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
		iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
		shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	})
}

// Button now jumps to the Event (Geofence) coordinates
function LocateControl({ geofence }) {
	const map = useMap()

	// Check if the event center coordinates exist
	const hasEventCoords = !!(geofence?.center_lat && geofence?.center_long)

	const handleJump = () => {
		if (hasEventCoords) {
			// Zoom level 17 gives a good tactical overview of the 500m radius
			map.flyTo([geofence.center_lat, geofence.center_long], 17, {
				duration: 1.5,
				easeLinearity: 0.25,
			})
		}
	}

	return (
		<div className="absolute top-24 left-6 z-[1000]">
			<button
				onClick={handleJump}
				disabled={!hasEventCoords}
				className={`group flex items-center gap-3 bg-black/80 border p-2 pr-4 rounded-sm backdrop-blur-md transition-all active:scale-95 shadow-lg 
                    ${hasEventCoords ? 'border-[#222] hover:border-[#00eeff]' : 'border-red-900/50 opacity-50 cursor-not-allowed'}`}
			>
				<div className={`${hasEventCoords ? 'bg-[#00eeff]/10' : 'bg-red-500/10'} p-1.5 rounded-sm`}>
					<MapPin className={`w-4 h-4 ${hasEventCoords ? 'text-[#00eeff] animate-pulse' : 'text-red-500'}`} />
				</div>
				<div className="flex flex-col items-start leading-none">
					<span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">{hasEventCoords ? 'Sector' : 'Offline'}</span>
					<span className={`text-xs font-bold uppercase tracking-wider ${hasEventCoords ? 'text-white' : 'text-red-500'}`}>
						{hasEventCoords ? 'EVENT_LOCK' : 'NO_SIGNAL'}
					</span>
				</div>
			</button>
		</div>
	)
}

export default function StrategyMap({ points = [], userLocation = null, geofence = null }) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	// GROUPING LOGIC: Organizes flat points into { deviceId: [latestPoint, ...history] }
	const devices = useMemo(() => {
		const groups = {}
		if (!Array.isArray(points)) return groups

		points.forEach((p) => {
			// Added filter to ignore "DRV-SYNCING" to prevent ghost counts
			if (!p || !p.device_id || p.device_id === 'DRV-SYNCING') return

			const id = p.device_id
			if (!groups[id]) groups[id] = []
			groups[id].push(p)
		})
		return groups
	}, [points])

	const currentCenter = useMemo(() => {
		if (geofence?.center_lat) return [geofence.center_lat, geofence.center_long]
		if (userLocation) return [userLocation.latitude, userLocation.longitude]
		return null
	}, [geofence, userLocation])

	if (!mounted || !currentCenter || typeof window === 'undefined') {
		return (
			<div className="w-full h-full bg-[#0b0b0b] flex flex-col items-center justify-center font-mono border border-[#222] rounded-xl">
				<Satellite className="w-8 h-8 text-[#00eeff]/40 mb-4 animate-bounce" />
				<span className="text-[#00eeff] text-[10px] uppercase tracking-[0.4em] animate-pulse">Establishing_Satellite_Link...</span>
			</div>
		)
	}

	return (
		<div className="w-full h-full relative bg-[#0b0b0b] overflow-hidden rounded-xl border border-[#222]">
			<MapContainer center={currentCenter} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl={false}>
				<TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

				{geofence?.center_lat && (
					<Circle
						center={[geofence.center_lat, geofence.center_long]}
						radius={geofence.radius_meters || 500}
						pathOptions={{ color: '#00eeff', fillColor: '#00eeff', fillOpacity: 0.05, weight: 1, dashArray: '10, 10' }}
					/>
				)}

				{/* Passing geofence instead of userLocation */}
				<LocateControl geofence={geofence} />

				{/* 🚗 RENDER DRIVERS */}
				{Object.entries(devices).map(([deviceId, history]) => {
					const latest = history[0]
					const trail = history.slice(1, 12) // Show last 12 points as trail

					return (
						<div key={deviceId}>
							{/* Main Active Car Dot */}
							<CircleMarker
								center={[latest.latitude, latest.longitude]}
								radius={8}
								pathOptions={{ fillColor: '#00eeff', color: '#fff', weight: 2, fillOpacity: 1 }}
							/>
							{/* History Thing (The Trail) */}
							{trail.map((tp, i) => (
								<CircleMarker
									key={`${deviceId}-trail-${i}`}
									center={[tp.latitude, tp.longitude]}
									radius={3}
									pathOptions={{
										fillColor: '#00eeff',
										color: 'transparent',
										fillOpacity: 0.4 - i * 0.04, // Trail fades out
									}}
								/>
							))}
						</div>
					)
				})}
			</MapContainer>

			{/* HUD Status */}
			<div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
				<div className="bg-black/80 border-l-4 border-[#00ff66] p-3 backdrop-blur-md flex flex-col">
					<span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-none mb-1">Fleet Connectivity</span>
					<span className="text-[#00ff66] font-bold text-xs animate-pulse tracking-tighter uppercase">
						{Object.keys(devices).length} Units_Syncing
					</span>
				</div>
			</div>
		</div>
	)
}
