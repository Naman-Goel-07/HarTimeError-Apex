'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTelemetry } from '@/hooks/useTelemetry'
import { supabase } from '@/lib/supabase'
import { Activity, ShieldAlert, Users, RadioTower, CheckCircle2, ChevronLeft, Target } from 'lucide-react'
import Link from 'next/link'
import dynamicImport from 'next/dynamic'

const StrategyMap = dynamicImport(() => import('@/components/map/StrategyMap'), {
	ssr: false,
	loading: () => (
		<div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center font-mono text-[#00eeff]">
			<span className="animate-pulse tracking-widest text-xs uppercase text-center">Initialising_Aero_Map...</span>
		</div>
	),
})

export default function AdminPitWallPage() {
	const params = useParams()
	const eventId = params.id
	const [eventDetails, setEventDetails] = useState(null)

	// 🏁 MONITORING MODE: isCockpit = false (doesn't upload admin location)
	const { points, userLocation } = useTelemetry(eventId, false)

	useEffect(() => {
		async function getEventInfo() {
			// Fetching the center coordinates and radius we added to the DB
			const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
			if (data) setEventDetails(data)
		}
		if (eventId) getEventInfo()
	}, [eventId])

	const totalPoints = points.length
	const isCongested = totalPoints > 50

	return (
		<div className="flex flex-col lg:flex-row h-screen w-full bg-[#0a0a0a] text-[#e2e8f0] font-body overflow-hidden">
			{/* Sidebar / Strategy Controls */}
			<aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#222] bg-[#121212] flex flex-col z-10 shadow-2xl transition-all">
				<div className="p-4 lg:p-6 border-b border-[#222]">
					<Link
						href="/admin"
						className="flex items-center gap-2 text-[8px] text-[#444] hover:text-[#00eeff] uppercase tracking-widest mb-4 transition-colors font-mono"
					>
						<ChevronLeft className="w-3 h-3" /> Back to Paddock
					</Link>

					<div className="flex justify-between items-center lg:block">
						<div>
							<h1 className="text-xl lg:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00eeff] to-[#00ff66] font-display uppercase">
								APEX
							</h1>
							<p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#00eeff] mt-1 italic">
								{eventDetails?.name || 'Sector_Loading...'}
							</p>
						</div>
					</div>
				</div>

				<div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto p-4 lg:p-6 space-x-4 lg:space-x-0 lg:space-y-6 scrollbar-hide">
					{/* Telemetry Status */}
					<div className="flex-shrink-0 flex items-center gap-3 bg-[#1a1a1a] p-3 lg:p-4 rounded-lg border border-[#222]">
						<RadioTower className={`w-4 h-4 lg:w-5 lg:h-5 ${totalPoints > 0 ? 'text-[#00ff66] animate-pulse' : 'text-[#8892a4]'}`} />
						<div>
							<p className="text-[8px] lg:text-[10px] text-[#8892a4] uppercase font-bold tracking-wider">Stream</p>
							<p className="text-xs lg:text-sm font-mono uppercase">{totalPoints > 0 ? 'Encrypted' : 'Standby'}</p>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="flex lg:grid lg:grid-cols-2 gap-4">
						<div className="bg-[#1a1a1a] p-3 lg:p-4 rounded-lg border border-[#222] flex flex-col justify-between">
							<Users className="w-4 h-4 text-[#00eeff] mb-1 lg:mb-2" />
							<p className="text-xl lg:text-3xl font-bold font-mono text-white">{totalPoints}</p>
							<p className="text-[8px] uppercase text-[#8892a4]">Relays</p>
						</div>
						<div className="bg-[#1a1a1a] p-3 lg:p-4 rounded-lg border border-[#222] flex flex-col justify-between">
							<Activity className={`w-4 h-4 mb-1 lg:mb-2 ${isCongested ? 'text-[#ff3333]' : 'text-[#ffcc00]'}`} />
							<p className="text-xl lg:text-3xl font-bold font-mono text-white">{isCongested ? 'HIGH' : 'LOW'}</p>
							<p className="text-[8px] uppercase text-[#8892a4]">Friction</p>
						</div>
					</div>

					{/* 🏁 NEW: Sector Boundary Visualizer */}
					<div className="hidden lg:block space-y-3">
						<h3 className="text-[10px] uppercase font-bold tracking-wider text-[#8892a4]">Sector Boundary</h3>
						<div className="p-3 bg-[#1a1a1a] border border-[#222] rounded-lg space-y-2">
							<div className="flex justify-between text-[10px] font-mono">
								<span className="text-[#444]">RADIUS</span>
								<span className="text-[#00eeff]">{eventDetails?.radius_meters || 0}m</span>
							</div>
							<div className="flex justify-between text-[10px] font-mono">
								<span className="text-[#444]">COORDS</span>
								<span className="text-white/60">
									{eventDetails?.center_lat?.toFixed(4)}, {eventDetails?.center_long?.toFixed(4)}
								</span>
							</div>
							<div className="pt-2 border-t border-[#222] flex items-center gap-2">
								<Target className="w-3 h-3 text-[#00eeff]" />
								<span className="text-[9px] text-[#00eeff] uppercase font-bold">Geofence_Locked</span>
							</div>
						</div>
					</div>

					{/* Live Analysis */}
					<div className="hidden lg:block">
						<h3 className="text-[10px] uppercase font-bold tracking-wider text-[#8892a4] mb-3">Strategy Output</h3>
						{isCongested ? (
							<div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
								<ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
								<p className="text-[10px] text-red-500/90 font-mono uppercase leading-tight">
									Critical density. Deploying redirection vectors.
								</p>
							</div>
						) : (
							<div className="flex items-start gap-3 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
								<CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
								<p className="text-[10px] text-emerald-500/90 font-mono uppercase leading-tight">Sector clear. Flow rate nominal.</p>
							</div>
						)}
					</div>
				</div>

				<div className="hidden lg:block p-4 mt-auto border-t border-[#222] text-[10px] font-mono text-center text-[#4a5568]">
					APEX_STRATEGY_NODE_{eventId?.slice(0, 4).toUpperCase()}
				</div>
			</aside>

			{/* Main Map View */}
			<main className="flex-1 relative order-last lg:order-none">
				<StrategyMap
					points={points}
					userLocation={userLocation}
					// 🏁 PASSING EVENT DETAILS DIRECTLY
					// This ensures center_lat, center_long, and radius_meters are seen by the map logic
					geofence={eventDetails}
				/>

				<div className="absolute top-4 lg:top-6 right-4 lg:right-6 pointer-events-none z-[1000]">
					<div className="bg-black/70 backdrop-blur-md border border-[#ffffff15] px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
						<span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse"></span>
						<span className="text-[10px] font-mono text-white/80 uppercase tracking-widest font-bold">Uplink_Established</span>
					</div>
				</div>
			</main>
		</div>
	)
}
