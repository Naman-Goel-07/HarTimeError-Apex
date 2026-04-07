'use client'

export const dynamic = 'force-dynamic'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import styles from '../../page.module.css'
import { useTelemetry } from '@/hooks/useTelemetry'
import { computeHeatBlobs, determineStrategyZone } from '@/lib/crowdLogic'
import { useCompass } from '@/hooks/useCompass'
import dynamicImport from 'next/dynamic'

// 🏁 FIX 1: Dynamic Import for StrategyMap with SSR disabled
// This prevents Vercel from crashing during the build process
const StrategyMap = dynamicImport(() => import('@/components/StrategyMap'), {
	ssr: false,
	loading: () => (
		<div className="w-full h-[350px] bg-[#0b0b0b] flex items-center justify-center border border-[#222] rounded-xl">
			<span className="text-[#00eeff] text-[10px] uppercase animate-pulse">Initializing_Tactical_Map...</span>
		</div>
	),
})

// Radar & HUD Dynamic Imports
const RadarContainer = dynamicImport(() => import('@/components/radar').then((mod) => mod.RadarContainer), { ssr: false })
const RadarGrid = dynamicImport(() => import('@/components/radar').then((mod) => mod.RadarGrid), { ssr: false })
const HeatBlobs = dynamicImport(() => import('@/components/radar').then((mod) => mod.HeatBlobs), { ssr: false })
const ScanLine = dynamicImport(() => import('@/components/radar').then((mod) => mod.ScanLine), { ssr: false })
const DirectionArrow = dynamicImport(() => import('@/components/radar').then((mod) => mod.DirectionArrow), { ssr: false })
const UserDot = dynamicImport(() => import('@/components/radar').then((mod) => mod.UserDot), { ssr: false })
const Compass = dynamicImport(() => import('@/components/hud').then((mod) => mod.Compass), { ssr: false })
const StatsBar = dynamicImport(() => import('@/components/hud').then((mod) => mod.StatsBar), { ssr: false })

export default function EventCockpitPage() {
	const params = useParams()
	const eventId = params.id

	// 🏁 FIX 2: Destructure all data from the updated useTelemetry hook
	const { points, userLocation, eventMeta, deviceId } = useTelemetry(eventId, true)

	const { heading, mode, isSupported, requestPermission, permissionGranted } = useCompass(userLocation)

	const safeHeading = useMemo(() => (isNaN(heading) || !heading ? 0 : heading), [heading])

	const blobs = useMemo(() => {
		if (!userLocation) return []
		return computeHeatBlobs(userLocation.latitude, userLocation.longitude, points, 500)
	}, [userLocation, points])

	const zone = useMemo(() => determineStrategyZone(blobs), [blobs])

	const guidance = useMemo(() => {
		if (zone.status === 'RED') return { message: 'DIRTY AIR AHEAD', suggestion: 'Divert 45° Right' }
		if (zone.status === 'YELLOW') return { message: 'CAUTION: RISING DENSITY', suggestion: 'Maintain Speed' }
		return { message: 'SECTOR CLEAR', suggestion: 'Proceed on Current Line' }
	}, [zone])

	return (
		<main className={styles.pageWrapper}>
			<header className={styles.header}>
				<div className={styles.logoGroup}>
					<h1 className={styles.logoTitle} style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
						<span style={{ color: 'var(--text-primary)' }}>APEX</span>
						<span style={{ color: 'var(--neon-cyan)', marginLeft: '4px' }}>TELEMETRY</span>
					</h1>
					<p className={styles.logoSubtitle}>
						CALLSIGN: <span className="text-[#00eeff]">{deviceId || '---'}</span> // SECTOR: {eventId?.slice(0, 8).toUpperCase()}
					</p>
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

			{/* 🏁 THE TACTICAL MAP: Integrated with DRV_LOCK & History */}
			<section className="flex-1 w-full relative min-h-[350px] overflow-hidden border-b border-[#222]">
				<StrategyMap points={points} userLocation={userLocation} geofence={eventMeta} />
			</section>

			{/* 🏁 THE RADAR SECTION */}
			<section className={styles.radarSection}>
				<div className={styles.radarTopRow}>
					<StatsBar overallDensity={zone.status} heading={Math.round(safeHeading)} cardinalDirection={'N'} />
					<Compass heading={safeHeading} />
				</div>

				<div
					className="relative aspect-square w-full max-w-[280px] mx-auto my-4"
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

				{!permissionGranted && isSupported && (
					<div className="flex justify-center mb-4">
						<button
							onClick={requestPermission}
							className="bg-[#121212] border border-[#00eeff]/40 text-[#00eeff] text-[9px] px-4 py-2 rounded-sm uppercase tracking-widest"
						>
							Sync_Compass_Sensors
						</button>
					</div>
				)}
			</section>

			<section className="p-4 bg-black/60 border-t border-[#222]">
				<div
					className="bg-[#111] border-l-4 p-4 rounded-sm"
					style={{ borderLeftColor: zone.status === 'RED' ? 'var(--neon-red)' : 'var(--neon-cyan)' }}
				>
					<div className="text-[10px] text-gray-500 font-mono uppercase mb-1">{guidance.message}</div>
					<div className="text-lg font-display font-bold text-white uppercase tracking-tight">{guidance.suggestion}</div>
				</div>
			</section>
		</main>
	)
}
