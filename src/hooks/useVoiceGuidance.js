'use client'

import { useEffect, useRef } from 'react'

function toNaturalSpeech(suggestion) {
	if (!suggestion) return null

	if (suggestion === 'Proceed on current line') {
		return 'You are on the correct path. Keep moving forward.'
	}

	if (suggestion === 'Maintain current speed and heading') {
		return 'Continue moving straight at the same speed.'
	}

	if (suggestion === 'Maintain heading with caution') {
		return 'Continue forward but stay alert.'
	}

	// "Divert X° LEFT" or "Divert X° RIGHT"
	const divertMatch = suggestion.match(/Divert\s+(\d+)°\s+(LEFT|RIGHT)/i)
	if (divertMatch) {
		const degrees = divertMatch[1]
		const direction = divertMatch[2].toLowerCase()
		return `Turn ${direction} by ${degrees} degrees.`
	}

	// Fallback: Speak the raw suggestion as-is
	return suggestion
}

export function useVoiceGuidance(suggestion, isActive) {
	const lastSpokenRef = useRef(null)
	const timeoutRef = useRef(null)

	useEffect(() => {
		if (typeof window === 'undefined' || !window.speechSynthesis) return

		// Clear any pending debounced speech on every run
		clearTimeout(timeoutRef.current)

		if (!isActive) {
			window.speechSynthesis.cancel()
			return
		}

		if (suggestion && suggestion !== lastSpokenRef.current) {
			// Debounce: wait 400ms before speaking in case suggestion changes rapidly
			timeoutRef.current = setTimeout(() => {
				const naturalText = toNaturalSpeech(suggestion)
				if (!naturalText) return

				window.speechSynthesis.cancel()

				const utterance = new SpeechSynthesisUtterance(naturalText)
				utterance.lang = 'en-US'
				utterance.rate = 0.9
				utterance.pitch = 1

				window.speechSynthesis.speak(utterance)

				lastSpokenRef.current = suggestion
			}, 400)
		}

		return () => {
			clearTimeout(timeoutRef.current)
			window.speechSynthesis.cancel()
		}
	}, [suggestion, isActive])
}
