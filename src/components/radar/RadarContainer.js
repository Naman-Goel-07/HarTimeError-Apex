import styles from "./RadarContainer.module.css";

/**
 * RadarContainer — Main circular container for the radar display.
 * Provides the circular layout, background, and glow effects.
 * All radar layers (grid, blobs, scan, dots) are rendered as children.
 */
export default function RadarContainer({ children }) {
  return (
    <div className={styles.radarContainer} role="img" aria-label="Crowd density radar">
      {children}
    </div>
  );
}
