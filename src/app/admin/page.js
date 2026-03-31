'use client'

export const dynamic = 'force-dynamic'

import { useTelemetry } from '@/hooks/useTelemetry'
import { Activity, ShieldAlert, Users, RadioTower, CheckCircle2 } from 'lucide-react'
import dynamicImport from 'next/dynamic'

const StrategyMap = dynamicImport(() => import('@/components/map/StrategyMap'), {
	ssr: false,
	loading: () => (
		<div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center font-mono text-[#00eeff]">
			<span className="animate-pulse tracking-widest text-xs uppercase">Initialising_Aero_Map...</span>
		</div>
	),
})

export default function AdminPitWallPage() {
	// UPDATED: Now destructuring userLocation so the map can "Lock" onto you
	const { points, userLocation } = useTelemetry(false)

	const totalPoints = points.length
	const isCongested = totalPoints > 50

	return (
		<div className="flex flex-col lg:flex-row h-screen w-full bg-[#0a0a0a] text-[#e2e8f0] font-body overflow-hidden">
			{/* Sidebar / Top Header for Mobile */}
			<aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#222] bg-[#121212] flex flex-col z-10 shadow-[0_4px_24px_rgba(0,0,0,0.5)] lg:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-all">
				<div className="p-4 lg:p-6 border-b border-[#222] flex justify-between items-center lg:block">
					<div>
						<h1 className="text-xl lg:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00eeff] to-[#00ff66] font-display uppercase">
							APEX
						</h1>
						<p className="hidden lg:block text-[10px] font-mono uppercase tracking-[0.2em] text-[#8892a4] mt-1">Pit Wall Telemetry</p>
					</div>
					<div className="lg:hidden flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] rounded border border-[#00ff66]/30">
						<div className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse"></div>
						<span className="text-[10px] font-mono text-[#00ff66]">LIVE</span>
					</div>
				</div>

				<div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto p-4 lg:p-6 space-x-4 lg:space-x-0 lg:space-y-6 scrollbar-hide">
					<div className="flex-shrink-0 flex items-center gap-3 bg-[#1a1a1a] p-3 lg:p-4 rounded-lg border border-[#222] min-w-[140px] lg:min-w-0">
						<RadioTower className={`w-4 h-4 lg:w-5 lg:h-5 ${totalPoints > 0 ? 'text-[#00ff66] animate-pulse' : 'text-[#8892a4]'}`} />
						<div>
							<p className="text-[8px] lg:text-[10px] text-[#8892a4] uppercase font-bold tracking-wider">Link</p>
							<p className="text-xs lg:text-sm font-mono uppercase">{totalPoints > 0 ? 'Active' : 'Standby'}</p>
						</div>
					</div>

					<div className="flex lg:grid lg:grid-cols-2 gap-4">
						<div className="bg-[#1a1a1a] p-3 lg:p-4 rounded-lg border border-[#222] flex flex-col justify-between min-w-[100px] lg:min-w-0">
							<Users className="w-4 h-4 text-[#00eeff] mb-1 lg:mb-2" />
							<p className="text-xl lg:text-3xl font-bold font-mono text-white">{totalPoints}</p>
							<p className="text-[8px] uppercase text-[#8892a4]">Relays</p>
						</div>

						<div className="bg-[#1a1a1a] p-3 lg:p-4 rounded-lg border border-[#222] flex flex-col justify-between min-w-[100px] lg:min-w-0">
							<Activity className={`w-4 h-4 mb-1 lg:mb-2 ${isCongested ? 'text-[#ff3333]' : 'text-[#ffcc00]'}`} />
							<p className="text-xl lg:text-3xl font-bold font-mono text-white">{isCongested ? 'HIGH' : 'LOW'}</p>
							<p className="text-[8px] uppercase text-[#8892a4]">Density</p>
						</div>
					</div>

					<div className="hidden lg:block">
						<h3 className="text-[10px] uppercase font-bold tracking-wider text-[#8892a4] mb-3">Live Analysis</h3>
						{isCongested ? (
							<div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
								<ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
								<p className="text-[10px] text-red-500/90 font-mono uppercase leading-tight">Sector Overflow. Redirecting Vectors.</p>
							</div>
						) : (
							<div className="flex items-start gap-3 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
								<CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
								<p className="text-[10px] text-emerald-500/90 font-mono uppercase leading-tight">All Clear. Flow Rate Optimal.</p>
							</div>
						)}
					</div>
				</div>

				<div className="hidden lg:block p-4 border-t border-[#222] text-[10px] font-mono text-center text-[#4a5568]">APEX_ENGINE_V1.0.0</div>
			</aside>

			{/* Main Map View */}
			<main className="flex-1 relative order-last lg:order-none">
				{/* UPDATED: Passing userLocation to enable the DRV_LOCK button inside the map */}
				<StrategyMap points={points} userLocation={userLocation} />

				{/* Floating HUD */}
				<div className="absolute top-4 lg:top-6 right-4 lg:right-6 pointer-events-none z-[1000]">
					<div className="bg-black/70 backdrop-blur-md border border-[#ffffff15] px-3 py-1.5 lg:px-4 lg:py-2 rounded-full flex items-center gap-2">
						<span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#ff3333] animate-pulse"></span>
						<span className="text-[9px] lg:text-xs font-mono text-white/80 uppercase tracking-widest font-bold">Telemetry_Live</span>
					</div>
				</div>
			</main>
		</div>
	)
}
