import os
import time
import argparse
from supabase import create_client, Client
from datetime import datetime, timezone

# 🛰️ DATABASE LINK
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def inject_telemetry(event_id: str):
    print(f"🚀 Injecting simulated telemetry into Event: {event_id}")
    
    # Let's create a crowd of 20 people moving North (Bearing ~0)
    # And 5 people moving South (Bearing ~180) to trigger the hazard
    
    # Base location (roughly center)
    base_lat = 40.7128
    base_lon = -74.0060

    points = []
    
    # 1. Simulate the "Normal Crowd" (20 people moving North)
    for i in range(20):
        device_id = f"DRV-CROWD-{i}"
        # Start them slightly south, end them slightly north
        for step in range(3):
            points.append({
                "event_id": event_id,
                "device_id": device_id,
                "latitude": base_lat + (step * 0.0001), # Moving North (latitude increases)
                "longitude": base_lon,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
    # 2. Simulate the "Hazard Flow" (5 people moving South, Opposite direction)
    for i in range(5):
        device_id = f"DRV-HAZARD-{i}"
        # Start them slightly north, end them slightly south
        for step in range(3):
            points.append({
                "event_id": event_id,
                "device_id": device_id,
                "latitude": base_lat - (step * 0.0001), # Moving South (latitude decreases)
                "longitude": base_lon,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
    # Insert in batches
    print(f"Injecting {len(points)} GPS pings to trigger Keras Model...")
    supabase.table("telemetry").insert(points).execute()
    
    print("✅ Injection complete! The backend will process this in real-time.")
    print("Check your browser window. The Hazard Warning banner should appear shortly!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Inject simulated crowd flow.')
    parser.add_argument('event_id', type=str, help='The UUID of the active event sector')
    args = parser.parse_args()
    
    if not url or not key:
        print("ERROR: Supabase URL or Key is missing. Ensure .env.local is loaded.")
    else:
        inject_telemetry(args.event_id)
