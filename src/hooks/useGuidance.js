"use client";

import { useMemo } from "react";

/**
 * Computes guidance instructions based on heading and crowd blob positions.
 * In production, this would use actual path-finding / ML-based analysis.
 *
 * @param {number} heading - Current heading in degrees (0–360)
 * @param {Array} blobs - Crowd blob data
 * @returns {{ message: string, suggestion: string, suggestedAngle: number|null, severity: string }}
 */
export function useGuidance(heading, blobs) {
  return useMemo(() => {
    if (!blobs || blobs.length === 0) {
      return {
        message: "AREA CLEAR",
        suggestion: "No significant crowd detected",
        suggestedAngle: null,
        severity: "low",
      };
    }

    // Find blob closest to the user's facing direction
    // User is at center (0.5, 0.5), heading determines the "facing" direction
    const headingRad = ((heading - 90) * Math.PI) / 180;
    const facingX = Math.cos(headingRad);
    const facingY = Math.sin(headingRad);

    let closestAheadBlob = null;
    let closestDot = -1;

    for (const blob of blobs) {
      const bx = blob.x - 0.5;
      const by = blob.y - 0.5;
      const dist = Math.sqrt(bx * bx + by * by);
      if (dist < 0.05) continue; // Skip blobs at center

      // Dot product: how aligned is this blob with facing direction
      const dot = (bx * facingX + by * facingY) / dist;

      if (dot > 0.3 && dot > closestDot && blob.intensity > 0.5) {
        closestDot = dot;
        closestAheadBlob = blob;
      }
    }

    if (closestAheadBlob) {
      // Calculate suggested avoidance angle
      const bx = closestAheadBlob.x - 0.5;
      const by = closestAheadBlob.y - 0.5;
      const blobAngle = (Math.atan2(by, bx) * 180) / Math.PI + 90;

      // Suggest turning away
      let avoidAngle = 45;
      const side = ((blobAngle - heading + 360) % 360) > 180 ? "left" : "right";

      const intensity = closestAheadBlob.intensity;
      let severity = "medium";
      let message = "MODERATE CROWD AHEAD";

      if (intensity > 0.7) {
        severity = "high";
        message = "HIGH CROWD AHEAD";
        avoidAngle = 45;
      }

      return {
        message,
        suggestion: `Move ${avoidAngle}° ${side} for a safer path`,
        suggestedAngle: avoidAngle,
        severity,
      };
    }

    // Check if there are any high-intensity blobs anywhere
    const hasHighBlobs = blobs.some((b) => b.intensity > 0.7);
    if (hasHighBlobs) {
      return {
        message: "DENSE AREA NEARBY",
        suggestion: "Maintain current heading",
        suggestedAngle: null,
        severity: "medium",
      };
    }

    return {
      message: "PATH CLEAR",
      suggestion: "Low crowd density around you",
      suggestedAngle: null,
      severity: "low",
    };
  }, [heading, blobs]);
}
