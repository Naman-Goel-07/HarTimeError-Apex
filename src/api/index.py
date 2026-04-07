from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
import os
from datetime import datetime, timedelta, timezone # 🏁 NEW: For time-windowing

app = FastAPI()

# 🛰️ DATABASE LINK
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 
supabase: Client = create_client(url, key)

@app.post("/api/py/compute/{event_id}")
async def compute_sector(event_id: str):
    """
    Recalculates the 'Urban Friction' for a sector based on a 10-minute window.
    """
    try:
        # 1. 🏁 TIME WINDOW: Only count points from the last 10 minutes
        # This keeps the 'Density' accurate as people move in and out.
        time_threshold = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        
        response = supabase.table("telemetry") \
            .select("id") \
            .eq("event_id", event_id) \
            .gt("created_at", time_threshold) \
            .execute()
        
        relay_count = len(response.data)

        # 2. X-SECTORING LOGIC
        if relay_count > 15:
            new_status = "RED"
        elif relay_count > 5:
            new_status = "YELLOW"
        else:
            new_status = "GREEN"

        # 3. UPDATE THE PIT WALL
        supabase.table("events").update({"status": new_status}).eq("id", event_id).execute()

        return {
            "event_id": event_id,
            "status": new_status,
            "live_density": relay_count,
            "window": "10m",
            "sync": "SUCCESS"
        }
    except Exception as e:
        print(f"Engine Failure: {str(e)}")
        raise HTTPException(status_code=500, detail="Telemetry analysis failed")