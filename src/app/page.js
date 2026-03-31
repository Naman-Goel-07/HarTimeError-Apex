"use client";

import Link from 'next/link';
import { Crosshair, Map as MapIcon, ChevronRight } from 'lucide-react';


/**
 * APEX — Initial Onboarding / Portal
 */
export default function APEXLandingPage() {
  // Render landing layout directly

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] text-[#e2e8f0] flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{fontFamily: 'var(--font-body)'}}>
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-dashed border-[#00eeff]/30 animate-[spin_60s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-dashed border-[#00ff66]/20 animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      <div className="max-w-md w-full z-10 space-y-8 flex flex-col justify-center">
        
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
             <Crosshair className="w-8 h-8 text-[#00eeff]" />
          </div>
          <h1 className="text-5xl font-black tracking-[0.2em] font-display text-transparent bg-clip-text bg-gradient-to-r from-[#00eeff] to-[#00ff66]" style={{fontFamily: 'var(--font-display)'}}>
            APEX
          </h1>
          <p className="text-sm font-mono tracking-widest text-[#8892a4] uppercase">Crowd Strategy System</p>
        </div>

        {/* Portal Links */}
        <div className="grid gap-4 mt-12 w-full">
          
          <Link href="/event">
            <div className="group relative bg-[#121212] border border-[#222] hover:border-[#00eeff] p-6 rounded-xl transition-all duration-300 overflow-hidden cursor-pointer flex items-center justify-between">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00eeff]/0 to-[#00eeff]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-[#1a1a1a] p-3 rounded-lg group-hover:bg-cyan-950/30 transition-colors">
                   <Crosshair className="text-[#00eeff] w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wider font-display" style={{fontFamily: 'var(--font-display)'}}>COCKPIT VIEW</h2>
                  <p className="text-xs text-[#8892a4] font-mono mt-1">Radar & Telemetry Transmission</p>
                </div>
              </div>
              
              <ChevronRight className="text-[#8892a4] group-hover:text-[#00eeff] transition-colors relative z-10" />
            </div>
          </Link>

          <Link href="/admin">
            <div className="group relative bg-[#121212] border border-[#222] hover:border-[#00ff66] p-6 rounded-xl transition-all duration-300 overflow-hidden cursor-pointer flex items-center justify-between">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ff66]/0 to-[#00ff66]/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-[#1a1a1a] p-3 rounded-lg group-hover:bg-green-950/30 transition-colors">
                   <MapIcon className="text-[#00ff66] w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wider font-display" style={{fontFamily: 'var(--font-display)'}}>PIT WALL</h2>
                  <p className="text-xs text-[#8892a4] font-mono mt-1">Strategic Map & Overview</p>
                </div>
              </div>
              
              <ChevronRight className="text-[#8892a4] group-hover:text-[#00ff66] transition-colors relative z-10" />
            </div>
          </Link>

        </div>

        <div className="text-center mt-12">
           <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-yellow-500/30 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest text-[#8892a4] font-mono whitespace-nowrap">Status: Awaiting Initialization</span>
           </div>
        </div>

      </div>

    </main>
  );
}
