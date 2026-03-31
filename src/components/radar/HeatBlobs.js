import { memo } from "react";
import styles from "./HeatBlobs.module.css";

/**
 * HeatBlobs — Renders crowd density blobs onto the radar surface.
 * Each blob is positioned based on x/y (0–1) and colored by intensity.
 *
 * @param {{ blobs: Array<{ id: string, x: number, y: number, intensity: number, radius: number }> }} props
 */
function HeatBlobs({ blobs }) {
  return (
    <div className={styles.blobsLayer}>
      {blobs.map((blob) => {
        const intensityClass = getIntensityClass(blob.intensity);
        const size = blob.radius * 100 * 2; // Convert radius to diameter as %

        return (
          <div
            key={blob.id}
            className={`${styles.blob} ${styles[intensityClass]}`}
            style={{
              left: `${blob.x * 100}%`,
              top: `${blob.y * 100}%`,
              width: `${size}%`,
              height: `${size}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Map intensity (0–1) to a CSS class for color.
 */
function getIntensityClass(intensity) {
  if (intensity >= 0.7) return "blobHigh";
  if (intensity >= 0.4) return "blobMedium";
  return "blobLow";
}

export default memo(HeatBlobs);
