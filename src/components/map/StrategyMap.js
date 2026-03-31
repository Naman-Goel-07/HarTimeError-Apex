'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import { Target } from 'lucide-react' // Add this for the tactical icon

// This helper component handles the manual "Jump" logic
function LocateControl({ userLocation }) {
	const map = useMap()

	const handleJump = () => {
		if (userLocation) {
			// flyTo creates a smooth F1-style camera transition
			map.flyTo([userLocation.latitude, userLocation.longitude], 18, {
				duration: 1.5, // 1.5 seconds to "zoom in"
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

function RecenterMap({ coords }) {
	const map = useMap()
	useEffect(() => {
		if (coords && typeof window !== 'undefined') {
			map.setView(coords, map.getZoom(), { animate: true })
		}
	}, [coords, map])
	return null
}

// Accept userLocation as a prop
export default function StrategyMap({ points = [], userLocation = null }) {
	const defaultCenter = [28.7041, 77.1025]

	const currentCenter = useMemo(() => {
		if (points && points.length > 0) {
			return [points[0].latitude, points[0].longitude]
		}
		return defaultCenter
	}, [points])

	const renderPoints = useMemo(() => {
		return points.map((p, idx) => {
			const isNewest = idx < 5
			return (
				<CircleMarker
					key={p.id || idx}
					center={[p.latitude, p.longitude]}
					radius={isNewest ? 7 : 4}
					pathOptions={{
						fillColor: isNewest ? '#00eeff' : '#00b8cc',
						color: '#ffffff',
						weight: 0.5,
						opacity: 0.9,
						fillOpacity: 0.7,
					}}
				/>
			)
		})
	}, [points])

	if (typeof window === 'undefined') {
		return <div className="w-full h-full bg-carbon flex items-center justify-center font-mono text-data">BOOTING_MAP_SYSTEM...</div>
	}

	return (
		<div className="w-full h-full relative bg-carbon overflow-hidden rounded-xl border border-chassis">
			<MapContainer
				center={currentCenter}
				zoom={16}
				scrollWheelZoom={true}
				style={{ height: '100%', width: '100%', background: '#0b0b0b' }}
				zoomControl={false}
			>
				<TileLayer attribution="&copy; CARTO" url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
				{/* <TileLayer attribution="&copy; CARTO" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> */}
				{/* <TileLayer attribution="&copy; CARTO" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" /> */}

				{/* NEW: The Tactical Lock Button */}
				<LocateControl userLocation={userLocation} />

				<RecenterMap coords={currentCenter} />
				{renderPoints}

				<div
					className="absolute inset-0 pointer-events-none z-[400] opacity-15"
					style={{
						backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
						backgroundSize: '40px 40px',
					}}
				/>
			</MapContainer>

			{/* F1 HUD Metadata Overlays */}
			<div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2 pointer-events-none">
				<div className="bg-black/80 border-l-4 border-neon-green p-3 backdrop-blur-md flex flex-col">
					<span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">System Status</span>
					<span className="text-[#00ff66] font-display text-sm animate-pulse">STRATEGY_ENGINE_ONLINE</span>
				</div>
			</div>

			<div className="absolute bottom-6 right-6 z-[1000] font-mono flex flex-col items-end gap-1 pointer-events-none">
				<div className="bg-black/80 border-r-4 border-[#ff3333] p-2 backdrop-blur-md text-right">
					<span className="text-[10px] text-gray-400 uppercase">Live Telemetry Feed</span>
					<div className="flex items-center gap-2 justify-end">
						<span className="text-white font-display text-lg">{points.length}</span>
						<span className="text-[10px] text-gray-500 uppercase">Active Units</span>
					</div>
				</div>
			</div>
		</div>
	)
}
