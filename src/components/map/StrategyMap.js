'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from 'react-leaflet'
import { Target, Satellite } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

function LocateControl({ userLocation }) {
	const map = useMap()
	const isLocked = !!userLocation
	const handleJump = () => {
		if (isLocked) map.flyTo([userLocation.latitude, userLocation.longitude], 18, { duration: 1.5 })
	}

	return (
		<div className="absolute top-24 left-6 z-[1000]">
			<button
				onClick={handleJump}
				disabled={!isLocked}
				className={`group flex items-center gap-3 bg-black/90 border p-2 pr-4 rounded-sm backdrop-blur-xl transition-all active:scale-95 shadow-2xl
                    ${isLocked ? 'border-[#222] hover:border-[#00eeff]' : 'border-red-500/30 opacity-60'}`}
			>
				<div className={`${isLocked ? 'bg-[#00eeff]/10' : 'bg-red-500/10'} p-1.5 rounded-sm`}>
					<Target className={`w-4 h-4 ${isLocked ? 'text-[#00eeff] animate-pulse' : 'text-red-500'}`} />
				</div>
				<div className="flex flex-col items-start leading-none">
					<span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">{isLocked ? 'Tactical' : 'Signal'}</span>
					<span className={`text-xs font-bold uppercase tracking-wider ${isLocked ? 'text-white' : 'text-red-500'}`}>
						{isLocked ? 'DRV_LOCK' : 'SEARCHING...'}
					</span>
				</div>
			</button>
		</div>
	)
}

export default function StrategyMap({ points = [], userLocation = null, geofence = null }) {
	// 🧠 GROUPING LOGIC: Organizes raw points into { deviceId: [latestPoint, ...history] }
	const devices = useMemo(() => {
		const groups = {}
		points.forEach((p) => {
			const id = p.device_id || 'unknown'
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

	if (!currentCenter || typeof window === 'undefined') {
		return (
			<div className="w-full h-full bg-[#0b0b0b] flex flex-col items-center justify-center font-mono border border-[#222] rounded-xl">
				<Satellite className="w-8 h-8 text-[#00eeff]/40 mb-4 animate-bounce" />
				<span className="text-[#00eeff] text-[10px] uppercase tracking-[0.4em] animate-pulse">Awaiting_Satellite_Lock...</span>
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
				<TileLayer attribution="&copy; CARTO" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

				{/* Geofence Rendering */}
				{geofence?.center_lat && (
					<Circle
						center={[geofence.center_lat, geofence.center_long]}
						radius={geofence.radius_meters || 500}
						pathOptions={{ color: '#00eeff', fillColor: '#00eeff', fillOpacity: 0.05, weight: 1, dashArray: '10, 10' }}
					/>
				)}

				<LocateControl userLocation={userLocation} />

				{/* 🚗 RENDER EACH DEVICE */}
				{Object.entries(devices).map(([deviceId, history]) => {
					const latest = history[0]
					const trail = history.slice(1, 10) // Show last 10 points as trail

					return (
						<div key={deviceId}>
							{/* The "One Dot" (Current Position) */}
							<CircleMarker
								center={[latest.latitude, latest.longitude]}
								radius={8}
								pathOptions={{ fillColor: '#00eeff', color: '#fff', weight: 2, fillOpacity: 1 }}
							>
								{/* Optional: Add a label or tooltip here for deviceId */}
							</CircleMarker>

							{/* The "History Thing" (Breadcrumb Trail) */}
							{trail.map((tp, i) => (
								<CircleMarker
									key={`${deviceId}-t-${i}`}
									center={[tp.latitude, tp.longitude]}
									radius={3}
									pathOptions={{ fillColor: '#00eeff', color: 'transparent', fillOpacity: 0.3 - i * 0.03 }}
								/>
							))}
						</div>
					)
				})}

				<div
					className="absolute inset-0 pointer-events-none z-[400] opacity-10"
					style={{
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
						backgroundSize: '40px 40px',
					}}
				/>
			</MapContainer>

			{/* Status HUD */}
			<div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
				<div className="bg-black/80 border-l-4 border-[#00ff66] p-3 backdrop-blur-md flex flex-col">
					<span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-none mb-1">Telemetry Feed</span>
					<span className="text-[#00ff66] font-bold text-xs animate-pulse tracking-tighter uppercase">
						{Object.keys(devices).length} Units_Active
					</span>
				</div>
			</div>
		</div>
	)
}
