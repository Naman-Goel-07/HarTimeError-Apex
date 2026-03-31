"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function useCompass(userLocation = null) {
  const [heading, setHeading] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // GPS Fallback States
  const previousLocationRef = useRef(null);
  const [gpsHeading, setGpsHeading] = useState(null);

  const currentHeadingRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.DeviceOrientationEvent) {
      console.log("DeviceOrientationEvent not supported");
      setIsSupported(false);
      return;
    }
    // If not iOS13+, it doesn't need explicit permission request
    if (typeof window.DeviceOrientationEvent.requestPermission !== "function") {
      console.log("Auto-granting compass permission (not iOS Safari)");
      setPermissionGranted(true);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    console.log("requestPermission clicked");
    if (typeof window !== "undefined" && window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === "function") {
      try {
        console.log("Requesting compass permission...");
        const permissionState = await window.DeviceOrientationEvent.requestPermission();
        console.log("Permission state:", permissionState);
        if (permissionState === "granted") {
          setPermissionGranted(true);
          setPermissionDenied(false);
        } else {
          console.warn("Compass permission denied by user");
          setPermissionDenied(true);
        }
      } catch (error) {
        console.error("Compass permission error:", error);
        setPermissionDenied(true);
      }
    } else {
      console.log("requestPermission not required, auto-granting");
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted || !isSupported) return;

    const handleOrientation = (event) => {
      let rawHeading = null;

      if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
        // iOS
        rawHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Android (alpha rotates counter-clockwise. Typically compass heading is 360 - alpha)
        rawHeading = 360 - event.alpha;
      }

      if (rawHeading !== null && !isNaN(rawHeading)) {
        // Normalize 0-360
        rawHeading = (rawHeading + 360) % 360;

        const now = Date.now();
        if (now - lastUpdateRef.current < 50) return; // Throttle to 20fps

        let current = currentHeadingRef.current;
        let diff = rawHeading - current;
        
        // Shortest path interpolation
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Smooth if difference is noticeable
        if (Math.abs(diff) > 0.5) {
          const newHeading = (current + diff * 0.2 + 360) % 360;
          currentHeadingRef.current = newHeading;
          setHeading(newHeading);
          lastUpdateRef.current = now;
        }
      }
    };

    console.log("Attaching deviceorientation listener");
    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("deviceorientationabsolute", handleOrientation); // Android fallback

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
    };
  }, [permissionGranted, isSupported]);

  // GPS Heading Calculation
  useEffect(() => {
    if (!userLocation) return;
    
    const prev = previousLocationRef.current;
    if (prev) {
      const R = 6371e3;
      const lat1 = (prev.latitude * Math.PI) / 180;
      const lat2 = (userLocation.latitude * Math.PI) / 180;
      const deltaLat = ((userLocation.latitude - prev.latitude) * Math.PI) / 180;
      const deltaLon = ((userLocation.longitude - prev.longitude) * Math.PI) / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance > 0.5) { // At least 0.5m of movement to trigger heading update
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;
        
        const dLon = toRad(userLocation.longitude - prev.longitude);
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
        if (!isNaN(brng)) {
          console.log("GPS heading updated:", brng);
          setGpsHeading(brng);
        }
      }
    }
    previousLocationRef.current = userLocation;
  }, [userLocation]);

  let mode = "compass";
  let finalHeading = isNaN(heading) ? 0 : heading;

  if (!isSupported || permissionDenied || !permissionGranted) {
    if (gpsHeading !== null && !isNaN(gpsHeading)) {
      mode = "movement";
      finalHeading = gpsHeading;
    } else {
      mode = "fallback";
      finalHeading = 0;
    }
  }

  return { heading: finalHeading || 0, mode, isSupported, requestPermission, permissionDenied, permissionGranted };
}
