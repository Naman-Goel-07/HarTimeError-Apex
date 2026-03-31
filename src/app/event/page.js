'use client'

// 1. Force dynamic for live GPS tracking
export const dynamic = 'force-dynamic'

import { useMemo, useEffect } from 'react'
import styles from '../page.module.css'
import { useTelemetry } from '@/hooks/useTelemetry'
import { computeHeatBlobs, determineStrategyZone } from '@/lib/crowdLogic'
import { useCompass } from '@/hooks/useCompass'

// 2. Dynamic Imports for Radar components to prevent "window is not defined" on mobile/Vercel
import dynamicImport from 'next/dynamic'

const RadarContainer = dynamicImport(() => import('@/components/radar').then((mod) => mod.RadarContainer), { ssr: false })
const RadarGrid = dynamicImport(() => import('@/components/radar').then((mod) => mod.RadarGrid), { ssr: false })
const HeatBlobs = dynamicImport(() => import('@/components/radar').then((mod) => mod.HeatBlobs), { ssr: false })
const ScanLine = dynamicImport(() => import('@/components/radar').then((mod) => mod.ScanLine), { ssr: false })
const DirectionArrow = dynamicImport(() => import('@/components/radar').then((mod) => mod.DirectionArrow), { ssr: false })
const UserDot = dynamicImport(() => import('@/components/radar').then((mod) => mod.UserDot), { ssr: false })
const Compass = dynamicImport(() => import('@/components/hud').then((mod) => mod.Compass), { ssr: false })
const StatsBar = dynamicImport(() => import('@/components/hud').then((mod) => mod.StatsBar), { ssr: false })

export default function EventCockpitPage() {
	// true = BROADCAST mode (The phone becomes a sensor)
	const { points, userLocation } = useTelemetry(true)

	const { heading, mode, isSupported, requestPermission, permissionDenied, permissionGranted } = useCompass(userLocation)

	// Ensure heading is completely safe for mathematical transforms
	const safeHeading = useMemo(() => isNaN(heading) || heading === undefined || heading === null ? 0 : heading, [heading])
	
	// Temporary Debug Logs
	useEffect(() => {
		console.log("heading:", safeHeading);
		console.log("compass mode:", mode);
	}, [safeHeading, mode]);

	const blobs = useMemo(() => {
		if (!userLocation) return []
		return computeHeatBlobs(userLocation.latitude, userLocation.longitude, points, 500)
	}, [userLocation, points])

	const zone = useMemo(() => determineStrategyZone(blobs), [blobs])

	const guidance = useMemo(() => {
		if (zone.status === 'RED') return { message: 'DIRTY AIR AHEAD', suggestion: 'Divert 45° Right', severity: 'high' }
		if (zone.status === 'YELLOW') return { message: 'CAUTION: RISING DENSITY', suggestion: 'Maintain Speed, Monitor Radar', severity: 'medium' }
		return { message: 'SECTOR CLEAR', suggestion: 'Proceed on Current Line', severity: 'low' }
	}, [zone])

	return (
		<main className={styles.pageWrapper}>
			<header className={styles.header}>
				<div className={styles.logoGroup}>
					<h1 className={styles.logoTitle} style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
						<span style={{ color: 'var(--text-primary)' }}>APEX</span>
						<span style={{ color: 'var(--neon-cyan)', marginLeft: '4px' }}>TELEMETRY</span>
					</h1>
					<p className={styles.logoSubtitle}>Cockpit View // LIVE_LINK</p>
				</div>

				<div className={styles.headerRight}>
					<div
						className={`px-2 py-1 rounded border text-[10px] flex items-center gap-2 ${
							zone.status === 'RED'
								? 'bg-red-500/10 text-red-500 border-red-500'
								: zone.status === 'YELLOW'
									? 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
									: 'bg-green-500/10 text-green-500 border-green-500'
						}`}
					>
						<span
							className={`w-1.5 h-1.5 rounded-full animate-pulse ${
								zone.status === 'RED' ? 'bg-red-500' : zone.status === 'YELLOW' ? 'bg-yellow-500' : 'bg-green-500'
							}`}
						/>
						{zone.text || 'SCANNING'}
					</div>
				</div>
			</header>

			<section className={styles.radarSection}>
				<div className={styles.radarTopRow}>
					<StatsBar overallDensity={zone.status} heading={Math.round(safeHeading)} cardinalDirection={'N'} />
					<Compass heading={safeHeading} />
				</div>

				<div 
					className="relative aspect-square w-full max-w-[340px] mx-auto"
					style={{ transform: `rotate(${-safeHeading}deg)`, transition: 'transform 0.1s ease-out' }}
				>
					<RadarContainer>
						<RadarGrid />
						<HeatBlobs blobs={blobs} />
						<ScanLine />
						<DirectionArrow heading={safeHeading} />
						<UserDot />
					</RadarContainer>
				</div>

				<div className="text-center mt-4 font-mono">
					<span className="glow-text-cyan font-bold tracking-widest text-lg">HDG {String(Math.round(safeHeading)).padStart(3, '0')}°</span>
					<div className="text-[10px] text-[#8892a4] uppercase tracking-wider mt-1 opacity-80">
						Sensor: <span className="text-[#00eeff] font-bold">{mode}</span>
					</div>
				</div>

				{/* COMPASS CONTROLS & ERRORS */}
				<div className="flex flex-col items-center justify-center mt-3 gap-2">
					{!permissionGranted && isSupported && (
						<button 
							onClick={requestPermission} 
							className="bg-[#121212] border border-[#00eeff]/50 text-[#00eeff] text-[10px] px-4 py-2 rounded-full hover:bg-[#00eeff]/10 transition-colors uppercase tracking-widest"
						>
							Enable Compass
						</button>
					)}
					{permissionDenied && (
						<div className="text-[10px] text-red-500 font-mono tracking-wider uppercase text-center max-w-[80%]">
							Compass access required for direction tracking
						</div>
					)}
				</div>

				<div className="flex justify-center gap-4 mt-6 text-[10px] font-mono text-gray-500">
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-[var(--neon-red)] shadow-[0_0_8px_var(--neon-red)]"></span> DIRTY AIR
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-[var(--neon-yellow)] shadow-[0_0_8px_var(--neon-yellow)]"></span> CAUTION
					</div>
					<div className="flex items-center gap-1.5">
						<span className="w-2 h-2 rounded-full bg-[var(--neon-green)] shadow-[0_0_8px_var(--neon-green)]"></span> OPTIMAL
					</div>
				</div>
			</section>

			<section className="mt-auto p-6 pb-12">
				<div
					style={{
						background: 'var(--bg-elevated)',
						borderLeft: `4px solid ${zone.status === 'RED' ? 'var(--neon-red)' : 'var(--neon-cyan)'}`,
						padding: '16px',
						borderRadius: '4px',
						boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
					}}
				>
					<div className={`text-[10px] mb-1 font-mono tracking-tighter ${zone.status === 'RED' ? 'text-red-500' : 'text-cyan-400'}`}>
						{guidance.message}
					</div>
					<div className="text-lg font-bold font-display uppercase tracking-tight text-white/90">{guidance.suggestion}</div>
				</div>
				{!userLocation && (
					<div className="mt-4 text-center text-[10px] text-red-400 font-mono animate-pulse uppercase tracking-widest">
						Awaiting GPS Satellite Lock...
					</div>
				)}
			</section>
		</main>
	)
}
