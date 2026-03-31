import './globals.css'
// CRITICAL: Leaflet CSS must be imported at the root level for the Pit Wall to render
import 'leaflet/dist/leaflet.css'

export const metadata = {
	title: 'APEX — Crowd Strategy System',
	description: 'A real-time crowd intelligence platform inspired by F1 telemetry systems.',
	manifest: '/manifest.json',
	icons: {
		apple: '/icons/apple-touch-icon.png', // Ensure these exist in /public/icons
	},
}

// NEW: Next.js 15+ requirement for viewport settings
export const viewport = {
	themeColor: '#0a0a0a',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
}

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<head>
				{/* We keep the manual link as a backup for certain PWA browsers */}
				<link rel="manifest" href="/manifest.json" />
				{/* Font loading is handled via globals.css @import usually, 
            but keeping this here is fine for high-performance loading */}
				<link
					href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="antialiased selection:bg-[#00eeff] selection:text-black">{children}</body>
		</html>
	)
}
