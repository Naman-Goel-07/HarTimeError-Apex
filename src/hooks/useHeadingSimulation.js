"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Simulates user heading (compass direction 0–360°).
 * In production, this would read from DeviceOrientationEvent or GPS.
 *
 * @param {Object} options
 * @param {number} options.updateInterval - ms between heading updates (default: 100)
 * @param {number} options.driftSpeed - degrees per second of random drift (default: 8)
 * @returns {{ heading: number, cardinalDirection: string }}
 */
export function useHeadingSimulation({
  updateInterval = 100,
  driftSpeed = 8,
} = {}) {
  const [heading, setHeading] = useState(180); // Start facing south (matching reference)
  const targetRef = useRef(180);
  const currentRef = useRef(180);

  // Periodically pick a new random target
  useEffect(() => {
    const pickNewTarget = () => {
      const delta = (Math.random() - 0.5) * 60; // ±30° change
      targetRef.current = (targetRef.current + delta + 360) % 360;
    };

    const targetInterval = setInterval(pickNewTarget, 3000 + Math.random() * 4000);
    return () => clearInterval(targetInterval);
  }, []);

  // Smoothly interpolate toward the target
  useEffect(() => {
    const step = (driftSpeed * updateInterval) / 1000;

    const interval = setInterval(() => {
      const current = currentRef.current;
      const target = targetRef.current;

      let diff = target - current;
      // Normalize to [-180, 180]
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      const move = Math.sign(diff) * Math.min(Math.abs(diff), step);
      const next = (current + move + 360) % 360;

      currentRef.current = next;
      setHeading(Math.round(next));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, driftSpeed]);

  const cardinalDirection = getCardinalDirection(heading);

  return { heading, cardinalDirection };
}

/**
 * Convert degrees to cardinal direction string
 */
function getCardinalDirection(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}
