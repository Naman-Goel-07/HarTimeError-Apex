"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * @typedef {Object} CrowdBlob
 * @property {string} id  - Unique identifier
 * @property {number} x   - X position (0–1, relative to radar)
 * @property {number} y   - Y position (0–1, relative to radar)
 * @property {number} intensity - 0–1, maps to green/yellow/red
 * @property {number} radius - Blob radius (0–0.2)
 * @property {number} dx  - X velocity
 * @property {number} dy  - Y velocity
 */

const BLOB_PRESETS = [
  { x: 0.52, y: 0.22, intensity: 0.9, radius: 0.13 },  // High — top
  { x: 0.72, y: 0.55, intensity: 0.85, radius: 0.12 },  // High — right
  { x: 0.28, y: 0.48, intensity: 0.4, radius: 0.10 },   // Medium — left-center
  { x: 0.45, y: 0.68, intensity: 0.55, radius: 0.09 },  // Medium — bottom-left
  { x: 0.65, y: 0.35, intensity: 0.2, radius: 0.08 },   // Low — right-top
];

/**
 * Simulates crowd density blobs that drift slowly within the radar.
 * In production, replace with websocket/API data.
 *
 * @param {Object} options
 * @param {number} options.blobCount - Number of blobs (default: 5)
 * @param {number} options.updateInterval - ms between physics ticks (default: 50)
 * @returns {{ blobs: CrowdBlob[], overallDensity: string, maxIntensity: number }}
 */
export function useCrowdSimulation({
  blobCount = 5,
  updateInterval = 50,
} = {}) {
  const [blobs, setBlobs] = useState(() => initializeBlobs(blobCount));
  const blobsRef = useRef(blobs);

  // Keep ref in sync
  useEffect(() => {
    blobsRef.current = blobs;
  }, [blobs]);

  // Physics tick: drift blobs
  useEffect(() => {
    const interval = setInterval(() => {
      setBlobs((prev) =>
        prev.map((blob) => {
          let { x, y, dx, dy, radius, intensity } = blob;

          // Add small random perturbation
          dx += (Math.random() - 0.5) * 0.0004;
          dy += (Math.random() - 0.5) * 0.0004;

          // Dampen velocity
          dx *= 0.98;
          dy *= 0.98;

          // Clamp velocity
          const maxSpeed = 0.003;
          dx = clamp(dx, -maxSpeed, maxSpeed);
          dy = clamp(dy, -maxSpeed, maxSpeed);

          // Update position
          x += dx;
          y += dy;

          // Keep within radar circle (distance from center < 0.45)
          const cx = x - 0.5;
          const cy = y - 0.5;
          const dist = Math.sqrt(cx * cx + cy * cy);
          if (dist > 0.42) {
            // Bounce back toward center
            const angle = Math.atan2(cy, cx);
            dx = -Math.cos(angle) * 0.001;
            dy = -Math.sin(angle) * 0.001;
            x = 0.5 + Math.cos(angle) * 0.41;
            y = 0.5 + Math.sin(angle) * 0.41;
          }

          // Subtle intensity fluctuation
          intensity += (Math.random() - 0.5) * 0.005;
          intensity = clamp(intensity, 0.1, 1.0);

          return { ...blob, x, y, dx, dy, intensity };
        })
      );
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  // Compute overall density
  const maxIntensity = Math.max(...blobs.map((b) => b.intensity));
  const avgIntensity =
    blobs.reduce((sum, b) => sum + b.intensity, 0) / blobs.length;

  let overallDensity = "LOW";
  if (avgIntensity > 0.6) overallDensity = "HIGH";
  else if (avgIntensity > 0.35) overallDensity = "MEDIUM";

  return { blobs, overallDensity, maxIntensity };
}

function initializeBlobs(count) {
  return BLOB_PRESETS.slice(0, count).map((preset, i) => ({
    id: `blob-${i}`,
    ...preset,
    dx: (Math.random() - 0.5) * 0.002,
    dy: (Math.random() - 0.5) * 0.002,
  }));
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
