'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crosshair, ChevronRight, Activity, Zap, Map as MapIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EventPortal() {
	const [events, setEvents] = useState([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchEvents() {
			// Fetching from the 'events' table we created earlier
			const { data, error } = await supabase.from('events').select('*').eq('is_active', true).order('created_at', { ascending: false })

			if (!error && data) setEvents(data)
			setLoading(false)
		}
		fetchEvents()
	}, [])

	return (
		<main className="min-h-screen bg-[#0a0a0a] text-[#e2e8f0] flex flex-col items-center justify-center p-6 font-mono">
			<div className="max-w-md w-full space-y-8 z-10">
				<div className="text-center space-y-2">
					<Zap className="w-8 h-8 text-[#00eeff] mx-auto animate-pulse" />
					<h1 className="text-5xl font-black tracking-tighter text-white">APEX</h1>
					<p className="text-[10px] tracking-[0.4em] text-[#8892a4] uppercase">Select Active Sector</p>
				</div>

				<div className="grid gap-4 mt-12">
					{loading ? (
						<div className="text-center py-10 animate-pulse text-xs text-[#444]">SCANNING FREQUENCIES...</div>
					) : events.length > 0 ? (
						events.map((event) => (
							<Link key={event.id} href={`/event/${event.id}`}>
								<div className="group bg-[#121212] border border-[#222] hover:border-[#00eeff] p-5 rounded-xl transition-all flex items-center justify-between cursor-pointer">
									<div className="flex items-center gap-4">
										<div className="bg-[#1a1a1a] p-2 rounded-lg group-hover:bg-cyan-950/30 transition-colors">
											<Activity className="text-[#00eeff] w-5 h-5" />
										</div>
										<div>
											<h2 className="text-sm font-bold uppercase italic text-white">{event.name}</h2>
											<p className="text-[9px] text-[#444] uppercase">{event.description || 'Live Stream Active'}</p>
										</div>
									</div>
									<ChevronRight className="w-4 h-4 text-[#222] group-hover:text-[#00eeff]" />
								</div>
							</Link>
						))
					) : (
						<div className="text-center py-10 border border-dashed border-[#222] rounded-xl">
							<p className="text-[10px] text-[#444]">NO ACTIVE SECTORS DETECTED</p>
						</div>
					)}
				</div>

				<Link href="/admin" className="block">
					<button className="w-full mt-4 flex items-center justify-center gap-2 text-[10px] text-[#444] hover:text-[#00ff66] transition-colors border border-[#222] py-3 rounded-lg uppercase tracking-widest">
						<MapIcon className="w-3 h-3" /> Pit Wall Admin
					</button>
				</Link>
			</div>
		</main>
	)
}
