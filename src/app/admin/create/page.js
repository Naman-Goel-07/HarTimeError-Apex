'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Target, Type, Compass, ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateEventPage() {
	const router = useRouter()

	const [formData, setFormData] = useState({
		name: '',
		center_lat: '',
		center_long: '',
		radius_meters: 500, // Default to 500m
	})

	const [isLocating, setIsLocating] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	// 🎯 TACTICAL FEATURE: Grab current GPS to set the Event Center
	const handleGetLocation = () => {
		setIsLocating(true)
		setError('')

		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setFormData((prev) => ({
						...prev,
						center_lat: position.coords.latitude.toFixed(6),
						center_long: position.coords.longitude.toFixed(6),
					}))
					setIsLocating(false)
				},
				(err) => {
					setError('Failed to acquire satellite lock. Please enter coordinates manually.')
					setIsLocating(false)
				},
				{ enableHighAccuracy: true, timeout: 10000 },
			)
		} else {
			setError('Geolocation is not supported by your browser.')
			setIsLocating(false)
		}
	}

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError('')

		// Validate numbers
		const lat = parseFloat(formData.center_lat)
		const lng = parseFloat(formData.center_long)
		const radius = parseFloat(formData.radius_meters)

		if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
			setError('Coordinates and Radius must be valid numbers.')
			setIsSubmitting(false)
			return
		}

		// Insert into Supabase
		const { data, error: insertError } = await supabase
			.from('events')
			.insert([
				{
					name: formData.name,
					center_lat: lat,
					center_long: lng,
					radius_meters: radius,
				},
			])
			.select()
			.single()

		if (insertError) {
			setError(insertError.message)
			setIsSubmitting(false)
		} else {
			// Redirect to the new event's Pit Wall
			router.push(`/admin/${data.id}`)
		}
	}

	return (
		<div className="min-h-screen bg-[#050505] text-[#e2e8f0] font-mono flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-md">
				{/* Header */}
				<div className="mb-8">
					<Link
						href="/admin"
						className="inline-flex items-center gap-2 text-[10px] text-[#444] hover:text-[#00eeff] uppercase tracking-widest mb-6 transition-colors"
					>
						<ChevronLeft className="w-3 h-3" /> Abort Creation
					</Link>
					<h1 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00eeff] to-[#00ff66] uppercase">
						Initialize Sector
					</h1>
					<p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Deploy new APEX Strategy Grid</p>
				</div>

				{/* The Form */}
				<form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-[#222] p-6 rounded-xl shadow-2xl space-y-6">
					{error && (
						<div className="p-3 bg-red-950/30 border border-red-500/50 rounded-md text-red-500 text-xs uppercase tracking-wider">{error}</div>
					)}

					{/* Sector Name */}
					<div className="space-y-2">
						<label className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Type className="w-3 h-3 text-[#00eeff]" /> Sector Designation
						</label>
						<input
							type="text"
							name="name"
							required
							placeholder="e.g. MAIN_STAGE_ALPHA"
							value={formData.name}
							onChange={handleChange}
							className="w-full bg-[#121212] border border-[#333] focus:border-[#00eeff] rounded-md p-3 text-sm text-white outline-none transition-colors placeholder:text-[#333]"
						/>
					</div>

					{/* Coordinates */}
					<div className="space-y-4 pt-2 border-t border-[#222]">
						<div className="flex items-center justify-between">
							<label className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
								<MapPin className="w-3 h-3 text-[#00eeff]" /> Geofence Center
							</label>

							<button
								type="button"
								onClick={handleGetLocation}
								disabled={isLocating}
								className="flex items-center gap-1 text-[9px] bg-[#00eeff]/10 text-[#00eeff] px-2 py-1 rounded border border-[#00eeff]/30 hover:bg-[#00eeff]/20 transition-colors uppercase tracking-widest"
							>
								{isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
								{isLocating ? 'Scanning...' : 'Lock Current GPS'}
							</button>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<input
								type="number"
								step="any"
								name="center_lat"
								required
								placeholder="Latitude"
								value={formData.center_lat}
								onChange={handleChange}
								className="w-full bg-[#121212] border border-[#333] focus:border-[#00eeff] rounded-md p-3 text-sm text-white outline-none transition-colors placeholder:text-[#333]"
							/>
							<input
								type="number"
								step="any"
								name="center_long"
								required
								placeholder="Longitude"
								value={formData.center_long}
								onChange={handleChange}
								className="w-full bg-[#121212] border border-[#333] focus:border-[#00eeff] rounded-md p-3 text-sm text-white outline-none transition-colors placeholder:text-[#333]"
							/>
						</div>
					</div>

					{/* Radius */}
					<div className="space-y-2 pt-2 border-t border-[#222]">
						<label className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-2">
							<Compass className="w-3 h-3 text-[#00eeff]" /> Sector Radius (Meters)
						</label>
						<div className="flex items-center gap-3">
							<input
								type="range"
								name="radius_meters"
								min="50"
								max="5000"
								step="50"
								value={formData.radius_meters}
								onChange={handleChange}
								className="flex-1 accent-[#00eeff]"
							/>
							<div className="w-20 text-right bg-[#121212] border border-[#333] rounded-md p-2 text-sm text-[#00eeff] font-bold">
								{formData.radius_meters}m
							</div>
						</div>
					</div>

					{/* Submit */}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full bg-[#00eeff] hover:bg-[#00ccdd] text-black font-bold uppercase tracking-widest text-xs p-4 rounded-md transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
					>
						{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deploy Sector'}
					</button>
				</form>
			</div>
		</div>
	)
}
