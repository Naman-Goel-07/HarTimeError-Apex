from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
import os
import json
import google.generativeai as genai
from datetime import datetime, timedelta, timezone

app = FastAPI()

# 🛰️ DATABASE LINK
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

@app.post("/api/py/compute/{event_id}")
async def compute_sector(event_id: str):
    """
    Recalculates the 'Urban Friction' for a sector based on a 10-minute window,
    and uses Gemini to forecast future congestion.
    """
    try:
        # 1. 🏁 TIME WINDOW: Only count points from the last 10 minutes
        time_threshold = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        
        response = supabase.table("telemetry") \
            .select("id, created_at") \
            .eq("event_id", event_id) \
            .gt("created_at", time_threshold) \
            .execute()
        
        relay_count = len(response.data)

        # 2. X-SECTORING LOGIC (LIVE)
        if relay_count > 15:
            new_status = "RED"
        elif relay_count > 5:
            new_status = "YELLOW"
        else:
            new_status = "GREEN"

        # 3. ✨ GEMINI PREDICTION ENGINE
        predicted_status = new_status
        predicted_density = relay_count
        
        # Only attempt prediction if we have an API key and actual telemetry data to analyze
        if os.environ.get("GEMINI_API_KEY") and relay_count > 0:
            try:
                # Group data into 1-minute buckets to show flow rate
                minute_counts = {}
                for ping in response.data:
                    minute = ping['created_at'][:16]  # e.g., '2026-04-25T10:15'
                    minute_counts[minute] = minute_counts.get(minute, 0) + 1
                
                prompt = f'''
                You are an expert crowd control AI. Here is the headcount in a venue sector over the last 10 minutes (grouped by minute):
                {json.dumps(minute_counts)}
                
                Based on this growth rate, predict the exact headcount 15 minutes from now. 
                Return ONLY a valid JSON object (no formatting, no markdown) with:
                - "predicted_density": integer
                - "predicted_status": string ("RED" if >15, "YELLOW" if >5, "GREEN" if <=5)
                '''
                
                model = genai.GenerativeModel('gemini-1.5-flash')
                gemini_response = model.generate_content(prompt)
                
                # Clean up JSON formatting from Gemini if it wraps it in markdown
                result_text = gemini_response.text.strip().removeprefix('```json').removesuffix('```').strip()
                prediction = json.loads(result_text)
                
                predicted_density = prediction.get('predicted_density', relay_count)
                predicted_status = prediction.get('predicted_status', new_status)
            except Exception as e:
                print(f"✨ Gemini Engine Warning (continuing without forecast): {str(e)}")

        # 4. UPDATE THE PIT WALL
        supabase.table("events").update({
            "status": new_status,
            "predicted_status": predicted_status,
            "predicted_density": predicted_density
        }).eq("id", event_id).execute()

        return {
            "event_id": event_id,
            "status": new_status,
            "live_density": relay_count,
            "predicted_status": predicted_status,
            "predicted_density": predicted_density,
            "window": "10m",
            "sync": "SUCCESS"
        }
    except Exception as e:
        print(f"Engine Failure: {str(e)}")
        raise HTTPException(status_code=500, detail="Telemetry analysis failed")