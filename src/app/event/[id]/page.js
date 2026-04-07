'use client'

export const dynamic = 'force-dynamic'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import styles from '../../page.module.css'
import { useTelemetry } from '@/hooks/useTelemetry'
import { computeHeatBlobs, determineStrategyZone } from '@/lib/crowdLogic'
import { useCompass } from '@/hooks/useCompass'
import { useGuidance } from '@/hooks/useGuidance'
import dynamicImport from 'next/dynamic'

// Dynamic Imports
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

	// 1. TELEMETRY: Get live GPS data
	const { points, userLocation } = useTelemetry(eventId, true)

	// 2. SENSORS: Get compass hardware data
	const { heading, cardinalDirection, isSupported, requestPermission, permissionGranted } = useCompass()

	// Fallback if compass is initializing
	const safeHeading = useMemo(() => (isNaN(heading) || heading === null ? 0 : heading), [heading])

	// 3. MATH ENGINE: Translate GPS to Radar Blobs
	const blobs = useMemo(() => {
		if (!userLocation) return []
		// Pass 500m as the max radius of your radar screen
		return computeHeatBlobs(userLocation.latitude, userLocation.longitude, points, 500)
	}, [userLocation, points])

	// Sector status (Red/Yellow/Green overall warning)
	const zone = useMemo(() => determineStrategyZone(blobs), [blobs])

	// 4. TACTICAL GUIDANCE: AI calculates evasive maneuvers based on blobs + heading
	const guidance = useGuidance(safeHeading, blobs)

	return (
		<main className={styles.pageWrapper}>
			<header className={styles.header}>
				<div className={styles.logoGroup}>
					<h1 className={styles.logoTitle} style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
						<span style={{ color: 'var(--text-primary)' }}>APEX</span>
						<span style={{ color: 'var(--neon-cyan)', marginLeft: '4px' }}>TELEMETRY</span>
					</h1>
					<p className={styles.logoSubtitle}>SECTOR: {eventId?.slice(0, 8).toUpperCase()} // LIVE_LINK</p>
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
					{/* Passed dynamic cardinalDirection to the HUD */}
					<StatsBar overallDensity={zone.status} heading={Math.round(safeHeading)} cardinalDirection={cardinalDirection || 'N'} />
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
						Sensor:{' '}
						<span className={permissionGranted ? 'text-[#00ff66] font-bold' : 'text-[#ffcc00] font-bold'}>
							{permissionGranted ? 'ACTIVE' : 'STANDBY'}
						</span>
					</div>
				</div>

				<div className="flex flex-col items-center justify-center mt-3 gap-2">
					{!permissionGranted && isSupported && (
						<button
							onClick={requestPermission}
							className="bg-[#121212] border border-[#00eeff]/50 text-[#00eeff] text-[10px] px-4 py-2 rounded-full uppercase tracking-widest hover:bg-[#00eeff]/10"
						>
							Sync Compass
						</button>
					)}
				</div>
			</section>

			<section className="mt-auto p-6 pb-12">
				<div
					style={{
						background: 'var(--bg-elevated)',
						// Dynamic border color based on AI Threat Severity
						borderLeft: `4px solid ${
							guidance.severity === 'high' ? 'var(--neon-red)' : guidance.severity === 'medium' ? 'var(--neon-yellow)' : 'var(--neon-cyan)'
						}`,
						padding: '16px',
						borderRadius: '4px',
					}}
				>
					<div
						className={`text-[10px] mb-1 font-mono tracking-tighter ${
							guidance.severity === 'high' ? 'text-red-500' : guidance.severity === 'medium' ? 'text-yellow-500' : 'text-cyan-400'
						}`}
					>
						{guidance.message}
					</div>
					<div className="text-lg font-bold font-display uppercase tracking-tight text-white/90">{guidance.suggestion}</div>
				</div>
			</section>
		</main>
	)
}
