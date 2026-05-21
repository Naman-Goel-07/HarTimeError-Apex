from fastapi import FastAPI, HTTPException
from supabase import create_client, Client
import os
import json
import math
import numpy as np
import tensorflow as tf
from datetime import datetime, timedelta, timezone

app = FastAPI()

# grab supabase stuff from env lmao
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# load keras model (hopefully it works yay)
model_path = os.path.join(os.path.dirname(__file__), 'crowd_model.keras')
try:
    crowd_model = tf.keras.models.load_model(model_path)
    print("keras loaded yay")
except Exception as e:
    print(f"rip keras model: {e}")
    crowd_model = None

# random math stuff for vectors
def get_bearing(lat1, lon1, lat2, lon2):
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    theta = math.atan2(y, x)
    return (math.degrees(theta) + 360) % 360

@app.post("/api/py/compute/{event_id}")
async def compute_sector(event_id: str):
    # does the heavy lifting for crowds
    try:
        # last 10 mins only
        time_threshold = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        
        response = supabase.table("telemetry").select("id, created_at, latitude, longitude, device_id").eq("event_id", event_id).gt("created_at", time_threshold).order("created_at").execute()
        
        points = response.data
        headcount = len(set(p['device_id'] for p in points if p.get('device_id')))
        
        # basic status thing
        new_status = "GREEN"
        if headcount > 15:
            new_status = "RED"
        elif headcount > 5:
            new_status = "YELLOW"

        # figure out where everyone is going
        device_paths = {}
        for p in points:
            did = p.get('device_id')
            if did and p.get('latitude') and p.get('longitude'):
                if did not in device_paths:
                    device_paths[did] = []
                device_paths[did].append((p['latitude'], p['longitude']))
                
        bearings = []
        for did, coords in device_paths.items():
            if len(coords) >= 2:
                # get direction from first to last ping
                b = get_bearing(coords[0][0], coords[0][1], coords[-1][0], coords[-1][1])
                bearings.append(b)
                
        predominant_bearing = 0.0
        opposite_count = 0
        
        if bearings:
            # math magic for average angle lmao
            sin_sum = sum(math.sin(math.radians(b)) for b in bearings)
            cos_sum = sum(math.cos(math.radians(b)) for b in bearings)
            predominant_bearing = (math.degrees(math.atan2(sin_sum, cos_sum)) + 360) % 360
            
            # count ppl going the wrong way (> 135 deg)
            for b in bearings:
                diff = abs(b - predominant_bearing)
                if diff > 180:
                    diff = 360 - diff
                if diff > 135:
                    opposite_count += 1

        # time for keras predictions yay
        predicted_density = headcount
        predicted_status = new_status
        opposite_flow_detected = False
        opposite_flow_warning = "Normal flow detected."

        if crowd_model and headcount > 0:
            try:
                features = np.array([[float(headcount), float(predominant_bearing), float(opposite_count)]])
                predictions = crowd_model.predict(features, verbose=0)
                
                # [density_pred, flow_pred]
                pred_dense = int(predictions[0][0][0])
                pred_flow_prob = float(predictions[1][0][0])
                
                predicted_density = max(0, pred_dense)
                if predicted_density > 15:
                    predicted_status = "RED"
                elif predicted_density > 5:
                    predicted_status = "YELLOW"
                else:
                    predicted_status = "GREEN"
                    
                opposite_flow_detected = bool(pred_flow_prob > 0.5) or opposite_count >= 2
                if opposite_flow_detected:
                    opposite_flow_warning = f"HAZARD: {opposite_count} individuals moving against the crowd!"

            except Exception as e:
                print(f"keras failed lmao: {str(e)}")

        # push to db so ui can see it
        update_data = {
            "status": new_status,
            "predicted_status": predicted_status,
            "predicted_density": predicted_density,
            "opposite_flow_detected": opposite_flow_detected,
            "opposite_flow_warning": opposite_flow_warning
        }
        supabase.table("events").update(update_data).eq("id", event_id).execute()

        return {
            "event_id": event_id,
            "status": new_status,
            "live_density": headcount,
            "predicted_status": predicted_status,
            "predicted_density": predicted_density,
            "opposite_flow_detected": opposite_flow_detected,
            "opposite_flow_warning": opposite_flow_warning,
            "window": "10m",
            "sync": "SUCCESS"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"fail: {e}")