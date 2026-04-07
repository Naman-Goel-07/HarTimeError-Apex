'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, useMap } from 'react-leaflet'
import { Target, Satellite } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// 🏁 Helper: Smooth camera transition to a specific point
function LocateControl({ userLocation }) {
	const map = useMap()
	const handleJump = () => {
		if (userLocation) {
			map.flyTo([userLocation.latitude, userLocation.longitude], 18, {
				duration: 1.5,
				easeLinearity: 0.25,
			})
		}
	}
	if (!userLocation) return null

	return (
		<div className="absolute top-24 left-6 z-[1000]">
			<button
				onClick={handleJump}
				className="group flex items-center gap-3 bg-black/80 border border-[#222] hover:border-[#00eeff] p-2 pr-4 rounded-sm backdrop-blur-md transition-all active:scale-95 shadow-lg"
			>
				<div className="bg-[#00eeff]/10 p-1.5 rounded-sm group-hover:bg-[#00eeff]/20">
					<Target className="w-4 h-4 text-[#00eeff] animate-pulse" />
				</div>
				<div className="flex flex-col items-start leading-none">
					<span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">Tactical</span>
					<span className="text-xs font-display text-white uppercase tracking-wider">DRV_LOCK</span>
				</div>
			</button>
		</div>
	)
}

// 🏁 Helper: Forces the map to update its view when coords change
function RecenterMap({ coords }) {
	const map = useMap()
	useEffect(() => {
		if (coords && typeof window !== 'undefined') {
			map.setView(coords, map.getZoom(), { animate: true })
		}
	}, [coords, map])
	return null
}

export default function StrategyMap({ points = [], userLocation = null, geofence = null }) {
	// 🏁 FALLBACK CHAIN: Finding the center of the universe
	const currentCenter = useMemo(() => {
		// 1. Database Geofence Center (Best)
		if (geofence?.center_lat && geofence?.center_long) {
			return [geofence.center_lat, geofence.center_long]
		}
		// 2. Latest Telemetry Data (Active)
		if (points && points.length > 0) {
			return [points[0].latitude, points[0].longitude]
		}
		// 3. Admin's Current GPS (Emergency)
		if (userLocation) {
			return [userLocation.latitude, userLocation.longitude]
		}
		return null
	}, [points, geofence, userLocation])

	// 🏁 LOADING GUARD: No map rendered until coordinates exist
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

				{/* 🏁 GEOFENCE: Visual Boundary */}
				{geofence?.center_lat && (
					<Circle
						center={[geofence.center_lat, geofence.center_long]}
						radius={geofence.radius_meters || 500}
						pathOptions={{
							color: '#00eeff',
							fillColor: '#00eeff',
							fillOpacity: 0.05,
							weight: 1,
							dashArray: '10, 10',
						}}
					/>
				)}

				<LocateControl userLocation={userLocation} />
				<RecenterMap coords={currentCenter} />

				{/* 🏁 TELEMETRY DOTS */}
				{points.map((p, idx) => (
					<CircleMarker
						key={p.id || idx}
						center={[p.latitude, p.longitude]}
						radius={idx < 5 ? 7 : 4} // Newer points are larger
						pathOptions={{
							fillColor: idx < 5 ? '#00eeff' : '#00b8cc',
							color: '#ffffff',
							weight: 0.5,
							fillOpacity: 0.7,
						}}
					/>
				))}

				{/* Grid Overlay */}
				<div
					className="absolute inset-0 pointer-events-none z-[400] opacity-10"
					style={{
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
						backgroundSize: '40px 40px',
					}}
				/>
			</MapContainer>

			{/* HUD Overlays */}
			<div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
				<div className="bg-black/80 border-l-4 border-[#00ff66] p-3 backdrop-blur-md flex flex-col">
					<span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-none mb-1">System Status</span>
					<span className="text-[#00ff66] font-bold text-xs animate-pulse tracking-tighter uppercase">Strategy_Engine_Online</span>
				</div>
			</div>
		</div>
	)
}
