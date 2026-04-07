'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, ChevronRight, Activity, ShieldAlert, Plus, Zap } from 'lucide-react'

export default function AdminPortal() {
	const [events, setEvents] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchEvents() {
			const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })

			if (!error && data) setEvents(data)
			setLoading(false)
		}
		fetchEvents()

		// Listen for status updates from the Python Engine
		const channel = supabase
			.channel('event-status-updates')
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (payload) => {
				setEvents((prev) => prev.map((e) => (e.id === payload.new.id ? payload.new : e)))
			})
			.subscribe()

		return () => supabase.removeChannel(channel)
	}, [])

	return (
		<main className="min-h-screen bg-[#0a0a0a] text-[#e2e8f0] p-6 lg:p-12 font-mono">
			<div className="max-w-5xl mx-auto space-y-12">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-2">
						<div className="flex items-center gap-3 text-[#00eeff]">
							<LayoutDashboard className="w-6 h-6" />
							<span className="text-[10px] uppercase tracking-[0.4em] font-bold">Pit Wall Command</span>
						</div>
						<h1 className="text-4xl lg:text-6xl font-black tracking-tighter">GLOBAL_SECTORS</h1>
					</div>
					<button className="flex items-center gap-2 bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest hover:border-[#00ff66] transition-all">
						<Plus className="w-4 h-4 text-[#00ff66]" /> Create New Sector
					</button>
				</div>

				{/* Event Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{loading ? (
						<div className="col-span-full py-20 text-center animate-pulse text-[#444] text-xs">SYNCHRONISING_DATABASE...</div>
					) : (
						events.map((event) => (
							<Link key={event.id} href={`/admin/${event.id}`}>
								<div className="group bg-[#121212] border border-[#222] hover:border-[#00eeff] p-6 rounded-2xl transition-all relative overflow-hidden cursor-pointer shadow-2xl">
									<div className="flex justify-between items-start mb-8">
										<div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#222] group-hover:bg-cyan-950/20 transition-colors">
											<Zap className="w-5 h-5 text-[#00eeff]" />
										</div>
										<div
											className={`px-2 py-1 rounded text-[8px] font-bold border ${
												event.status === 'RED'
													? 'text-red-500 border-red-500 bg-red-500/10'
													: event.status === 'YELLOW'
														? 'text-yellow-500 border-yellow-500 bg-yellow-500/10'
														: 'text-green-500 border-green-500 bg-green-500/10'
											}`}
										>
											{event.status || 'GREEN'}
										</div>
									</div>

									<div className="space-y-1">
										<h2 className="text-lg font-bold uppercase italic tracking-tight">{event.name}</h2>
										<p className="text-[10px] text-[#444] uppercase tracking-wider line-clamp-1">
											{event.description || 'Active Telemetry Stream'}
										</p>
									</div>

									<div className="mt-6 flex items-center justify-between border-t border-[#1a1a1a] pt-4">
										<div className="flex items-center gap-2">
											<Activity className="w-3 h-3 text-[#444]" />
											<span className="text-[9px] text-[#444] uppercase">Monitor Feed</span>
										</div>
										<ChevronRight className="w-4 h-4 text-[#222] group-hover:text-[#00eeff] transition-transform group-hover:translate-x-1" />
									</div>
								</div>
							</Link>
						))
					)}
				</div>
			</div>
		</main>
	)
}
